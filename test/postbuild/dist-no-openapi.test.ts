import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const distTypesPath = join(root, 'dist/index.d.ts');

describe('dist bundle has no OpenAPI types', () => {
  it('dist/index.d.ts omits paths/operations/components exports', () => {
    if (!existsSync(distTypesPath)) {
      throw new Error('Run npm run build first');
    }
    const dts = readFileSync(distTypesPath, 'utf8');
    expect(dts).not.toMatch(/interface paths\s*\{/);
    expect(dts).not.toMatch(/export type \{ paths/);
    expect(dts).not.toMatch(/generated\/openapi/);
  });
});
