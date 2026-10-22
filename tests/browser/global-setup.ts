import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export default function setup() {
  const python=process.env.GULLIVER_PYTHON || (process.platform==='win32'?'.venv/Scripts/python.exe':'python');
  const data=execFileSync(python,['tests/seed_browser.py'],{cwd:resolve('../gulliver-api'),encoding:'utf8',
    env:{...process.env,DATABASE_URL:process.env.GULLIVER_TEST_DATABASE_URL || 'postgresql+psycopg2://gulliver:gulliver_test_only@127.0.0.1:55439/gulliver_test',SECRET_KEY:'browser-test-secret-not-for-real-deployments-123'}});
  mkdirSync('.e2e',{recursive:true});writeFileSync('.e2e/fixture.json',data);
}
