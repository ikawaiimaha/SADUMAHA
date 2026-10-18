import { next } from '@vercel/functions';

export const config = { runtime: 'nodejs', matcher: '/api/prelaunch/:path*' };

/**
 * The hosted prototype is open to anyone with the link, so it can be shown without a preview password.
 * Pilot records stay behind each person's own SADU sign-in and the database's access rules.
 * The local rehearsal and connected-pilot servers keep their password gate (server/prelaunch-gate.mjs).
 */
export default function middleware(request: Request) {
  const path = new URL(request.url).pathname;
  if (path === '/api/prelaunch/session') return Response.json({ verified: true, open: true }, { headers: { 'Cache-Control': 'no-store' } });
  if (path === '/api/prelaunch/lock' || path === '/api/prelaunch/unlock') return Response.json({ verified: true, open: true });
  return next();
}
