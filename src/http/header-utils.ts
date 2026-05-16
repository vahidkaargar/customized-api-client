export type HeadersLike = Headers | Record<string, string | undefined>;

export function flattenAxiosHeaders(
  headers: unknown,
): Record<string, string> {
  if (!headers) return {};
  if (typeof (headers as Headers).forEach === 'function') {
    const out: Record<string, string> = {};
    (headers as Headers).forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  const o = headers as Record<string, string | string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') out[k.toLowerCase()] = v;
    else if (Array.isArray(v) && v[0]) out[k.toLowerCase()] = v[0];
  }
  return out;
}

export function getHeader(headers: Record<string, string>, name: string): string | undefined {
  return headers[name.toLowerCase()];
}
