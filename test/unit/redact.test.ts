import { describe, expect, it } from 'vitest';
import { ApiClientError, redactHeaderRecord, truncateForLog } from '../../src/index.ts';

describe('redact', () => {
  it('strips Authorization and Idempotency-Key values', () => {
    const r = redactHeaderRecord({
      Authorization: 'Bearer secret',
      'Idempotency-Key': 'abc',
      'X-Other': 'keep',
    });
    expect(r.Authorization).toBe('[REDACTED]');
    expect(r['Idempotency-Key']).toBe('[REDACTED]');
    expect(r['X-Other']).toBe('keep');
  });

  it('truncateForLog shortens long bodies', () => {
    const long = 'x'.repeat(100);
    const out = truncateForLog(long, 20);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(out.endsWith('…')).toBe(true);
  });

  it('ApiClientError.toJSON uses redacted response headers', () => {
    const e = new ApiClientError(
      500,
      [{ code: 'X' }],
      'X',
      {
        authorization: 'Bearer x',
        'idempotency-key': 'k',
      },
    );
    const j = e.toJSON();
    expect((j.responseHeaders as Record<string, string>).authorization).toBe('[REDACTED]');
    expect((j.responseHeaders as Record<string, string>)['idempotency-key']).toBe('[REDACTED]');
  });
});
