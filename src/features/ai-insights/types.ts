// src/features/ai/ai-insights/types.ts

import { z } from "zod";
import { aiInsightsResponseSchema } from "./schemas";

// Type for the AI-generated insights response
export type AiInsightsResponse = z.infer<typeof aiInsightsResponseSchema>;