import { describe, expect, it } from 'vitest';
import { resolveAuthorizationHeader } from '../../src/index.ts';

describe('resolveAuthorizationHeader', () => {
  it('bearer', async () => {
    await expect(
      resolveAuthorizationHeader({
        type: 'bearer',
        getToken: () => 'tok',
      }),
    ).resolves.toBe('Bearer tok');
  });

  it('partner-bearer uses same scheme', async () => {
    await expect(
      resolveAuthorizationHeader({
        type: 'partner-bearer',
        getSecret: () => 'sec',
      }),
    ).resolves.toBe('Bearer sec');
  });

  it('null provider → no header', async () => {
    await expect(
      resolveAuthorizationHeader({
        type: 'bearer',
        getToken: () => null,
      }),
    ).resolves.toBeUndefined();
  });
});
