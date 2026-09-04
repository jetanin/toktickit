import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/lab-02',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: './server',
      port: 3001,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      cwd: './client',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
