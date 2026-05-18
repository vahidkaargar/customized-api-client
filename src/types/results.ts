import type { JsonApiDocument } from './jsonapi.ts';

/** Normalized subset of interesting response headers */
export interface NormalizedResponseHeaders {
  readonly etag?: string;
  readonly contentLanguage?: string;
  readonly idempotentReplayed: boolean;
  readonly retryAfterSeconds?: number;
}

export interface JsonApiSuccessBody {
  readonly kind: 'jsonapi-success';
  readonly status: 200 | 201;
  readonly headers: NormalizedResponseHeaders;
  readonly document: JsonApiDocument;
}

export interface NoContentBody {
  readonly kind: 'no-content';
  readonly status: 204;
  readonly headers: NormalizedResponseHeaders;
}

export interface AcceptedBody {
  readonly kind: 'accepted';
  readonly status: 202;
  readonly location: string;
  readonly rawBody?: unknown;
  readonly headers: NormalizedResponseHeaders;
}

export interface MultiStatusItem {
  readonly httpStatus: number;
  readonly body?: unknown;
}

export interface MultiStatusBody {
  readonly kind: 'multi-status';
  readonly status: 207;
  readonly items: readonly MultiStatusItem[];
  readonly headers: NormalizedResponseHeaders;
}

export type ClientSuccess = JsonApiSuccessBody | NoContentBody | AcceptedBody | MultiStatusBody;

export type ClientSuccessWithDocument<T extends JsonApiDocument = JsonApiDocument> =
  | (JsonApiSuccessBody & { readonly document: T })
  | NoContentBody
  | AcceptedBody
  | MultiStatusBody;

export interface OkResult<T extends ClientSuccess> { readonly ok: true; readonly value: T }
export interface ErrResult<E> { readonly ok: false; readonly error: E }
export type Result<T extends ClientSuccess, E> = OkResult<T> | ErrResult<E>;
