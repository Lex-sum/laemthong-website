import { z } from "zod";

export const adminRoleSchema = z.enum(["owner", "admin"]);

export const userIdSchema = z.string().uuid("Invalid user");

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  role: adminRoleSchema,
});
