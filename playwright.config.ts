const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /playwright\.spec\.(ts|js)$/,
  timeout: 30000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8100',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8100',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
