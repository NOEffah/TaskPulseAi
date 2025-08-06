import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { querySchema, updateProjectSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, PROJECTS_ID, IMAGES_BUCKET_ID, TASKS_ID } from "@/config";
import { ID, Query } from 'node-appwrite';
import { createProjectSchema } from "../schemas";
import { Project } from "../types";
import { MEMBERS_ID } from "@/config";
import { Databases } from "node-appwrite";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { TaskStatus } from "@/features/tasks/types";

async function addProjectToMembers(databases: Databases, projectId: string, memberIds: string[] = []) {
  for (const memberId of memberIds) {
    try {
      const member = await databases.getDocument(DATABASE_ID, MEMBERS_ID, memberId);
      const currentProjects = member.projectIds || [];
      const updatedProjects = [...new Set([...currentProjects, projectId])];

      await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
        projectIds: updatedProjects,
      });
    } catch (error) {
      console.error(`Failed to update member ${memberId}`, error);
    }
  }
}


const app = new Hono()
.get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ errors: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  }),
  sessionMiddleware,
  async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    

    const { workspaceId } = c.req.valid("query");

    if(!workspaceId) {
        return c.json({error: "Missing workspaceId"}, 400)
    }
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projects = await databases.listDocuments<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      [
        Query.equal("workspaceid", workspaceId),
        Query.orderDesc("$createdAt"),
      ]
    );

    return c.json({ data: projects });
  }
)
.get(
  "/:projectId",
  sessionMiddleware,
  async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: project.workspaceid,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: project });
  }
)
.post(
        "/",
        validator("form", (value, c) => {
            const parsed = createProjectSchema.safeParse(value);
            if (!parsed.success) {
                return c.json({ errors: parsed.error.flatten() }, 400);
            }
            return parsed.data;
        }),
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image, workspaceId, members } = c.req.valid("form");


            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });
         

            if(!member){
                return c.json({ error: "Unthorized"}, 401);
            }

            let uploadedImageUrl: string | undefined = undefined;

            if (image instanceof File) {
                // Upload the image to the storage bucket
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );
                uploadedImageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;

            }

            const project = await databases.createDocument(
                DATABASE_ID,
                PROJECTS_ID,
                ID.unique(),
                {
                    name,
                    imageUrl: uploadedImageUrl,
                    workspaceid: workspaceId,
                    members,
                    status: "ACTIVE",
                }

            );

            await addProjectToMembers(databases, project.$id, members);

            return c.json({ data: project });
        }
)
.patch(
  "/:projectId",
  validator("form", async (value, c) => {
    const parsed = updateProjectSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid form input", details: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  }),
  sessionMiddleware,
  async (c) => {
    const databases = c.get("databases");
    const storage = c.get("storage");
    const user = c.get("user");
    const { projectId } = c.req.param();

    const { name, image } = c.req.valid("form");

    const existingProject = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    )

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceid,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let uploadedImageUrl: string | undefined = undefined;

    if (image instanceof File) {
      const file = await storage.createFile(
        IMAGES_BUCKET_ID,
        ID.unique(),
        image
      );
      uploadedImageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;
    }
    else{
        uploadedImageUrl = image;
    }

    // Update the workspace
    const project = await databases.updateDocument(
      DATABASE_ID,
      PROJECTS_ID,
      projectId,
      {
        name,
        imageUrl: uploadedImageUrl,
      }
    );

    return c.json({  data: project  });
  }
)
.delete(
  "/:projectId", sessionMiddleware, async (c) => {
  const databases = c.get("databases");
  const user = c.get("user");
  const { projectId } = c.req.param();

  const existingProject = await databases.getDocument<Project>(
    DATABASE_ID,
    PROJECTS_ID,
    projectId,
  );

  const member = await getMember({
    databases,
    workspaceId: existingProject.workspaceid,
    userId: user.$id,
  });

  if (!member) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // ✅ Step 1: Delete related tasks (only real relationship)
  const tasks = await databases.listDocuments(
    DATABASE_ID,
    TASKS_ID,
    [Query.equal("projectId", projectId)]
  );

  if (tasks.documents.length) {
    await Promise.all(
      tasks.documents.map((task) =>
        databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id)
      )
    );
  }


  await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

  return c.json({ data: { $id: projectId } });
})
.get(
  "/:projectId/analytics",
   sessionMiddleware,
  async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: project.workspaceid,
      userId: user.$id,
    });


    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );
      const lastMonthTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
 );

  const taskCount = thisMonthTasks.total;
  const taskDifference = taskCount - lastMonthTasks.total;

   const thisMonthAssignedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("assigneeId", member.$id),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthAssignedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("assigneeId", member.$id),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
 );

  const assignedTaskCount = thisMonthAssignedTasks.total;
  const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks.total;
    
 const thisMonthIncompleteTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthIncompleteTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
 );

 const incompleteTaskCount = thisMonthIncompleteTasks.total;
 const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks.total;

  const thisMonthCompletedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthCompletedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
 );

 const completedTaskCount = thisMonthCompletedTasks.total;
 const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks.total;

  const thisMonthOverdueTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.lessThan("dueDate", now.toISOString()),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthOverdueTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

     const overdueTaskCount = thisMonthCompletedTasks.total;
     const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks.total;

     return c.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifference,
        incompleteTaskCount,
        incompleteTaskDifference,
        completedTaskCount,
        completedTaskDifference,
        overdueTaskCount,
        overdueTaskDifference,
        thisMonthOverdueTasks
      }
     })
  }
)



export default app;
