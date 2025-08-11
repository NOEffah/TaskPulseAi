// src/features/ai-insights/server/route.ts

import { Hono } from "hono";
import { validator } from "hono/validator";
import { generateInsightsSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  generateInsightsWithGemini,
  InsightsData,
} from "@/lib/ai/googleGeminiAPI";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, PROJECTS_ID, TASKS_ID, MEMBERS_ID } from "@/config";
import { Query } from "node-appwrite";
import { Project } from "@/features/projects/types";
import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";

const aiInsights = new Hono();

aiInsights.post(
  "/",
  sessionMiddleware,
  validator("json", (value, c) => {
    const result = generateInsightsSchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data;
  }),
  async (c) => {
    const { workspaceId } = c.req.valid("json");
    const { databases, users } = await createAdminClient();

    try {
      // 1. Fetch Projects
      const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        [Query.equal("workspaceid", workspaceId)]
      );

      // 2. Fetch Tasks
      const tasks = await databases.listDocuments<Task>(
        DATABASE_ID,
        TASKS_ID,
        [Query.equal("workspaceId", workspaceId)]
      );

      for (const project of projects.documents) {
      const projectTasks = tasks.documents.filter(
        (task) => task.projectId === project.$id
      );

      if (
        projectTasks.length > 0 &&
        projectTasks.every((task) => task.status === "DONE")
      ) {
        // Only update if not already COMPLETED
        if (project.status !== "COMPLETED") {
          await databases.updateDocument(
            DATABASE_ID,
            PROJECTS_ID,
            project.$id,
            { status: "COMPLETED" }
          );
          project.status = "COMPLETED"; // update in local object too
        }
      }
    }

      // 3. Fetch Members and their task data
      const members = await databases.listDocuments<Member>(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("workspaceid", workspaceId)]
      );

      const memberTaskData = await Promise.all(
        members.documents.map(async (member) => {
          try {
            const user = await users.get(member.userid); // get real profile
            return {
              name: user.name || "Unknown",
              completedTasks: tasks.documents.filter(
                (task) => task.assigneeId === member.$id && task.status === "DONE"
              ).length,
              totalTasks: tasks.documents.filter(
                (task) => task.assigneeId === member.$id
              ).length,
            };
          } catch (error) {
            console.error(`Failed to fetch user ${member.userid}:`, error);
            return {
              name: "Unknown",
              completedTasks: 0,
              totalTasks: 0,
            };
          }
        })
      );


      // Assemble data for the AI
      const insightsData: InsightsData = {
        projects: {
          total: projects.total,
          completed: projects.documents.filter(
            (p) => p.status === "COMPLETED"
          ).length,
        },
        tasks: {
          total: tasks.total,
          completed: tasks.documents.filter(
            (t) => t.status === "DONE"
          ).length,
        },
        members: memberTaskData,
        
      };

      // 4. Call the Gemini AI function
      const aiInsight = await generateInsightsWithGemini(insightsData);
      if (!aiInsight) {
        return c.json({ error: "AI failed to generate insights" }, 500);
      }

      return c.json(JSON.parse(aiInsight));
    } catch (err) {
      console.error("Failed to generate AI insights:", err);
      return c.json({ error: "Failed to generate AI insights." }, 500);
    }
  }
);

export default aiInsights;