import type { AuthConfig } from '../types/config.ts';

export async function resolveAuthorizationHeader(auth: AuthConfig | undefined): Promise<
  string | undefined
> {
  if (!auth) return undefined;
  if (auth.type === 'bearer') {
    const t = await auth.getToken();
    if (!t) return undefined;
    return `Bearer ${t}`;
  }
  const s = await auth.getSecret();
  if (!s) return undefined;
  return `Bearer ${s}`;
}
