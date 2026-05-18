import { describe, expect, it } from 'vitest';
import { retryAllowed } from '../../src/index.ts';

describe('retryAllowed', () => {
  it('POST denies HTTP 5xx and 429 by default', () => {
    expect(retryAllowed({ method: 'POST', status: 500, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'POST', status: 502, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'POST', status: 429, isNetworkError: false })).toBe(false);
  });

  it('POST allows 5xx when retryMutationsOnServerError is true', () => {
    expect(
      retryAllowed({
        method: 'POST',
        status: 500,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
    expect(
      retryAllowed({
        method: 'POST',
        status: 503,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
    expect(
      retryAllowed({
        method: 'POST',
        status: 501,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
  });

  it('POST still denies 429 and client errors when retryMutationsOnServerError is true', () => {
    expect(
      retryAllowed({
        method: 'POST',
        status: 429,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(false);
    expect(
      retryAllowed({
        method: 'POST',
        status: 401,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(false);
  });

  it('POST allows network and 409 IN_PROGRESS only', () => {
    expect(retryAllowed({ method: 'POST', isNetworkError: true })).toBe(true);
    expect(
      retryAllowed({
        method: 'POST',
        status: 409,
        primaryErrorCode: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
        isNetworkError: false,
      }),
    ).toBe(true);
    expect(
      retryAllowed({
        method: 'POST',
        status: 409,
        primaryErrorCode: 'IDEMPOTENCY_KEY_REUSED',
        isNetworkError: false,
      }),
    ).toBe(false);
    expect(
      retryAllowed({
        method: 'POST',
        status: 409,
        primaryErrorCode: 'IDEMPOTENCY_KEY_REUSED',
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(false);
  });

  it('POST 409 IN_PROGRESS still retries when retryMutationsOnServerError is true', () => {
    expect(
      retryAllowed({
        method: 'POST',
        status: 409,
        primaryErrorCode: 'IDEMPOTENCY_REQUEST_IN_PROGRESS',
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
  });

  it('GET allows 500 and denies 401/412', () => {
    expect(retryAllowed({ method: 'GET', status: 500, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 429, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'GET', status: 401, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'GET', status: 412, isNetworkError: false })).toBe(false);
  });

  it('HEAD is a safe method — allows same retries as GET', () => {
    expect(retryAllowed({ method: 'HEAD', status: 429, isNetworkError: false })).toBe(true);
    expect(retryAllowed({ method: 'HEAD', status: 401, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'HEAD', status: 500, isNetworkError: false })).toBe(true);
  });

  it('DELETE / PATCH / PUT mutations: network allowed, status denied except 409 IN_PROGRESS', () => {
    expect(retryAllowed({ method: 'DELETE', isNetworkError: true })).toBe(true);
    expect(retryAllowed({ method: 'DELETE', status: 500, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'PATCH', isNetworkError: true })).toBe(true);
    expect(retryAllowed({ method: 'PATCH', status: 500, isNetworkError: false })).toBe(false);
    expect(retryAllowed({ method: 'PUT', isNetworkError: true })).toBe(true);
    expect(retryAllowed({ method: 'PUT', status: 500, isNetworkError: false })).toBe(false);
  });

  it('DELETE / PATCH / PUT allow 5xx when retryMutationsOnServerError is true', () => {
    expect(
      retryAllowed({
        method: 'DELETE',
        status: 502,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
    expect(
      retryAllowed({
        method: 'PATCH',
        status: 500,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
    expect(
      retryAllowed({
        method: 'PUT',
        status: 504,
        isNetworkError: false,
        retryMutationsOnServerError: true,
      }),
    ).toBe(true);
  });
});
