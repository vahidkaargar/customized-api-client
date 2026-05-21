import { getHeader } from '../http/header-utils.ts';
import type { LocaleClientOptions, LocaleMismatchContext } from '../types/config.ts';

export type LocaleProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

/** Primary language subtag only: `fr-FR` → `fr`. */
export function normalizeLocaleCode(tag: string | undefined): string | undefined {
  if (tag === undefined) return undefined;
  const trimmed = tag.trim();
  if (!trimmed) return undefined;
  const base = trimmed.split(/[-_]/)[0]?.trim();
  return base ? base.toLowerCase() : undefined;
}

/** First language tag from a `Content-Language` (or similar) header value. */
export function parseContentLanguage(header: string | undefined): string | undefined {
  if (header === undefined) return undefined;
  const first = header.split(',')[0]?.trim();
  if (!first) return undefined;
  const tag = first.split(';')[0]?.trim();
  return tag || undefined;
}

/** Compare primary subtags (e.g. `fr-FR` and `fr` match). */
export function localesMatch(a: string | undefined, b: string | undefined): boolean {
  const na = normalizeLocaleCode(a);
  const nb = normalizeLocaleCode(b);
  if (na === undefined || nb === undefined) return false;
  return na === nb;
}

export function resolveLocaleProvider(
  getAcceptLanguage?: LocaleProvider,
  locale?: LocaleClientOptions,
): LocaleProvider | undefined {
  return locale?.getLocale ?? getAcceptLanguage;
}

export async function resolveRequestLocale(
  getAcceptLanguage?: LocaleProvider,
  locale?: LocaleClientOptions,
): Promise<string | undefined> {
  return resolveAcceptLanguage(resolveLocaleProvider(getAcceptLanguage, locale));
}

/**
 * Value to send as `Accept-Language`, or `undefined` to omit the header
 * when the resolved locale matches `defaultLocale` (normalized).
 */
export function acceptLanguageForRequest(
  resolved: string | undefined,
  defaultLocale?: string,
): string | undefined {
  if (resolved === undefined) return undefined;
  if (defaultLocale !== undefined && localesMatch(resolved, defaultLocale)) {
    return undefined;
  }
  return resolved;
}

export async function resolveAcceptLanguage(
  provider?: LocaleProvider,
): Promise<string | undefined> {
  if (!provider) return undefined;
  const v = await provider();
  if (v === null || v === undefined) return undefined;
  const trimmed = String(v).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readResponseContentLanguage(
  flatHeaders: Readonly<Record<string, string>>,
): string | undefined {
  return parseContentLanguage(getHeader(flatHeaders, 'content-language'));
}

export function notifyLocaleMismatch(
  locale: LocaleClientOptions | undefined,
  ctx: Readonly<LocaleMismatchContext>,
): void {
  const handler = locale?.onLocaleMismatch;
  if (!handler) return;
  if (ctx.requested === undefined) return;
  if (localesMatch(ctx.requested, ctx.resolved)) return;
  if (handler === 'warn') {
    console.warn(
      '[@vahidkaargar/customized-api-client] Content-Language mismatch',
      ctx,
    );
    return;
  }
  handler(ctx);
}
