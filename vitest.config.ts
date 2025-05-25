import { defineConfig } from 'vitest/config';
// import tsconfigPaths from 'vite-tsconfig-paths'; // Not strictly needed for this project structure yet

export default defineConfig({
  // plugins: [tsconfigPaths()], // Only if using tsconfig paths extensively for module resolution
  test: {
    globals: true, // Allows use of describe, it, expect, etc. without importing them
    environment: 'node', // Using 'node' for these simple utility function tests
    coverage: { // Optional: for coverage reports
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage', // Specify output directory for coverage reports
    },
  },
});
