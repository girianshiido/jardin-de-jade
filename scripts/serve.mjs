import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
const port = Number(process.env.PORT || 5187);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.rsc': 'text/x-component; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    let path = resolve(root, `.${pathname}`);
    if (
      path !== root.replace(/\/$/, '') &&
      !path.startsWith(root.endsWith(sep) ? root : root + sep)
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Page introuvable.');
  }
});
server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Le port ${port} est déjà utilisé. Choisissez un autre PORT.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Jardin de Jade : http://127.0.0.1:${port}/`);
  for (const entries of Object.values(networkInterfaces()))
    for (const entry of entries || [])
      if (entry.family === 'IPv4' && !entry.internal)
        console.log(
          `Téléphone / tablette (même Wi-Fi) : http://${entry.address}:${port}/`,
        );
});
