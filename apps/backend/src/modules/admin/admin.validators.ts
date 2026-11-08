import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional(),
  search: z.string().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
