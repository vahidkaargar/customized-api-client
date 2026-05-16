import { describe, expect, it } from 'vitest';
import { resolveResourcePath } from '../../src/index.ts';

describe('resolveResourcePath', () => {
  it('mode B: avoids duplicate /api/v1 when base and path both include it', () => {
    const base = 'https://api.example.com/api/v1';
    expect(resolveResourcePath(base, '/admin/teams', 'modeB')).toBe('/admin/teams');
    expect(resolveResourcePath(base, 'admin/teams', 'modeB')).toBe('/admin/teams');
  });

  it('mode B: strips leading duplicate when path repeats /api/v1 under /api/v1 base', () => {
    const base = 'https://api.example.com/api/v1';
    expect(resolveResourcePath(base, '/api/v1/other', 'modeB')).toBe('/other');
  });

  it('mode B: no double slashes in segment join (axios combines base + url)', () => {
    const base = 'https://api.example.com/api/v1';
    const p = resolveResourcePath(base, '/x', 'modeB');
    expect(p).toMatch(/^\/x$/);
  });

  it('mode A: prefixes /api/v1 when missing', () => {
    const base = 'https://api.example.com';
    expect(resolveResourcePath(base, '/teams', 'modeA')).toBe('/api/v1/teams');
    expect(resolveResourcePath(base, '/api/v1/teams', 'modeA')).toBe('/api/v1/teams');
  });
});
