import "server-only";

export type { DbConfig } from "./config";
export { getOrm } from "./orm";
export type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
export { USER_ROLES, type UserRole } from "./entities/auth/user-role";
