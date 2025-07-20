import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"), 
  password: z.string().min(8, "Password must be at least 8 characters long").max(256, "Password must not exceed 256 characters"),     
});

export const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // set the error to confirmPassword field
  });