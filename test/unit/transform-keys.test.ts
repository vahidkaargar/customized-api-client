import { describe, expect, it } from 'vitest';
import { applyTransformKeys } from '../../src/index.ts';
import type { JsonApiDocument } from '../../src/index.ts';

describe('applyTransformKeys', () => {
  it('none leaves attributes snake_case', () => {
    const doc: JsonApiDocument = {
      data: { type: 'w', id: '1', attributes: { snake_case: 1 } },
    };
    const o = applyTransformKeys(doc, 'none');
    expect((o.data as unknown as { attributes: { snake_case: number } }).attributes.snake_case).toBe(
      1,
    );
  });

  it('camelCase-attributes-meta copies and camelCases', () => {
    const doc: JsonApiDocument = {
      data: { type: 'w', id: '1', attributes: { my_field: 1 }, meta: { foo_bar: 2 } },
    };
    const o = applyTransformKeys(doc, 'camelCase-attributes-meta');
    const d = o.data as unknown as { attributes: { myField: number }; meta: { fooBar: number } };
    expect(d.attributes.myField).toBe(1);
    expect(d.meta.fooBar).toBe(2);
  });
});
