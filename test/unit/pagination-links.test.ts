import { describe, expect, it } from 'vitest';
import { getNextPageUrl } from '../../src/index.ts';

describe('getNextPageUrl', () => {
  it('returns absolute next', () => {
    expect(getNextPageUrl({ next: 'https://api/x?page=2' })).toBe('https://api/x?page=2');
  });

  it('returns relative next', () => {
    expect(getNextPageUrl({ next: '/api/v1/widgets?page[cursor]=a' })).toBe(
      '/api/v1/widgets?page[cursor]=a',
    );
  });
});
