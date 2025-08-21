import { Hono } from 'hono';

const app = new Hono();

app.get('/api/health/ping', c => c.json({ ok: true }));

// 1×1 PNG (dark) so your white logo won't vanish if you reuse it
const ONE_BY_ONE_DARK = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABu6N1fwAAAABJRU5ErkJggg=='),
  c => c.charCodeAt(0)
);

// Favicon + icon placeholders (replace later with real files if you want)
app.get('/favicon.ico', c => c.body(ONE_BY_ONE_DARK, 200, { 'Content-Type': 'image/png' }));
app.get('/icon.png',   c => c.body(ONE_BY_ONE_DARK, 200, { 'Content-Type': 'image/png' }));

export default app;