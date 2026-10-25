import type { z } from "zod";
import type { Cradle } from "../container/cradle";
import { ApiResponse, apiHandler, type AuthRequirement, type RouteHandler } from "./api-handler";
import type { Session } from "./auth";
import { AppError, ValidationError } from "./errors";
import { parseBody } from "./validation";

/** Passed to every CRUD service method so it can check ownership. */
export interface CrudContext {
  session: Session | null;
}

export interface CrudService<Item, CreateInput, UpdateInput> {
  list?(context: CrudContext): Promise<Item[]>;
  create?(input: CreateInput, context: CrudContext): Promise<Item>;
  update?(id: string, input: UpdateInput, context: CrudContext): Promise<Item>;
  remove?(id: string, context: CrudContext): Promise<void>;
}

interface CrudRouteConfig<Item, CreateSchema extends z.ZodType, UpdateSchema extends z.ZodType> {
  service: (cradle: Cradle) => CrudService<Item, z.output<CreateSchema>, z.output<UpdateSchema>>;
  schemas?: { create?: CreateSchema; update?: UpdateSchema };
  /** One requirement for every method, or separate ones for reads and writes. */
  auth?: AuthRequirement | { read: AuthRequirement; write: AuthRequirement };
}

class MethodNotAllowedError extends AppError {
  constructor() {
    super("method_not_allowed", "Ta operacja nie jest dostępna dla tego zasobu.", 405);
  }
}

/** The record id: the `[id]` route segment, or `?id=` on the collection route. */
function recordId(request: Request, params: Record<string, string | string[] | undefined>): string {
  const id = params.id ?? new URL(request.url).searchParams.get("id");
  if (typeof id !== "string" || id === "") {
    throw new ValidationError({ id: ["Brak identyfikatora rekordu."] });
  }
  return id;
}

function requireMethod<M>(method: M | undefined): M {
  if (!method) {
    throw new MethodNotAllowedError();
  }
  return method;
}

function requireSchema<S>(schema: S | undefined): S {
  if (!schema) {
    // A write method without a schema would persist the raw body: refuse it.
    throw new Error("makeCrudRoute: a write method needs its Zod schema.");
  }
  return schema;
}

/**
 * Configuration-driven route for plain CRUD resources: re-export
 * `{ GET, POST, PUT, DELETE }` from route.ts. Methods the service does not
 * implement answer 405. Workflows that are not CRUD use apiHandler directly.
 */
export function makeCrudRoute<Item, CreateSchema extends z.ZodType = z.ZodNever, UpdateSchema extends z.ZodType = z.ZodNever>(
  config: CrudRouteConfig<Item, CreateSchema, UpdateSchema>,
): { GET: RouteHandler; POST: RouteHandler; PUT: RouteHandler; DELETE: RouteHandler } {
  const auth = config.auth ?? "session";
  const readAuth = typeof auth === "string" ? auth : auth.read;
  const writeAuth = typeof auth === "string" ? auth : auth.write;

  return {
    GET: apiHandler(
      async ({ session, cradle }) => {
        const service = config.service(cradle);
        const list = requireMethod(service.list?.bind(service));
        return list({ session });
      },
      { auth: readAuth },
    ),
    POST: apiHandler(
      async ({ request, session, cradle }) => {
        const service = config.service(cradle);
        const create = requireMethod(service.create?.bind(service));
        const input = await parseBody(request, requireSchema(config.schemas?.create));
        return new ApiResponse(await create(input, { session }), { status: 201 });
      },
      { auth: writeAuth },
    ),
    PUT: apiHandler(
      async ({ request, params, session, cradle }) => {
        const service = config.service(cradle);
        const update = requireMethod(service.update?.bind(service));
        const input = await parseBody(request, requireSchema(config.schemas?.update));
        return update(recordId(request, params), input, { session });
      },
      { auth: writeAuth },
    ),
    DELETE: apiHandler(
      async ({ request, params, session, cradle }) => {
        const service = config.service(cradle);
        const remove = requireMethod(service.remove?.bind(service));
        await remove(recordId(request, params), { session });
        return null;
      },
      { auth: writeAuth },
    ),
  };
}
