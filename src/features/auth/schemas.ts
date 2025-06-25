import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"), 
  password: z.string().min(8, "Password must be at least 8 characters long").max(256, "Password must not exceed 256 characters"),     
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(256, "Name must not exceed 256 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long").max(256, "Password must not exceed 256 characters"),
});