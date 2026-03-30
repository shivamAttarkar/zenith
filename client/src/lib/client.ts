import { treaty } from '@elysiajs/eden';
import type { App } from '../../../server/src/index';
import { config } from './config';

// @ts-expect-error - server and client resolve elysia from separate node_modules, causing incompatible types
export const client = treaty<App>(config.backendOrigin);
