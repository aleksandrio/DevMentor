import { makeCrudRoute } from "@devmentor/core";

export const dynamic = "force-dynamic";

// Reference example of a plain CRUD resource (engineering standards, section 5).
export const { GET } = makeCrudRoute({
  service: ({ userService }) => userService,
  auth: "admin",
});
