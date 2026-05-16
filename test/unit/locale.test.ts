import { describe, expect, it } from 'vitest';
import { resolveAcceptLanguage } from '../../src/index.ts';
import { normalizeAxiosResponse } from '../../src/index.ts';
import type { AxiosResponse } from 'axios';

describe('locale', () => {
  it('resolveAcceptLanguage returns undefined when provider missing', async () => {
    expect(await resolveAcceptLanguage(undefined)).toBeUndefined();
  });

  it('surfaces Content-Language on success envelope', () => {
    const res = {
      status: 200,
      data: { data: { type: 'x', id: '1' } },
      headers: { 'content-language': 'fr-CA' },
      config: { url: '/x' },
    } as unknown as AxiosResponse<unknown>;
    const out = normalizeAxiosResponse(res, { requestUrl: 'https://h/x' });
    expect(out.kind).toBe('jsonapi-success');
    if (out.kind === 'jsonapi-success') {
      expect(out.headers.contentLanguage).toBe('fr-CA');
    }
  });
});
