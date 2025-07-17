import { z } from 'zod';
import { MemberRole } from '../members/types';

export const createWorkspaceSchema = z.object({
    name: z.string().trim().min(1, 'Workspace name is required'),
    image: z.union([
        z.instanceof(File),
        z.string().transform((value) => value === "" ? undefined : value),
    ]).optional(),
    speciality: z.string().min(1, "Speciality is required"),
});

export const updateWorkspaceSchema = z.object({
    name: z.string().trim().min(1, 'Must be 1 or more characters').optional(),
    image: z.union([
        z.instanceof(File),
        z.string().transform((value) => value === "" ? undefined : value),
    ]).optional(),
     speciality: z.string().min(1, "Speciality is required"),
});

export const joinWorkspaceSchema = z.object({
  code: z.string(),
  speciality: z.string().min(1, "Speciality is required"),
});

export const roleSchema = z.object({
  role: z.nativeEnum(MemberRole),
});