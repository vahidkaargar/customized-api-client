const DEFAULT_MAX_BODY_LOG = 2048;

/**
 * Truncate a value for safe logging (respects `maxBodyLogLength` from config when passed).
 */
export function truncateForLog(body: unknown, maxLen = DEFAULT_MAX_BODY_LOG): string {
  let s: string;
  try {
    s = typeof body === 'string' ? body : JSON.stringify(body);
  } catch {
    s = '[Unserializable]';
  }
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

/**
 * Redact sensitive header values for logging and error surfaces.
 */
export function redactHeaderRecord(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...headers };
  for (const key of Object.keys(out)) {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'idempotency-key') {
      out[key] = '[REDACTED]';
    }
  }
  return out;
}
