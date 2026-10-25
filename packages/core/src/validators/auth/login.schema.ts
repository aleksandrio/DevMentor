import { z } from "zod";
import { emailSchema } from "./email.schema";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Podaj hasło." }).min(1, "Podaj hasło."),
});

export type LoginInput = z.output<typeof loginSchema>;
