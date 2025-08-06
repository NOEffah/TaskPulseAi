// src/features/analytics/server/route.ts

import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { getWorkspaceAnalytics } from "./analytics-service";
import { getMember } from "@/features/members/utils";

const app = new Hono()
.get(
    "/workspaces/:workspaceId",
    validator("param", (value, c) => {
        const parsed = z.object({ workspaceId: z.string() }).safeParse(value);
        if (!parsed.success) {
            return c.json({ errors: parsed.error.flatten() }, 400);
        }
        return parsed.data;
    }),
    sessionMiddleware,
    async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");
        // Access the validated data
        const { workspaceId } = c.req.valid("param");

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id,
        });

        if (!member) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const data = await getWorkspaceAnalytics(databases, workspaceId);
        return c.json({ data });
    }
);


export default app;