import { next } from '@vercel/functions';
import { createCloudPrelaunch } from './server/cloud-prelaunch.mjs';

const gate = createCloudPrelaunch({ password: process.env.SADU_PRELAUNCH_PASSWORD });
export const config = { runtime: 'nodejs', matcher: '/:path*' };

export default function middleware(request: Request) {
  return gate(request, next);
}
