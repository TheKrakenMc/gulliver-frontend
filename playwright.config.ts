import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const python = process.env.GULLIVER_PYTHON || (process.platform === 'win32' ? resolve('../gulliver-api/.venv/Scripts/python.exe') : 'python');
const database = process.env.GULLIVER_TEST_DATABASE_URL || 'postgresql+psycopg2://gulliver:gulliver_test_only@127.0.0.1:55439/gulliver_test';
export default defineConfig({
  testDir:'tests/browser', workers:1, timeout:60000,
  globalSetup:'./tests/browser/global-setup.ts',
  use:{baseURL:'http://127.0.0.1:4179',viewport:{width:1024,height:768},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:[
    {command:'"'+python+'" -m uvicorn app.main:app --host 127.0.0.1 --port 8009',cwd:'../gulliver-api',url:'http://127.0.0.1:8009/health',reuseExistingServer:false,timeout:60000,
      env:{DATABASE_URL:database,SECRET_KEY:'browser-test-secret-not-for-real-deployments-123',CORS_ORIGINS:'["http://127.0.0.1:4179"]'}},
    {command:'npm run build && npm run preview -- --host 127.0.0.1 --port 4179',url:'http://127.0.0.1:4179',reuseExistingServer:false,timeout:120000,
      env:{VITE_API_URL:'http://127.0.0.1:8009/api/v1'}},
  ],
});
