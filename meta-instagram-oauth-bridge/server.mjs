import http from 'node:http';
import { URL } from 'node:url';

const port = Number(process.env.PORT || 10000);
const localCallback = 'http://127.0.0.1:47321/auth/meta/callback';
const allowedParams = new Set(['code', 'state', 'error', 'error_reason', 'error_description']);

function reply(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store, max-age=0',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'https://callback.invalid');

  if (req.method === 'GET' && url.pathname === '/healthz') {
    return reply(res, 200, 'ok');
  }

  if (req.method !== 'GET' || url.pathname !== '/auth/meta/callback') {
    return reply(res, 404, 'Not found');
  }

  if (url.search.length > 8192) return reply(res, 400, 'Invalid callback');

  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (!allowedParams.has(key) || params.has(key)) return reply(res, 400, 'Invalid callback');
    params.set(key, value);
  }

  const state = params.get('state') || '';
  const code = params.get('code') || '';
  const hasError = params.has('error') || params.has('error_reason');

  // Engaje Publisher creates 24 random bytes encoded as 48 lowercase hex characters.
  // Reject malformed input before sending the callback to the fixed local app.
  if (!/^[a-f0-9]{48}$/.test(state)) return reply(res, 400, 'Invalid OAuth state');
  if (!hasError && (!code || code.length > 4096)) return reply(res, 400, 'Invalid OAuth code');

  res.writeHead(303, {
    location: `${localCallback}?${params.toString()}`,
    'cache-control': 'no-store, max-age=0',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'"
  });
  res.end();
});

server.listen(port, '0.0.0.0', () => {
  // Deliberately do not log request URLs: OAuth codes arrive in the callback query.
  console.log(`Meta OAuth callback bridge listening on ${port}`);
});
