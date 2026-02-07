import { buildApp, startServer, importTestData } from './helpers/server';

async function globalSetup() {
  await buildApp();
  await startServer();
  await importTestData();
}

export default globalSetup;
