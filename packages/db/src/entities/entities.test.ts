import { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createOrmOptions } from "../config";
import { User } from "./auth/user.entity";
import { USER_ROLES } from "./auth/user-role";
import { entities } from "./index";

// MikroORM 7 connects lazily: init discovers metadata without a database.
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init(createOrmOptions({ databaseUrl: "postgres://unit:test@127.0.0.1:1/unit" }));
});

afterAll(async () => {
  await orm.close();
});

describe("entities", () => {
  it("registers User under its pinned name and table", () => {
    expect(entities).toContain(User);
    expect(User.name).toBe("User");
    const meta = orm.getMetadata().get(User);
    expect(meta.tableName).toBe("users");
    expect(meta.properties.passwordHash.hidden).toBe(true);
    expect(meta.properties.email.unique).toBe(true);
    expect(meta.properties.role.items).toEqual([...USER_ROLES]);
  });

  it("fills the shared base columns on create and update", () => {
    const { id, createdAt, updatedAt } = orm.getMetadata().get(User).properties;
    const user = new User();
    const em = orm.em.fork();

    expect(id.onCreate?.(user, em)).toMatch(/^[0-9a-f-]{36}$/);
    expect(id.onCreate?.(user, em)).not.toBe(id.onCreate?.(user, em));
    expect(createdAt.onCreate?.(user, em)).toBeInstanceOf(Date);
    expect(updatedAt.onCreate?.(user, em)).toBeInstanceOf(Date);
    expect(updatedAt.onUpdate?.(user, em)).toBeInstanceOf(Date);
  });
});
