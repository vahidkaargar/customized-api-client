import { describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { applyJsonApiHeaders } from '../../src/index.ts';

function cfg(over?: Partial<InternalAxiosRequestConfig>): InternalAxiosRequestConfig {
  return { url: '/x', ...over } as InternalAxiosRequestConfig;
}

function contentType(next: InternalAxiosRequestConfig): string | undefined {
  return (next.headers as Record<string, string>)['Content-Type'];
}

function accept(next: InternalAxiosRequestConfig): string | undefined {
  return (next.headers as Record<string, string>).Accept;
}

describe('applyJsonApiHeaders', () => {
  it('sets Accept JSON:API', () => {
    const next = applyJsonApiHeaders(cfg(), 'GET');
    expect(accept(next)).toBe('application/vnd.api+json');
  });

  it('sets Content-Type for JSON body mutations', () => {
    const next = applyJsonApiHeaders(cfg({ data: { a: 1 } }), 'POST');
    expect(contentType(next)).toBe('application/vnd.api+json');
    expect(accept(next)).toBe('application/vnd.api+json');
  });

  it('sets Content-Type for array body mutations', () => {
    const next = applyJsonApiHeaders(cfg({ data: [1] }), 'POST');
    expect(contentType(next)).toBe('application/vnd.api+json');
  });

  it('does not add Content-Type for GET', () => {
    const next = applyJsonApiHeaders(cfg(), 'GET');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for FormData POST', () => {
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'f.bin');
    const next = applyJsonApiHeaders(cfg({ data: fd }), 'POST');
    expect(contentType(next)).toBeUndefined();
    expect(accept(next)).toBe('application/vnd.api+json');
  });

  it('does not add Content-Type for FormData PATCH', () => {
    const fd = new FormData();
    const next = applyJsonApiHeaders(cfg({ data: fd }), 'PATCH');
    expect(contentType(next)).toBeUndefined();
    expect(accept(next)).toBe('application/vnd.api+json');
  });

  it('does not add Content-Type for Blob POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new Blob(['x']) }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for File POST when available', () => {
    if (typeof File === 'undefined') return;
    const next = applyJsonApiHeaders(
      cfg({ data: new File(['x'], 'f.bin', { type: 'application/octet-stream' }) }),
      'POST',
    );
    expect(contentType(next)).toBeUndefined();
  });

  it('sets Content-Type for null-prototype object POST', () => {
    const data = Object.create(null) as Record<string, number>;
    data.a = 1;
    const next = applyJsonApiHeaders(cfg({ data }), 'POST');
    expect(contentType(next)).toBe('application/vnd.api+json');
  });

  it('does not add Content-Type for ArrayBuffer POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new ArrayBuffer(1) }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for ArrayBufferView POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new Uint8Array([1]) }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for URLSearchParams POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new URLSearchParams() }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for string POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: 'raw' }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for Date POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new Date() }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for GET with FormData', () => {
    const fd = new FormData();
    const next = applyJsonApiHeaders(cfg({ data: fd }), 'GET');
    expect(contentType(next)).toBeUndefined();
    expect(accept(next)).toBe('application/vnd.api+json');
  });

  it('preserves caller Content-Type on mutations', () => {
    const next = applyJsonApiHeaders(
      cfg({
        data: { data: {} },
        headers: { 'Content-Type': 'multipart/form-data' } as InternalAxiosRequestConfig['headers'],
      }),
      'POST',
    );
    expect(contentType(next)).toBe('multipart/form-data');
  });

  it('does not add Content-Type for Map POST', () => {
    const next = applyJsonApiHeaders(cfg({ data: new Map() }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });

  it('does not add Content-Type for ReadableStream POST when available', () => {
    if (typeof ReadableStream === 'undefined') return;
    const next = applyJsonApiHeaders(cfg({ data: new ReadableStream() }), 'POST');
    expect(contentType(next)).toBeUndefined();
  });
});
