import { ApiResponse, apiHandler, clientIp, parseBody, sessionCookie } from "@devmentor/core";
import { registerSchema } from "@devmentor/core/validators/auth/register.schema";

export const dynamic = "force-dynamic";

export const POST = apiHandler(
  async ({ request, cradle: { authService, config } }) => {
    const input = await parseBody(request, registerSchema);
    const { user, token } = await authService.register(input, clientIp(request));
    return new ApiResponse(user, {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(token, { secure: config.isProduction }) },
    });
  },
  { auth: "public" },
);
