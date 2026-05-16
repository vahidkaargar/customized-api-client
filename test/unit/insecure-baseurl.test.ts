import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../../src/index.ts';

describe('insecure baseURL warning', () => {
  it('warns for http non-localhost', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createApiClient({ baseURL: 'http://api.example.com/api/v1' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not warn for https', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createApiClient({ baseURL: 'https://api.example.com/api/v1' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
