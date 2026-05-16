/** Parse Retry-After header: delta-seconds or HTTP-date. */
export function parseRetryAfterSeconds(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isNaN(n)) return n;
  const ms = Date.parse(value);
  if (!Number.isNaN(ms)) {
    return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
  }
  return undefined;
}
