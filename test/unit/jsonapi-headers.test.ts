import { describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { applyJsonApiHeaders } from '../../src/index.ts';

function cfg(over?: Partial<InternalAxiosRequestConfig>): InternalAxiosRequestConfig {
  return { url: '/x', ...over } as InternalAxiosRequestConfig;
}

describe('applyJsonApiHeaders', () => {
  it('sets Accept JSON:API', () => {
    const next = applyJsonApiHeaders(cfg(), 'GET');
    expect((next.headers as Record<string, string>).Accept).toBe('application/vnd.api+json');
  });

  it('sets Content-Type for JSON body mutations', () => {
    const next = applyJsonApiHeaders(cfg({ data: { a: 1 } }), 'POST');
    expect((next.headers as Record<string, string>)['Content-Type']).toBe('application/vnd.api+json');
  });

  it('does not add Content-Type for GET', () => {
    const next = applyJsonApiHeaders(cfg(), 'GET');
    expect((next.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });
});
