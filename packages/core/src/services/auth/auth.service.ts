import type { Session } from "../../http/auth";
import { createSessionToken } from "../../http/auth";
import { AppError } from "../../http/errors";
import type { FailureRateLimiter } from "../../http/rate-limit";
import type { AppConfig } from "../../config/env";
import type { LoginInput } from "../../validators/auth/login.schema";
import type { RegisterInput } from "../../validators/auth/register.schema";
import type { UserDto, UserService } from "./user.service";

export interface AuthServiceDeps {
  config: AppConfig;
  userService: UserService;
  authRateLimiter: FailureRateLimiter;
}

export interface AuthResult {
  session: Session;
  /** Signed session JWT; the route puts it in the HttpOnly cookie, nowhere else. */
  token: string;
}

/**
 * Login and registration workflows: brute-force control around UserService
 * and session token issuing. Builds no HTTP response; the route sets the cookie.
 */
export class AuthService {
  private readonly config: AppConfig;
  private readonly userService: UserService;
  private readonly authRateLimiter: FailureRateLimiter;

  constructor({ config, userService, authRateLimiter }: AuthServiceDeps) {
    this.config = config;
    this.userService = userService;
    this.authRateLimiter = authRateLimiter;
  }

  async register(input: RegisterInput, clientIp: string): Promise<AuthResult & { user: UserDto }> {
    const user = await this.limitFailures(`register|${clientIp}|${input.email}`, () =>
      this.userService.register(input),
    );
    const session = { userId: user.id, role: user.role };
    return { user, session, token: await createSessionToken(session, this.config.authSecret) };
  }

  async login(input: LoginInput, clientIp: string): Promise<AuthResult> {
    const session = await this.limitFailures(`login|${clientIp}|${input.email}`, () =>
      this.userService.authenticate(input),
    );
    return { session, token: await createSessionToken(session, this.config.authSecret) };
  }

  private async limitFailures<T>(key: string, attempt: () => Promise<T>): Promise<T> {
    this.authRateLimiter.assertAllowed(key);
    try {
      const result = await attempt();
      this.authRateLimiter.reset(key);
      return result;
    } catch (error) {
      // Only rejected attempts count; infrastructure failures are not the user's.
      if (error instanceof AppError) {
        this.authRateLimiter.recordFailure(key);
      }
      throw error;
    }
  }
}
