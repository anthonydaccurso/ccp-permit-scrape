import 'dotenv/config';
import serverless from 'serverless-http';
import { buildApp } from '../../server/dist/buildApp.js';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await buildApp();
    await app.ready();
    cachedHandler = serverless(app.server);
  }
  return cachedHandler(event, context);
};
