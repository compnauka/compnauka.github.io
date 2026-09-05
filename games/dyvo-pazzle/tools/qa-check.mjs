import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const siteRoot = path.resolve(root, '..', '..');
const required = [
  'index.html','styles.css','manifest.webmanifest','service-worker.js',
  'js/app.js','js/camera.js','js/crop-controller.js','js/image-processor.js','js/puzzle-game.js','js/effects.js',
  'assets/pwa/icon-192.png','assets/pwa/icon-512.png','assets/pwa/icon-maskable-512.png'
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing: ${file}`);
}

// Cloudflare Workers Static Assets читає лише кореневий _headers сайту,
// тому серверні заголовки гри перевіряємо саме там.
const headersFile = path.join(siteRoot, '_headers');
if (!fs.existsSync(headersFile)) {
  errors.push('Missing: _headers у корені сайту');
} else {
  const headers = fs.readFileSync(headersFile, 'utf8');
  const block = headers.split(/^(?=\S)/m).find((chunk) => chunk.startsWith('/games/dyvo-pazzle/*'));
  if (!block) {
    errors.push('_headers: немає правила /games/dyvo-pazzle/*');
  } else {
    for (const header of ['Content-Security-Policy', 'Permissions-Policy']) {
      if (!block.includes(header)) errors.push(`_headers: у /games/dyvo-pazzle/* немає ${header}`);
    }
    if (!/frame-ancestors\s+'none'/.test(block)) errors.push("_headers: у CSP гри немає frame-ancestors 'none'");
    if (!/camera=\(self\)/.test(block)) errors.push('_headers: Permissions-Policy гри не дозволяє камеру');
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (duplicateIds.length) errors.push(`Duplicate IDs: ${duplicateIds.join(', ')}`);
if (/https?:\/\//i.test(html)) errors.push('index.html contains an external http(s) URL');
if (!html.includes('Content-Security-Policy')) errors.push('Missing CSP meta tag');
if (!html.includes('type="module" src="./js/app.js"')) errors.push('Missing module entry script');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') errors.push('Manifest display is not standalone');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) errors.push('Manifest icon set incomplete');

const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
if (!sw.includes("CACHE_PREFIX = 'divo-puzzle-'")) errors.push('Service Worker cache prefix missing');
if (/\bself\.skipWaiting\s*\(/.test(sw)) errors.push('Service Worker uses skipWaiting()');
if (/\bself\.clients\.claim\s*\(/.test(sw)) errors.push('Service Worker uses clients.claim()');

const allSourceFiles = ['styles.css','service-worker.js', ...fs.readdirSync(path.join(root,'js')).map((f)=>`js/${f}`)];
for (const file of allSourceFiles) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  if (/https?:\/\//i.test(text)) errors.push(`${file} contains an external http(s) URL`);
}

if (errors.length) {
  console.error('QA FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`QA OK — ${required.length} required files, ${ids.length} unique HTML IDs, standalone PWA, isolated Service Worker cache.`);
