import { z } from "zod";
import { emailSchema } from "./email.schema";

const MIN_PASSWORD_LENGTH = 8;
// bcrypt ignores everything past 72 bytes; reject longer input instead of
// silently truncating it.
const MAX_PASSWORD_BYTES = 72;

export const registerSchema = z.object({
  email: emailSchema,
  displayName: z
    .string({ error: "Podaj imię lub nazwę." })
    .trim()
    .min(2, "Podaj imię lub nazwę (min. 2 znaki).")
    .max(100, "Nazwa może mieć najwyżej 100 znaków."),
  password: z
    .string({ error: "Podaj hasło." })
    .min(MIN_PASSWORD_LENGTH, `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`)
    .refine(
      (password) => new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES,
      `Hasło może mieć najwyżej ${MAX_PASSWORD_BYTES} bajty.`,
    ),
});

export type RegisterInput = z.output<typeof registerSchema>;
