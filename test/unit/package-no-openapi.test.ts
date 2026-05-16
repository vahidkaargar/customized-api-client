import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('package has no OpenAPI coupling', () => {
  it('src/index.ts does not import generated openapi', () => {
    const indexSource = readFileSync(join(root, 'src/index.ts'), 'utf8');
    expect(indexSource).not.toMatch(/generated\/openapi/);
  });

  it('does not commit openapi/v1.yaml', () => {
    expect(existsSync(join(root, 'openapi/v1.yaml'))).toBe(false);
  });

  it('npm pack dry-run excludes openapi artifacts', () => {
    const output = execSync('npm pack --dry-run', { cwd: root, encoding: 'utf8' });
    expect(output).not.toContain('openapi/v1.yaml');
    expect(output).not.toContain('generated/openapi');
  });
});
