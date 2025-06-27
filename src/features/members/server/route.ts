import { Hono } from "hono";
import { z } from "zod";

import { sessionMiddleware } from "@/lib/session-middleware";
import { validator } from "hono/validator";
import { getMember } from "../utils";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { Query } from "node-appwrite";
import { MemberRole } from "../types";
import { roleSchema } from "@/features/workspaces/schemas";

const querySchema = z.object({
  workspaceId: z.string(),
});

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
    const { users } = await createAdminClient();
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.valid("query");

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const members = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [Query.equal("workspaceid", workspaceId)] // 🛠 Be sure `workspaceid` matches your schema
    );

    const populatedMembers = await Promise.all(
      members.documents.map(async (member) => {
        const user = await users.get(member.userid);
        return {
          ...member,
          name: user.name,
          email: user.email,
        };
      })
    );

    return c.json({
      data: {
        ...members,
        documents: populatedMembers,
      },
    });
  }
)
.delete(
    "/:memberId",
    sessionMiddleware,
    async (c) => {
        const { memberId } = c.req.param();
        const  user  = c.get("user");
        const databases = c.get("databases");

        const memberToDelete = await databases.getDocument(
          DATABASE_ID,
          MEMBERS_ID,
          memberId,
        );
        
        if (!memberToDelete?.workspaceid) {
          return c.json({ error: "Invalid member: workspaceid is missing" }, 400);
        }
        
        const allMembersInWorkspace = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_ID,
          [
            Query.equal("workspaceid", memberToDelete.workspaceid)
          ]
        )
        const member = await getMember({
            databases,
            workspaceId: memberToDelete.workspaceid,
            userId: user.$id
        })


        if(!member){
            return c.json({
                error: "Unathorized"
            },401)
        }
        
        if (member.id !== memberToDelete.id && member.role !== MemberRole.ADMIN){
            return c.json({
                error: "Unathorized"
            },401)
        }

        if (allMembersInWorkspace.total === 1){
            return c.json({
                error: "Cannot delete the only member"
            },401)
        }

        await databases.deleteDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId,
        )

        return c.json({ data: { $id: memberToDelete.$id }})

    }
)
.patch(
  "/:memberId",
  validator("json", (value, c) => {
    const parsed = roleSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ errors: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  }),
  sessionMiddleware,
  async (c) => {
        const { memberId } = c.req.param();
        const  user  = c.get("user");
        const databases = c.get("databases");
        const { role } =c.req.valid("json")

        const memberToUpdate = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId,
        );


        const allMembersInWorkspace = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [
                Query.equal("workspaceid", memberToUpdate.workspaceid)
            ]
        );

        const member = await getMember({
            databases,
            workspaceId: memberToUpdate.workspaceid,
            userId: user.$id
        })

        if(!member){
            return c.json({
                error: "Unathorized"
            },401)
        }
        
        if (member.id  !== MemberRole.ADMIN){
            return c.json({
                error: "Unathorized"
            },401)
        }

        if (allMembersInWorkspace.total === 1){
            return c.json({
                error: "Cannot downgrade the only member"
            },401)
        }

        await databases.updateDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId,{
              role,
            }
        )

        return c.json({ data: { $id: memberToUpdate.$id }})
  }
);

export default app;
