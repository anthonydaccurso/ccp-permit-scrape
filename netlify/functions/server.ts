import 'dotenv/config';
import serverless from 'serverless-http';
import { buildApp } from '../../server/dist/buildApp.js';

let handler: any;

export const handlerBase = async (event: any, context: any) => {
  if (!handler) {
    const app = await buildApp();
    await app.ready();
    handler = serverless(app.server);
  }
  return handler(event, context);
};

export const handler = handlerBase;
