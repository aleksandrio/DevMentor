import { defineEntity, p } from "@mikro-orm/postgresql";
import { baseProperties } from "../base.entity";
import { USER_ROLES } from "./user-role";

// RFC 5321 caps a forward path at 256 octets including the angle brackets.
const MAX_EMAIL_LENGTH = 254;
const MAX_DISPLAY_NAME_LENGTH = 100;

const UserSchema = defineEntity({
  name: "User",
  tableName: "users",
  properties: {
    ...baseProperties,
    /** Stored lowercase; unique so concurrent registrations cannot duplicate it. */
    email: p.string().length(MAX_EMAIL_LENGTH).unique(),
    /** bcrypt hash; never serialized. */
    passwordHash: p.string().hidden(),
    displayName: p.string().length(MAX_DISPLAY_NAME_LENGTH),
    role: p.enum(USER_ROLES).default("student"),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
