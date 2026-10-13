import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'backend',
          environment: 'node',
          include: ['backend/test/**/*.test.ts'],
          globals: true,
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['frontend/test/**/*.test.{ts,tsx}'],
          setupFiles: ['./frontend/test/setup.ts'],
          globals: true,
        },
      },
    ],
  },
});
