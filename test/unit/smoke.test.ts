import { describe, expect, it } from 'vitest';
import { createApiClient, PACKAGE_VERSION } from '../../src/index.ts';

describe('package smoke', () => {
  it('exports version and factory', () => {
    expect(typeof PACKAGE_VERSION).toBe('string');
    expect(PACKAGE_VERSION.length).toBeGreaterThan(0);
    const client = createApiClient({ baseURL: 'https://example.com/api/v1' });
    expect(client.get).toBeTypeOf('function');
  });
});
