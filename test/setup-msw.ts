import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';

/** Shared MSW server — integration tests add handlers per scenario. */
export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
