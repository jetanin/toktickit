import { defineConfig, devices } from '@playwright/test';

const isolated = process.env.E2E_ISOLATED === '1';
const apiPort = isolated ? 3002 : 3001;
const clientPort = isolated ? 5174 : 5173;

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: `http://localhost:${clientPort}`,
    timezoneId: 'Asia/Bangkok',
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
      port: apiPort,
      env: { PORT: String(apiPort) },
      reuseExistingServer: !isolated,
      timeout: 120000,
    },
    {
      command: `npm run dev -- --port ${clientPort} --strictPort`,
      cwd: './client',
      port: clientPort,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
      reuseExistingServer: !isolated,
      timeout: 120000,
    },
  ],
});
