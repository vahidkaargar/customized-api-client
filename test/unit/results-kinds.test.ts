import { describe, expect, it } from 'vitest';
import type { AxiosResponse } from 'axios';
import { normalizeAxiosResponse } from '../../src/index.ts';

describe('normalizeAxiosResponse success kinds', () => {
  it('201 jsonapi-success', () => {
    const res = {
      status: 201,
      data: { data: { type: 't', id: '1' } },
      headers: {},
      config: {},
    } as unknown as AxiosResponse<unknown>;
    const o = normalizeAxiosResponse(res, { requestUrl: 'https://h/r' });
    expect(o.kind).toBe('jsonapi-success');
    if (o.kind === 'jsonapi-success') expect(o.status).toBe(201);
  });

  it('200 jsonapi-success', () => {
    const res = {
      status: 200,
      data: { data: { type: 't', id: '1' } },
      headers: {},
      config: {},
    } as unknown as AxiosResponse<unknown>;
    const o = normalizeAxiosResponse(res, { requestUrl: 'https://h/r' });
    expect(o.kind).toBe('jsonapi-success');
  });

  it('204 no-content', () => {
    const res = {
      status: 204,
      data: '',
      headers: {},
      config: {},
    } as unknown as AxiosResponse<unknown>;
    const o = normalizeAxiosResponse(res, { requestUrl: 'https://h/r' });
    expect(o.kind).toBe('no-content');
  });

  it('202 accepted + Location', () => {
    const res = {
      status: 202,
      data: {},
      headers: { location: '/poll/1' },
      config: { url: 'https://h/orig' },
    } as unknown as AxiosResponse<unknown>;
    const o = normalizeAxiosResponse(res, { requestUrl: 'https://h/orig' });
    expect(o.kind).toBe('accepted');
    if (o.kind === 'accepted') {
      expect(o.location).toBe('https://h/poll/1');
    }
  });

  it('207 multi-status', () => {
    const res = {
      status: 207,
      data: {
        items: [
          { httpStatus: 200 },
          { httpStatus: 422, body: { errors: [] } },
        ],
      },
      headers: {},
      config: {},
    } as unknown as AxiosResponse<unknown>;
    const o = normalizeAxiosResponse(res, { requestUrl: 'https://h/r' });
    expect(o.kind).toBe('multi-status');
  });
});
