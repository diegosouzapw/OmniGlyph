import { defineConfig } from 'vitest/config';

const TEST_FILE_PATTERNS = ['tests/**/*.test.ts'];
// Render e2e cases (full page reflow + PNG encode) can run well past Vitest's
// 5s default on slower/CI machines; raise the per-test ceiling so a genuinely
// slow case is not a false-negative timeout. Does not affect assertions.
const TEST_TIMEOUT_MS = 30_000;

export default defineConfig({
  test: {
    include: TEST_FILE_PATTERNS,
    environment: 'node',
    testTimeout: TEST_TIMEOUT_MS,
  },
});
