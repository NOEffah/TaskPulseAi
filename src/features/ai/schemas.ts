import { z } from "zod";

// Schema for generating tasks with Gemini
export const generateTasksSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters."),
  projectId: z.string().min(5, "Project ID is required."),
});

// You can define more schemas here as needed in the future...
const aiGeneratedTaskSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: z.enum(["backlog", "in-progress", "done"]),
  priority: z.enum(["high", "medium", "low"]),
  dueDate: z.string().optional(), // ISO format
});

export const aiGeneratedTasksArraySchema = z.array(aiGeneratedTaskSchema);