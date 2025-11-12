export class LLMError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'LLMError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    if (error instanceof LLMError) return 'AI service temporarily unavailable';
    if (error instanceof DatabaseError) return 'Database error occurred';
    if (error instanceof ValidationError) return 'Validation failed';
    return 'An error occurred';
  }
  
  if (error instanceof Error) return error.message;
  return String(error);
}

