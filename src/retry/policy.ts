export interface RetryPolicyContext {
  readonly method: string;
  readonly status?: number;
  /** First JSON:API error `code` when present */
  readonly primaryErrorCode?: string;
  readonly isNetworkError: boolean;
}

/** Pure policy per [.cursor/tasks/project-plan.md §7](../tasks/project-plan.md). */
export function retryAllowed(ctx: RetryPolicyContext): boolean {
  const m = ctx.method.toUpperCase();
  const isRead = m === 'GET' || m === 'HEAD';

  if (ctx.isNetworkError) {
    return true;
  }

  const s = ctx.status;
  if (s === undefined) return false;

  if (s === 401 || s === 403 || s === 412 || s === 428) return false;
  if (s === 422 || s === 400 || s === 406 || s === 415 || s === 413) return false;

  if (s === 409) {
    if (ctx.primaryErrorCode === 'IDEMPOTENCY_KEY_REUSED') return false;
    if (ctx.primaryErrorCode === 'IDEMPOTENCY_REQUEST_IN_PROGRESS') return true;
    return false;
  }

  if (!isRead) {
    return false;
  }

  if (s === 408) return true;
  if (s === 429) return true;
  if (s >= 502 && s <= 504) return true;
  if (s >= 500 && s < 600) return true;

  return false;
}
