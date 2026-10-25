import bcrypt from "bcryptjs";
import { isUniqueConstraintViolation, User, type EntityManager, type UserRole } from "@devmentor/db";
import type { EventBus } from "../../events/event-bus";
import { ConflictError, UnauthorizedError } from "../../http/errors";
import type { Session } from "../../http/auth";
import type { CrudService } from "../../http/make-crud-route";
import type { LoginInput } from "../../validators/auth/login.schema";
import type { RegisterInput } from "../../validators/auth/register.schema";

// OWASP's floor is 10; 12 costs ~50 ms more per login, which is free at this scale.
export const BCRYPT_COST = 12;

/** What leaves the service: never the entity, never the password hash. */
export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface UserServiceDeps {
  em: EntityManager;
  eventBus: EventBus;
}

const INVALID_CREDENTIALS = "Nieprawidłowe dane logowania.";
// Generic on purpose: do not reveal whether the address is already registered.
const REGISTRATION_REJECTED = "Nie można utworzyć konta z tymi danymi.";

function toDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export class UserService implements CrudService<UserDto, never, never> {
  private readonly em: EntityManager;
  private readonly eventBus: EventBus;
  // Compared against when the e-mail is unknown, so a miss takes as long as
  // a wrong password and response time does not reveal registered addresses.
  private static dummyHash: Promise<string> | undefined;

  constructor({ em, eventBus }: UserServiceDeps) {
    this.em = em;
    this.eventBus = eventBus;
  }

  async register({ email, displayName, password }: RegisterInput): Promise<UserDto> {
    const user = this.em.create(User, {
      email,
      displayName,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      role: "student",
    });
    try {
      await this.em.flush();
    } catch (error) {
      // The unique constraint, not a prior lookup, decides: no race window.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictError(REGISTRATION_REJECTED);
      }
      throw error;
    }
    await this.eventBus.emit("auth.user.registered", { userId: user.id, role: user.role });
    return toDto(user);
  }

  /** The session for valid credentials; one generic error for any mismatch. */
  async authenticate({ email, password }: LoginInput): Promise<Session> {
    const user = await this.em.findOne(User, { email });
    if (!user) {
      UserService.dummyHash ??= bcrypt.hash("timing-equalizer", BCRYPT_COST);
      await bcrypt.compare(password, await UserService.dummyHash);
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    return { userId: user.id, role: user.role };
  }

  async list(): Promise<UserDto[]> {
    const users = await this.em.find(User, {}, { orderBy: { createdAt: "desc" } });
    return users.map(toDto);
  }
}
