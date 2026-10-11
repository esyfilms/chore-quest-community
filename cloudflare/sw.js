// Network-only worker: never cache family records, photos, credentials or requests.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || req.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(req).catch(() => new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chore Quest - Offline</title><style>body{margin:0;background:#faf9f3;color:#26382f;font:18px/1.5 system-ui}main{max-width:28rem;margin:12vh auto;padding:24px}button{font:inherit;padding:12px 24px;border:2px solid #26382f;border-radius:8px;background:#fffefa}</style><main><h1>You're offline</h1><p>Connect to the internet to open Chore Quest. Chores, photos and money actions need a connection.</p><form method="get" action="/"><button>Try again</button></form></main></html>`, {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'"}})));
});
