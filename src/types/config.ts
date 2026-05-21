/** Mode B (default): `baseURL` already includes `/api/v1`. Mode A: origin only; client prefixes `/api/v1`. */
export type BaseUrlMode = 'modeB' | 'modeA';

export type AuthConfig =
  | { readonly type: 'bearer'; readonly getToken: TokenProvider }
  | { readonly type: 'partner-bearer'; readonly getSecret: TokenProvider };

export type TokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export type TransformResponseKeysMode = 'none' | 'camelCase-attributes-meta';

export interface RetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly jitterRatio?: number;
  /**
   * When true, POST/PUT/PATCH/DELETE responses in the **5xx** range are retried like GET/HEAD
   * (same `AxiosRequestConfig`, so same `Idempotency-Key` and body). Default false.
   */
  readonly retryMutationsOnServerError?: boolean;
}

export interface IdempotencyReplayContext {
  readonly url?: string;
  readonly method?: string;
}

export interface LocaleMismatchContext {
  /** Locale from `getLocale` before default omission. */
  readonly requested?: string;
  /** `Content-Language` from the response. */
  readonly resolved: string;
  readonly url?: string;
  readonly method?: string;
}

export interface LocaleClientOptions {
  readonly getLocale?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  /**
   * When the resolved locale matches this value (primary subtag), `Accept-Language` is omitted.
   */
  readonly defaultLocale?: string;
  readonly onLocaleMismatch?: 'warn' | ((ctx: Readonly<LocaleMismatchContext>) => void);
}

export interface ApiClientConfig {
  readonly baseURL: string;
  /** Default Mode B — see `BaseUrlMode`. */
  readonly baseUrlMode?: BaseUrlMode;
  readonly auth?: AuthConfig;
  readonly locale?: LocaleClientOptions;
  /**
   * @deprecated Use `locale.getLocale` instead.
   */
  readonly getAcceptLanguage?: () => string | null | undefined | Promise<string | null | undefined>;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  readonly timeout?: number;
  readonly retry?: RetryOptions;
  readonly generateIdempotencyKey?: () => string;
  readonly onIdempotencyReplay?: (ctx: Readonly<IdempotencyReplayContext>) => void;
  readonly onUnauthorized?: (error: unknown) => void | Promise<void>;
  readonly onDeprecated?: (info: Readonly<DeprecationInfo>) => void;
  readonly transformResponseKeys?: TransformResponseKeysMode;
  readonly maxBodyLogLength?: number;
}

export interface DeprecationInfo {
  readonly deprecation?: string;
  readonly sunset?: string;
  readonly rawHeaders: Readonly<Record<string, string>>;
}

export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_PAGE_SIZE_CAP = 100;
