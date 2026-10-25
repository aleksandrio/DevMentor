import { z } from "zod";

// Matches the users.email column (RFC 5321 limit).
const MAX_EMAIL_LENGTH = 254;

/** Trimmed, lowercased e-mail: the form of every stored and looked-up address. */
export const emailSchema = z
  .string({ error: "Podaj adres e-mail." })
  .trim()
  .toLowerCase()
  .max(MAX_EMAIL_LENGTH, "Adres e-mail jest za długi.")
  .pipe(z.email("Podaj poprawny adres e-mail."));
