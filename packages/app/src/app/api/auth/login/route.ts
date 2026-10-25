import { ApiResponse, apiHandler, clientIp, parseBody, sessionCookie } from "@devmentor/core";
import { loginSchema } from "@devmentor/core/validators/auth/login.schema";

export const dynamic = "force-dynamic";

export const POST = apiHandler(
  async ({ request, cradle: { authService, config } }) => {
    const input = await parseBody(request, loginSchema);
    const { session, token } = await authService.login(input, clientIp(request));
    return new ApiResponse(session, {
      headers: { "Set-Cookie": sessionCookie(token, { secure: config.isProduction }) },
    });
  },
  { auth: "public" },
);
