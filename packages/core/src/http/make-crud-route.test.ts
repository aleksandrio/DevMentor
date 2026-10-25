import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { call } from "../../test/http";
import { makeCrudRoute, type CrudService } from "./make-crud-route";

const createSchema = z.object({ name: z.string().min(1, "Podaj nazwę.") });
type Item = { id: string; name: string };

function route(service: CrudService<Item, z.output<typeof createSchema>, never>) {
  return makeCrudRoute({ service: () => service, schemas: { create: createSchema }, auth: "public" });
}

const admin = { userId: "admin-1", role: "admin" } as const;
const student = { userId: "student-1", role: "student" } as const;

describe("makeCrudRoute", () => {
  it("lists through the service", async () => {
    const { GET } = route({ list: async () => [{ id: "1", name: "TS" }] });
    expect((await call(GET)).body).toEqual({ ok: true, data: [{ id: "1", name: "TS" }] });
  });

  it("answers 405 for methods the service does not implement", async () => {
    const { DELETE } = route({ list: async () => [] });
    expect((await call(DELETE, { method: "DELETE", params: { id: "1" } })).status).toBe(405);
  });

  it("creates from the parsed schema output only (no mass assignment)", async () => {
    let received: unknown;
    const { POST } = route({
      create: async (input) => {
        received = input;
        return { id: "new", ...input };
      },
    });
    const result = await call(POST, { method: "POST", body: { name: "React", id: "evil", role: "admin" } });
    expect(result.status).toBe(201);
    expect(received).toEqual({ name: "React" });
  });

  it("returns field errors for invalid input and for malformed JSON", async () => {
    const { POST } = route({ create: async (input) => ({ id: "x", ...input }) });
    const invalid = await call(POST, { method: "POST", body: { name: "" } });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.fieldErrors).toEqual({ name: ["Podaj nazwę."] });
    expect((await call(POST, { method: "POST", body: "{not json" })).status).toBe(400);
  });

  it("requires a record id for DELETE", async () => {
    const { DELETE } = route({ remove: async () => undefined });
    expect((await call(DELETE, { method: "DELETE" })).status).toBe(400);
    expect((await call(DELETE, { method: "DELETE", url: "http://localhost/api/test?id=7" })).status).toBe(200);
  });

  it("updates a record by id with the parsed update schema", async () => {
    const update = vi.fn(async (id: string, input: { name: string }) => ({ id, ...input }));
    const { PUT } = makeCrudRoute({ service: () => ({ update }), schemas: { update: createSchema }, auth: "public" });

    const result = await call(PUT, { method: "PUT", params: { id: "7" }, body: { name: "Vue", extra: true } });
    expect(result.body).toEqual({ ok: true, data: { id: "7", name: "Vue" } });
    expect(update).toHaveBeenCalledWith("7", { name: "Vue" }, { session: null });
  });

  it("refuses a write method without a schema instead of persisting the raw body", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { PUT } = makeCrudRoute({ service: () => ({ update: async () => ({ id: "1", name: "x" }) }), auth: "public" });
    expect((await call(PUT, { method: "PUT", params: { id: "1" }, body: { name: "x" } })).status).toBe(500);
  });

  it("requires a session by default and supports separate read and write requirements", async () => {
    const service = () => ({ list: async () => [], remove: async () => undefined });
    expect((await call(makeCrudRoute({ service }).GET)).status).toBe(401);

    const { GET, DELETE } = makeCrudRoute({ service, auth: { read: "session", write: "admin" } });
    expect((await call(GET, { session: student })).status).toBe(200);
    expect((await call(DELETE, { method: "DELETE", params: { id: "1" }, session: student })).status).toBe(403);
    expect((await call(DELETE, { method: "DELETE", params: { id: "1" }, session: admin })).status).toBe(200);
  });

  it("passes the session to the service", async () => {
    const list = vi.fn(async () => []);
    const { GET } = makeCrudRoute({ service: () => ({ list }) });
    await call(GET, { session: student });
    expect(list).toHaveBeenCalledWith({ session: student });
  });
});
