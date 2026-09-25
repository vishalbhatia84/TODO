import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetails {
  readonly title?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

const UNREACHABLE_STATUSES = new Set([0, 502, 503, 504]);

export function describeHttpError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (UNREACHABLE_STATUSES.has(error.status)) {
    return 'Could not reach the server. Check that the API is running.';
  }

  const problem = error.error as ProblemDetails | null | undefined;
  const validationMessages = Object.values(problem?.errors ?? {}).flat();

  return validationMessages[0] ?? problem?.detail ?? problem?.title ?? fallback;
}
