import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  generateTasksSchema,
  aiGeneratedTasksArraySchema,
} from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import { generateTasksWithGemini } from "@/lib/ai/googleGeminiAPI";
import { DATABASE_ID, PROJECTS_ID, TASKS_ID } from "@/config";
import { ID } from "node-appwrite";
import { Project } from "@/features/projects/types";
import { Task } from "@/features/tasks/types";
import { TaskStatus, TaskPriority } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";
import { createAdminClient } from "@/lib/appwrite";

const app = new Hono().
post(
  "/generate-tasks",
  sessionMiddleware,
  validator("json", (value, c) => {
    const result = generateTasksSchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data;
  }),
  async (c) => {
    const { projectId, prompt } = c.req.valid("json");
    const user = c.get("user");
    const databases = c.get("databases");
    

    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const workspaceId = project.workspaceid;
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    const { users } = await createAdminClient();
    const userInfo = await users.get(member.userid);  
    const priorityMap: Record<string, TaskPriority> = {
      "low": TaskPriority.LOW,
      "medium": TaskPriority.MEDIUM,
      "high": TaskPriority.HIGH,
      "urgent": TaskPriority.URGENT,
    };
    

    const aiTasksText = await generateTasksWithGemini(prompt);


    if (!aiTasksText) {
      return c.json({ error: "AI failed to generate tasks" }, 500);
    }

    // ✅ Validate AI JSON
    let aiTasks;
    try {
      const parsed = JSON.parse(aiTasksText);
      const validated = aiGeneratedTasksArraySchema.safeParse(parsed);
      if (!validated.success) {
        console.error("AI response validation failed:", validated.error.flatten());
        return c.json({ error: "AI response format is invalid", details: validated.error.flatten() }, 400);
      }
      aiTasks = validated.data;
    } catch (err) {
      console.error("Failed to parse AI response:", err, aiTasksText);
      return c.json({ error: "Invalid AI response format." }, 400);
    }

    
    // ✅ Create Tasks
    const tasks = await Promise.all(
      aiTasks.map(async (task, i) => {
        try {
          const createdTask = await databases.createDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            ID.unique(),
            {
              name: task.name,
              description: task.description,
              status: TaskStatus.TODO, // Always set to TODO
              priority: priorityMap[task.priority.toLowerCase()] ?? TaskPriority.MEDIUM,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
              workspaceId,
              projectId,
              assigneeId: user.$id,
              position: (i + 1) * 1000,
            }
          );
          return createdTask;
        } catch (err) {
          console.error("Failed to create task:", task, err);
          return null;
        }
      })
    );
    
 // ✅ Enrich assignee
const enrichedAssignee = {
  ...member,
  name: userInfo.name,
  email: userInfo.email,
};

// ✅ Add assignee to each created task
const enrichedTasks = tasks
  .filter((task): task is Task => task !== null)
  .map((task) => ({
    ...task,
    assignee: enrichedAssignee,
  }));

return c.json({ data: enrichedTasks }, 201);

  }
);

export default app;
