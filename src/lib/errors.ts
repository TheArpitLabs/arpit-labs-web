import { ZodError } from "zod";

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends Error {
  issues: unknown;

  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class ServerActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerActionError";
  }
}

export function handleDatabaseError(error: unknown) {
  if (error instanceof Error) {
    return new DatabaseError(error.message);
  }
  return new DatabaseError("An unexpected database error occurred.");
}

export function handleValidationError(error: unknown) {
  if (error instanceof ZodError) {
    return new ValidationError("Validation failed.", error.format());
  }
  if (error instanceof Error) {
    return new ValidationError(error.message, undefined);
  }
  return new ValidationError("Validation failed.", undefined);
}

export function handleServerActionError(error: unknown) {
  if (error instanceof Error) {
    return new ServerActionError(error.message);
  }
  return new ServerActionError("An unknown server action error occurred.");
}
