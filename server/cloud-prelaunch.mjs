import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { lockPage } from './prelaunch-page.mjs';

const COOKIE = '__Host-sadu_preview';
const TTL = 8 * 3600000;
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' };
const digest = value => createHash('sha256').update(value).digest();
const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });
const cookieHeader = value => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict`;

/**
 * Cloud sessions use a signed expiry, never instance-local authentication state.
 * @param {{ password?: string, now?: () => number }} options
 */
export function createCloudPrelaunch({ password, now = Date.now } = {}) {
  const configured = typeof password === 'string' && password.length >= 20 && password.length <= 256;
  const key = digest(`SADU prelaunch session v1:${configured ? password : randomBytes(32).toString('hex')}`);
  const attempts = new Map(); // Supplemental per-instance throttle; not a distributed firewall.
  const sign = text => createHmac('sha256', key).update(text).digest('hex');
  const verified = request => {
    if (!configured) return false;
    const token = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!token || token.length > 200) return false;
    const [expires, nonce, signature, extra] = token.split('.');
    if (extra !== undefined || !/^\d{13}$/.test(expires) || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false;
    if (Number(expires) <= now() || Number(expires) > now() + TTL) return false;
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(`${expires}.${nonce}`), 'hex'));
  };

  return async function gate(request, next) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith('/api/prelaunch/')) {
      if (path === '/api/prelaunch/session' && request.method === 'GET') return json({ verified: verified(request) });
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
      if (request.headers.get('origin') !== url.origin) return json({ error: 'Same-origin requests required.' }, 403);
      if (path === '/api/prelaunch/lock') return json({ verified: false }, 200, { 'Set-Cookie': `${cookieHeader('')}; Max-Age=0` });
      if (path !== '/api/prelaunch/unlock') return json({ error: 'Unknown endpoint.' }, 404);
      if (!configured) return json({ error: 'Preview access is not configured.' }, 503);
      const time = now();
      const ip = request.headers.get('x-vercel-forwarded-for') || 'unknown';
      for (const [id, item] of attempts) if (item.until <= time) attempts.delete(id);
      if (attempts.size >= 1000 && !attempts.has(ip)) return json({ error: 'Try later.' }, 429);
      const attempt = attempts.get(ip) || { count: 0, until: time + 15 * 60000 };
      if (attempt.count >= 5) return json({ error: 'Try later.' }, 429);
      attempt.count++; attempts.set(ip, attempt);
      let input;
      try {
        if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'JSON required.' }, 415);
        const reader = request.body?.getReader();
        if (!reader) return json({ error: 'Password required.' }, 400);
        const chunks = []; let size = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 1024) { await reader.cancel(); return json({ error: 'Request too large.' }, 413); }
          chunks.push(value);
        }
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch { return json({ error: 'Invalid request.' }, 400); }
      if (typeof input?.password !== 'string' || input.password.length > 256 || !timingSafeEqual(digest(input.password), digest(password))) return json({ error: 'Unable to unlock.' }, 401);
      attempts.delete(ip);
      const payload = `${time + TTL}.${randomBytes(16).toString('hex')}`;
      return json({ verified: true }, 200, { 'Set-Cookie': cookieHeader(`${payload}.${sign(payload)}`) });
    }
    if (verified(request)) return next({ headers });
    if (['GET', 'HEAD'].includes(request.method) && !path.startsWith('/api/') && request.headers.get('accept')?.includes('text/html')) {
      return new Response(request.method === 'HEAD' ? null : lockPage, { status: 401, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return json({ error: 'Preview locked.' }, 401);
  };
}
