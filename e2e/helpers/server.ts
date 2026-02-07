import { execSync, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const E2E_DIR = path.resolve(__dirname, '..');
const SERVER_BINARY = path.join(PROJECT_ROOT, 'bin', 'server-e2e');
const DB_PATH = path.join(PROJECT_ROOT, 'test-e2e.db');
const MEDIA_ROOT = path.join(E2E_DIR, 'fixtures', 'media');
const PORT = '18080';
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess: ChildProcess | null = null;

export async function buildApp(): Promise<void> {
  console.log('Building frontend...');
  execSync('npm run build', {
    cwd: path.join(PROJECT_ROOT, 'frontend'),
    stdio: 'inherit',
  });

  console.log('Building backend...');
  execSync(`go build -o ${SERVER_BINARY} ./cmd/server`, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
}

export async function startServer(): Promise<void> {
  // 既存の DB を削除
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  console.log('Starting server...');
  serverProcess = spawn(SERVER_BINARY, [], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      MOVIES_DB_PATH: DB_PATH,
      MOVIES_MEDIA_ROOT: MEDIA_ROOT,
      MOVIES_PORT: PORT,
    },
    stdio: 'pipe',
  });

  serverProcess.stdout?.on('data', (data) => {
    process.stdout.write(`[server] ${data}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    process.stderr.write(`[server] ${data}`);
  });

  // ヘルスチェック（リトライ付き）
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(`${BASE_URL}/api/v1/videos`);
      console.log('Server is ready!');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Server failed to start within timeout');
}

export async function importTestData(): Promise<void> {
  const testData = JSON.parse(
    fs.readFileSync(path.join(E2E_DIR, 'fixtures', 'test-data.json'), 'utf-8')
  );

  console.log('Importing test data...');
  const response = await axios.post(`${BASE_URL}/api/v1/import`, testData);
  console.log(`Imported: ${response.data.imported} videos`);
}

export async function stopServer(): Promise<void> {
  if (!serverProcess) return;

  console.log('Stopping server...');
  serverProcess.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      serverProcess?.kill('SIGKILL');
      resolve();
    }, 5000);

    serverProcess?.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  serverProcess = null;

  // DB ファイルを削除
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}

export function getServerProcess(): ChildProcess | null {
  return serverProcess;
}

export function setServerProcess(proc: ChildProcess | null): void {
  serverProcess = proc;
}
