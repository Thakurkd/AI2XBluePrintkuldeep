// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './deliverables/tests',
  timeout: 30000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: 'https://the-internet.herokuapp.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  reporter: [
    ['html', { outputFolder: path.resolve(__dirname, 'deliverables', 'reports', 'html-report'), open: 'never' }],
    ['json', { outputFile: path.resolve(__dirname, 'deliverables', 'reports', 'results.json') }],
  ],
});
