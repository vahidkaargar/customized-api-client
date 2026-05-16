/**
 * Minimal JSON:API wire shapes used by the client (snake_case on wire).
 */

export interface JsonApiResourceLinkage {
  readonly type: string;
  readonly id: string;
}

export interface JsonApiResourceObject {
  readonly type: string;
  readonly id: string;
  readonly attributes?: Record<string, unknown>;
  readonly relationships?: Record<string, unknown>;
  readonly meta?: Record<string, unknown>;
  readonly links?: Record<string, string | null | undefined>;
}

export type JsonApiPrimaryData =
  | JsonApiResourceObject
  | readonly JsonApiResourceObject[]
  | null;

export interface JsonApiDocument<
  TData extends JsonApiPrimaryData = JsonApiPrimaryData,
> {
  readonly data: TData;
  readonly included?: readonly JsonApiResourceObject[];
  readonly meta?: Readonly<Record<string, unknown>>;
  readonly links?: Readonly<Record<string, string | null | undefined>>;
}

export interface JsonApiErrorObject {
  readonly id?: string;
  readonly status?: string;
  readonly code?: string;
  readonly title?: string;
  readonly detail?: string;
  readonly source?: {
    readonly pointer?: string;
    readonly parameter?: string;
  };
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface JsonApiErrorDocument {
  readonly errors: readonly JsonApiErrorObject[];
}
