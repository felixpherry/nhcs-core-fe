import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@nhcs/config/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      setupFiles: ['./src/test-setup.ts'],
    },
  }),
);
