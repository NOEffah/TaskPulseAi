import { sessionMiddleware } from "@/lib/session-middleware";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { querySchema, updateProjectSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, PROJECTS_ID, IMAGES_BUCKET_ID, TASKS_ID } from "@/config";
import { ID, Query } from 'node-appwrite';
import { createProjectSchema } from "../schemas";
import { Project } from "../types";


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

    const projects = await databases.listDocuments(
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
                }

            );

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
.delete("/:projectId", sessionMiddleware, async (c) => {
  const databases = c.get("databases");
  const user = c.get("user");
  const { projectId } = c.req.param();

  const existingProject = await databases.getDocument<Project>(
    DATABASE_ID,
    PROJECTS_ID,
    projectId
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

  // ✅ Step 2: Delete the project
  await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

  return c.json({ data: { $id: projectId } });
});




export default app;
