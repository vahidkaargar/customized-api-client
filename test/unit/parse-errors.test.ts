import { describe, expect, it } from 'vitest';
import { parseJsonApiErrorBody } from '../../src/index.ts';

describe('parseJsonApiErrorBody', () => {
  it('parses multiple errors', () => {
    const e = parseJsonApiErrorBody(
      422,
      {
        errors: [
          { code: 'VALIDATION_ERROR', detail: 'bad', source: { pointer: '/data' } },
          { code: 'OTHER', detail: 'x' },
        ],
      },
      {},
      'POST',
    );
    expect(e.errors).toHaveLength(2);
    expect(e.primaryCode).toBe('VALIDATION_ERROR');
  });

  it('invalid JSON string body → synthetic', () => {
    const e = parseJsonApiErrorBody(400, '{ not json', {}, 'GET');
    expect(e.primaryCode).toBe('INVALID_JSON');
  });

  it('empty 401 body', () => {
    const e = parseJsonApiErrorBody(401, '', {}, 'GET');
    expect(e.status).toBe(401);
    expect(e.errors[0]?.code).toBe('EMPTY_ERROR_BODY');
  });

  it('empty 403 body', () => {
    const e = parseJsonApiErrorBody(403, null, {}, 'GET');
    expect(e.status).toBe(403);
  });

  it('rejects non-object non-string payloads', () => {
    const e = parseJsonApiErrorBody(400, Symbol('x'), {}, 'GET');
    expect(e.primaryCode).toBe('INVALID_ERROR_DOCUMENT');
  });

  it('parses string JSON and HTTP-date Retry-After', () => {
    const future = new Date(Date.now() + 60_000).toUTCString();
    const e = parseJsonApiErrorBody(
      429,
      JSON.stringify({ errors: [{ code: 'RATE_LIMIT' }] }),
      { 'retry-after': future },
      'GET',
    );
    expect(e.primaryCode).toBe('RATE_LIMIT');
    expect(e.retryAfterSeconds).toBeDefined();
  });

  it('errors property not an array', () => {
    const e = parseJsonApiErrorBody(400, { errors: 'bad' as unknown as [] }, {}, 'GET');
    expect(e.primaryCode).toBe('MISSING_ERRORS_ARRAY');
  });

  it('empty errors array', () => {
    const e = parseJsonApiErrorBody(400, { errors: [] }, {}, 'GET');
    expect(e.primaryCode).toBe('MISSING_ERRORS_ARRAY');
  });
});
