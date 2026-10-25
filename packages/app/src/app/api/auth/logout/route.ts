import { ApiResponse, apiHandler, clearedSessionCookie } from "@devmentor/core";

export const POST = apiHandler(
  async ({ cradle: { config } }) =>
    new ApiResponse(null, {
      headers: { "Set-Cookie": clearedSessionCookie({ secure: config.isProduction }) },
    }),
  { auth: "public" },
);
