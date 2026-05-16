import { describe, expect, it } from 'vitest';
import { parseJsonApiDocument } from '../../src/index.ts';

describe('parseJsonApiDocument', () => {
  it('accepts single resource', () => {
    const doc = parseJsonApiDocument({
      data: { type: 'widgets', id: '1', attributes: { name: 'a' } },
    });
    expect(doc.data).toMatchObject({ type: 'widgets', id: '1' });
  });

  it('accepts array primary data and included', () => {
    const doc = parseJsonApiDocument({
      data: [
        { type: 'widgets', id: '1' },
        { type: 'widgets', id: '2' },
      ],
      included: [{ type: 'people', id: '9', attributes: { name: 'p' } }],
    });
    expect(Array.isArray(doc.data)).toBe(true);
    expect(doc.included?.length).toBe(1);
  });
});
