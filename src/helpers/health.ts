import type { ApiClientConfig } from '../types/config.ts';
import { createApiClient } from '../create-api-client.ts';

export function createHealthCheck(
  target: ApiClientConfig | Pick<HealthGettable, 'get'>,
): () => Promise<boolean> {
  const client = isGettable(target) ? target : createApiClient(target);

  return async () => {
    try {
      await client.get('/health/live');
      return true;
    } catch {
      return false;
    }
  };
}

interface HealthGettable {
  get: (path: string) => Promise<unknown>;
}

function isGettable(
  target: ApiClientConfig | Pick<HealthGettable, 'get'>,
): target is Pick<HealthGettable, 'get'> {
  return typeof (target as HealthGettable).get === 'function';
}
