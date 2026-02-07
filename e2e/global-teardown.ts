import { stopServer } from './helpers/server';

async function globalTeardown() {
  await stopServer();
}

export default globalTeardown;
