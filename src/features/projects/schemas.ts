import { z } from "zod";


export const querySchema = z.object({
  workspaceId: z.string(),
});

export const createProjectSchema = z.object({
    name: z.string().trim().min(1, 'Project name is required'),
    image: z.union([
        z.instanceof(File),
        z.string().transform((value) => value === "" ? undefined : value),
    ]).optional(),
    workspaceId: z.string(),
    members: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().trim().min(1, 'Minimum 1 character required').optional(),
    image: z.union([
        z.instanceof(File),
        z.string().transform((value) => value === "" ? undefined : value),
    ]).optional(),
    members: z.array(z.string()).optional(),

});