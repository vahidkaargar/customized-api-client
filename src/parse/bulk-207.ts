import type { MultiStatusItem } from '../types/results.ts';

/**
 * Best-effort normalization for 207 bodies — structure varies by backend.
 */
export function parseMultiStatusBody(raw: unknown): readonly MultiStatusItem[] {
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const items = (raw as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items.map((it) => normalizeItem(it));
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((it) => normalizeItem(it));
  }
  return [{ httpStatus: 500, body: raw }];
}

function normalizeItem(it: unknown): MultiStatusItem {
  if (it && typeof it === 'object') {
    const o = it as Record<string, unknown>;
    const s = o.httpStatus ?? o.status;
    const httpStatus = typeof s === 'number' && Number.isFinite(s) ? s : 500;
    return { httpStatus, body: o.body ?? o.response ?? it };
  }
  return { httpStatus: 500, body: it };
}
