// src/features/ai/ai-insights/schemas.ts

import { z } from "zod";

// Schema for the request body to generate AI insights
export const generateInsightsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required."),
});

// Zod schema for the AI-generated insights response
// The AI will return a structured string, so we validate it as a string
export const aiInsightsResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  performanceMetrics: z.string(),
  futureProjections: z.string(),
});