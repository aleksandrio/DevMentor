/**
 * Base class for expected business-rule violations raised by domain services.
 * The app layer maps these to user-facing responses; anything else is a bug.
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
