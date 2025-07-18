// src/app/api/ai/server/route.ts

import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  generateTasksSchema, // Your Zod schema for validation
  aiGeneratedTasksArraySchema, // Your Zod schema for AI response validation
} from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import { generateTasksWithGemini } from "@/lib/ai/googleGeminiAPI"; // The function that calls Google Gemini
import { DATABASE_ID, PROJECTS_ID, TASKS_ID, MEMBERS_ID } from "@/config";
import { ID } from "node-appwrite";
import { Project } from "@/features/projects/types";
import { Task, TaskStatus, TaskPriority } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";
import { createAdminClient } from "@/lib/appwrite";
import { AIGeneratedTask } from "../types";
import { Databases } from "node-appwrite";
import { Member, MemberRole } from "@/features/members/types"; // Import Member and MemberRole
import { Models } from "node-appwrite";

interface MemberForAI {
  id: string;
  name: string;
  speciality: string;
}

export async function addProjectToMembers(
  databases: Databases,
  memberIds: string[],
  projectId: string
) {
  for (const memberId of memberIds) {
    try {
      const member = await databases.getDocument<Models.Document & { projectIds?: string[] }>(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );
      const currentProjects: string[] = Array.isArray(member.projectIds)
        ? member.projectIds
        : [];

      const updatedProjects = Array.from(new Set([...currentProjects, projectId]));

      await databases.updateDocument(DATABASE_ID, MEMBERS_ID, memberId, {
        projectIds: updatedProjects,
      });
    } catch (err) {
      console.error(`Failed to update member ${memberId} with projectId ${projectId}`, err);
    }
  }
}

const app = new Hono().post(
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
    const { projectId, prompt, members: frontendSelectedMembers } = c.req.valid("json");
    const user = c.get("user");
    const databases = c.get("databases");

    const project = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );
    const workspaceId = project.workspaceid;

    const membersForAIAndAssigneeResolution: MemberForAI[] = frontendSelectedMembers || [];

    // Fetch the current user's member document.
    // It's crucial that getMember returns a Member object that *has* the userId property.
    const currentUserMember: Member = await getMember({
      databases,
      workspaceId,
      userId: user.$id, // Pass user.$id to getMember
    }) as Member; // Assert that the returned document fits the Member type structure.

    if (!currentUserMember) {
        return c.json({ error: "Current user member not found in workspace" }, 401);
    }

    // Now, ensure currentUserMember.userid is valid before passing it to users.get()
    if (!currentUserMember.userid) {
        console.error("currentUserMember.userid is missing:", currentUserMember);
        return c.json({ error: "Current user member document is incomplete (missing userId)" }, 500);
    }

    // Create an admin client to fetch full user details for the current user.
    // The userId should come from the successfully fetched currentUserMember.
    const { users } = await createAdminClient();
    const currentUserInfo = await users.get(currentUserMember.userid); //

    const statusMap: Record<string, TaskStatus> = {
      backlog: TaskStatus.BACKLOG,
      todo: TaskStatus.TODO,
      "in-progress": TaskStatus.IN_PROGRESS,
      in_review: TaskStatus.IN_REVIEW,
      done: TaskStatus.DONE,
    };

    const priorityMap: Record<string, TaskPriority> = {
      low: TaskPriority.LOW,
      medium: TaskPriority.MEDIUM,
      high: TaskPriority.HIGH,
      urgent: TaskPriority.URGENT,
    };

    const membersForGeminiPrompt = membersForAIAndAssigneeResolution.map(m => ({
      name: m.name,
      speciality: m.speciality
    }));

    const aiTasksText = await generateTasksWithGemini(
      prompt,
      membersForGeminiPrompt
    );


    if (!aiTasksText) {
      return c.json({ error: "AI failed to generate tasks" }, 500);
    }

    let aiTasks: AIGeneratedTask[];
    try {
      const parsed = JSON.parse(aiTasksText);
      const validated = aiGeneratedTasksArraySchema.safeParse(parsed);
      if (!validated.success) {
        console.error("AI response validation failed:", validated.error.flatten());
        return c.json(
          { error: "AI response format is invalid", details: validated.error.flatten() },
          400
        );
      }
      aiTasks = validated.data;

    } catch (err) {
      console.error("Failed to parse AI response:", err, aiTasksText);
      return c.json({ error: "Invalid AI response format." }, 400);
    }

    const createdTasks = await Promise.all(
      aiTasks.map(async (task, i) => {
        const assignee = membersForAIAndAssigneeResolution.find(
          (m: MemberForAI) => m.name.toLowerCase().trim() === task.assigneeName.toLowerCase().trim()
        );

        const assigneeId = assignee?.id ?? currentUserMember.$id;

        try {
          console.log("Creating task:", {
            name: task.name,
            aiAssigneeName: task.assigneeName,
            resolvedAssigneeId: assigneeId,
            resolvedAssigneeName: assignee?.name || currentUserInfo.name,
          });

          const createdTask = await databases.createDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            ID.unique(),
            {
              name: task.name,
              description: task.description,
              status: statusMap[task.status.toLowerCase()] ?? TaskStatus.TODO,
              priority: priorityMap[task.priority.toLowerCase()] ?? TaskPriority.MEDIUM,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
              workspaceId,
              projectId,
              assigneeId,
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

    const successfullyCreatedTasks = createdTasks.filter((task): task is Task => task !== null);

    const enrichedTasks = await Promise.all(successfullyCreatedTasks.map(async (task) => {
        let finalAssignee: Member;

        if (task.assigneeId === currentUserMember.$id) {
            finalAssignee = currentUserMember;
        } else {
            try {
                finalAssignee = await databases.getDocument<Member>(
                    DATABASE_ID,
                    MEMBERS_ID,
                    task.assigneeId
                );
            } catch (err) {
                console.warn(`Could not fetch full member details for assigneeId: ${task.assigneeId}. Falling back to partial data.`, err);

                const assigneeFromFrontendList = membersForAIAndAssigneeResolution.find(m => m.id === task.assigneeId);

                finalAssignee = {
                    $id: task.assigneeId,
                    name: assigneeFromFrontendList?.name || "Unknown Assignee",
                    speciality: assigneeFromFrontendList?.speciality || "Unknown",
                    email: assigneeFromFrontendList?.name ? `${assigneeFromFrontendList.name.toLowerCase().replace(/\s/g, '.')}@example.com` : "unknown@example.com",
                    userid: task.assigneeId,
                    workspaceId: workspaceId,
                    projectIds: [],
                    role: MemberRole.MEMBER,

                    $collectionId: MEMBERS_ID,
                    $databaseId: DATABASE_ID,
                    $createdAt: new Date().toISOString(),
                    $updatedAt: new Date().toISOString(),
                    $permissions: []
                } as Member;
            }
        }

        return {
            ...task,
            assignee: finalAssignee,
        };
    }));

    await addProjectToMembers(
      databases,
      membersForAIAndAssigneeResolution.map((m) => m.id),
      project.$id
    );

    return c.json({ data: enrichedTasks }, 201);
  }
);

export default app;