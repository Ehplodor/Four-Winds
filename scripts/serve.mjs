// Petit serveur statique sans dépendance : node scripts/serve.mjs [port]
// Il n'écoute que sur cette machine (127.0.0.1). Pour tester depuis un téléphone du réseau local :
//   HOST=0.0.0.0 node scripts/serve.mjs
// (le duel en direct exige alors https, car Web Crypto n'est disponible que sur une page sécurisée ou localhost).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.argv[2] || process.env.PORT || 8080);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

function send(res, status, body = '', headers = {}) {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode non autorisée');

  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(res, 400, 'Requête invalide');
  }
  // Pas de fichiers ou dossiers cachés (.git, .env…) ni d'octet nul.
  if (path.includes('\0') || path.split('/').some((part) => part.startsWith('.'))) return send(res, 404, 'Introuvable');

  const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
  if (file !== root && !file.startsWith(root + sep)) return send(res, 403, 'Interdit');

  try {
    const body = await readFile(file);
    send(res, 200, req.method === 'HEAD' ? '' : body, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  } catch {
    send(res, 404, 'Introuvable');
  }
}).listen(port, host, () => console.log(`Les Quatre Vents : http://localhost:${port} (écoute sur ${host})`));
