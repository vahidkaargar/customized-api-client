import type { ClientSuccess } from './types/results.ts';
import type { ApiClient } from './create-api-client.ts';

export interface PollOptions {
  readonly maxAttempts?: number;
  readonly delayMs?: number;
}

export async function pollAsyncResult(
  client: ApiClient,
  initial: Extract<ClientSuccess, { kind: 'accepted' }>,
  options?: PollOptions,
): Promise<ClientSuccess> {
  const max = options?.maxAttempts ?? 10;
  const delay = options?.delayMs ?? 200;
  let url = initial.location;
  for (let i = 0; i < max; i += 1) {
    const res = await client.getByUrl(url);
    if (res.kind !== 'accepted') return res;
    url = res.location;
    await sleep(delay);
  }
  throw new Error('pollAsyncResult: max attempts exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
