import { z } from "zod";

// ✅ Schema for generating tasks with Gemini AI (Updated for Option B)
export const generateTasksSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters."),
  projectId: z.string().min(5, "Project ID is required."),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      speciality: z.string(),
    })
  ),
});

// ✅ Schema for AI-generated task objects
const aiGeneratedTaskSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: z.enum(["backlog", "in-progress", "done"]),
  priority: z.enum(["high", "medium", "low"]),
  dueDate: z.string().optional(), // ISO format
  assigneeName: z.string(),
});

// ✅ Schema for an array of tasks
export const aiGeneratedTasksArraySchema = z.array(aiGeneratedTaskSchema);
