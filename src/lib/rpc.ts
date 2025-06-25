// lib/rpc.ts
import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const client = hc<AppType>(baseUrl);
