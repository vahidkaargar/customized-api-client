export function formatIfMatch(version: number): string {
  if (!Number.isFinite(version) || version < 0) {
    throw new Error('If-Match version must be a non-negative finite number');
  }
  return `"v=${String(version)}"`;
}
