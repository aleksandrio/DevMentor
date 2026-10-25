/** No RBAC (out of scope): roles separate personas; `admin` is granted only by `npm run db:user:promote`. */
export const USER_ROLES = ["student", "mentor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
