import { describe, expect, it } from 'vitest';
import type { paths } from '../../src/generated/openapi.ts';

describe('generated OpenAPI types', () => {
  it('imports paths interface', () => {
    const _x: keyof paths = '/health/live';
    expect(_x).toBeDefined();
  });
});
