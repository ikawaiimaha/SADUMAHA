import type { IncomingMessage, ServerResponse } from 'node:http';

export const retiredPortraitPaths = [
  '/sultan_portrait.jpg',
  '/owais_portrait.jpg',
  '/qaseer_portrait.jpg',
] as const;

// Keep local dev/preview behavior consistent with the explicit Vercel 404 route.
export function retiredPortraitMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const pathname = (req.url ?? '').split('?')[0].toLowerCase();
  if (!retiredPortraitPaths.some(path => path === pathname)) return next();
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}
