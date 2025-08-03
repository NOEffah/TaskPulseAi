import { Hono } from 'hono';
import { createWorkspaceSchema } from '../schemas';
import { updateWorkspaceSchema } from '../schemas';
import { validator } from 'hono/validator';
import { sessionMiddleware } from '@/lib/session-middleware';
import { DATABASE_ID, IMAGES_BUCKET_ID, MEMBERS_ID, TASKS_ID, WORKSPACES_ID } from '@/config';
import { ID, Query } from 'node-appwrite';
import { MemberRole } from '@/features/members/types';
import { generateInviteCode } from '@/lib/utils';
import { getMember } from '@/features/members/utils';
import { joinWorkspaceSchema } from '../schemas'
import { Workspace } from '../types';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { TaskStatus } from '@/features/tasks/types';

const app = new Hono()
    .get("/", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [
                Query.equal("userid", user.$id)
            ]
        )

        if (members.total === 0) {
            return c.json({ data: { documents: [], total: 0 } })
        }

        const workspaceIds = members.documents.map((member) => member.workspaceid)

        const workspaces = await databases.listDocuments(
            DATABASE_ID,
            WORKSPACES_ID,
            [
                Query.orderDesc("$createdAt"),
                Query.equal("$id", workspaceIds)
            ],
        )
        return c.json({ data: workspaces })
    })
    .get("/:workspaceId", 
      sessionMiddleware, 
      async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { workspaceId } = c.req.param();
        
        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });
        if (!member) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const workspace = await databases.getDocument<Workspace>(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId,
        );
        return c.json({ data: workspace });

      })
       .get("/", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [
                Query.equal("userid", user.$id)
            ]
        )

        if (members.total === 0) {
            return c.json({ data: { documents: [], total: 0 } })
        }

        const workspaceIds = members.documents.map((member) => member.workspaceid)

        const workspaces = await databases.listDocuments(
            DATABASE_ID,
            WORKSPACES_ID,
            [
                Query.orderDesc("$createdAt"),
                Query.equal("$id", workspaceIds)
            ],
        )
        return c.json({ data: workspaces })
    })
    .get("/:workspaceId/info", 
      sessionMiddleware, 
      async (c) => {

        const databases = c.get("databases");
        const { workspaceId } = c.req.param();
        
        
        const workspace = await databases.getDocument<Workspace>(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId,
        );
        return c.json({ 
          data: { 
          $id: workspace.$id, 
          name: workspace.name,
           imageUrl: workspace.imageUrl 
          } });

      })
    .post(
        "/",
        validator("form", (value, c) => {
            const parsed = createWorkspaceSchema.safeParse(value);
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

            const { name, image, speciality } = c.req.valid("form");


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

            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name,
                    userid: user.$id,
                    imageUrl: uploadedImageUrl,
                    inviteCode: generateInviteCode(7),
                }

            );
            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    userid: user.$id,
                    workspaceid: workspace.$id,
                    role: MemberRole.ADMIN,
                    speciality,

                }

            )
            return c.json({ data: workspace });
        }
    )
.patch(
  "/:workspaceId",
  validator("form", async (value, c) => {
    const parsed = updateWorkspaceSchema.safeParse(value);
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
    const { workspaceId } = c.req.param();

    const { name, image, speciality } = c.req.valid("form");


    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
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
    const workspace = await databases.updateDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
      {
        name,
        imageUrl: uploadedImageUrl,
      }
    );
    await databases.updateDocument(
      DATABASE_ID,
      MEMBERS_ID,
      member.$id,
      {
        speciality,
      }
    );

    return c.json({  data: workspace  });
  }
)
.delete(
  "/:workspaceId",
  sessionMiddleware,
  async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { workspaceId } = c.req.param();

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if(!member || member.role !== MemberRole.ADMIN){
      return c.json({ error: "Unathorized"}, 401);
    }

    // TODO : Delete members, projects and tasks

    await databases.deleteDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
    );

    return c.json({ data: { $id: workspaceId }})
  }
)
.post(
  "/:workspaceId/reset-invite-code",
  sessionMiddleware,
  async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { workspaceId } = c.req.param();

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    })

    if(!member || member.role !== MemberRole.ADMIN){
      return c.json({ error: "Unathorized"}, 401);
    }


    const workspace = await databases.updateDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
      {
        inviteCode: generateInviteCode(7),
      }
    );

    return c.json({ data: { $id: workspace }})
  }
)
.post(
  "/:workspaceId/join",  
  sessionMiddleware,  
   validator("json", (value, c) => {
    const parsed = joinWorkspaceSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ errors: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  }),
  sessionMiddleware,
  async (c) => {
    const { workspaceId } = c.req.param();
    const { code, speciality } = c.req.valid("json");
    const databases = c.get("databases");
    const user = c.get("user");

    // Check if user is already a member
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (member) {
      return c.json({ error: "Already a member" }, 400);
    }

    // Fetch workspace document
    const workspace = await databases.getDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId
    );

    // Validate invite code
    if (workspace.inviteCode !== code) {
      return c.json({ error: "Invalid invite code" }, 400);
    }

    // Create member entry
    await databases.createDocument(
      DATABASE_ID,
      MEMBERS_ID,
      ID.unique(),
      {
        workspaceid: workspaceId,
        userid: user.$id,
        role: MemberRole.MEMBER,
        speciality,
      }
    );

    return c.json({ data: workspace });
  }
)
.get(
  "/:workspaceId/analytics",
   sessionMiddleware,
  async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.param();

    const member = await getMember({
      databases,
      workspaceId,
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
        Query.equal("workspaceId", workspaceId),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );
      const lastMonthTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("workspaceId", workspaceId),
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
        Query.equal("workspaceId", workspaceId),
        Query.equal("assigneeId", member.$id),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthAssignedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("workspaceId", workspaceId),
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
        Query.equal("workspaceId", workspaceId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthIncompleteTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("workspaceId", workspaceId),
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
        Query.equal("workspaceId", workspaceId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
 );

 const lastMonthCompletedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("workspaceId", workspaceId),
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
        Query.equal("workspaceId", workspaceId),
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
        Query.equal("workspaceId", workspaceId),
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