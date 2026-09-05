/* Проставляє CACHE_VERSION у service-worker.js як хеш вмісту гри.
 *
 *   node tools/stamp-cache-version.mjs          — записати актуальне значення
 *   node tools/stamp-cache-version.mjs --check  — тільки перевірити (код 1, якщо застаріло)
 *
 * Навіщо: Service Worker перевстановлюється лише тоді, коли змінюється сам його
 * файл. Якщо правити styles.css чи js/*.js, не чіпаючи воркер, браузер вважає
 * що оновлення немає. Хеш вмісту робить цей зв'язок автоматичним.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const swPath = path.join(root, 'service-worker.js');

const VERSION_RE = /^const CACHE_VERSION = '([^']*)';$/m;

export function computeVersion() {
  const source = fs.readFileSync(swPath, 'utf8');

  const listMatch = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  if (!listMatch) throw new Error('service-worker.js: не знайдено масив APP_SHELL');

  const files = [...listMatch[1].matchAll(/'([^']+)'/g)]
    .map((m) => m[1])
    .filter((entry) => entry !== './') // це той самий index.html
    .map((entry) => entry.replace(/^\.\//, ''))
    .sort();

  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) throw new Error(`APP_SHELL посилається на відсутній файл: ${file}`);
    hash.update(file);
    hash.update(fs.readFileSync(full));
  }

  // Логіка самого воркера теж входить у хеш — але з нейтралізованим рядком
  // версії, інакше вийшла б рекурсія «змінили версію → змінився хеш».
  hash.update(source.replace(VERSION_RE, "const CACHE_VERSION = '';"));

  return { version: 'v' + hash.digest('hex').slice(0, 12), fileCount: files.length, source };
}

export function readVersion(source = fs.readFileSync(swPath, 'utf8')) {
  const match = source.match(VERSION_RE);
  if (!match) throw new Error("service-worker.js: не знайдено рядок const CACHE_VERSION = '...';");
  return match[1];
}

function main() {
  const check = process.argv.includes('--check');
  const { version, fileCount, source } = computeVersion();
  const current = readVersion(source);

  if (current === version) {
    console.log(`CACHE_VERSION актуальна: ${version} (${fileCount} файлів)`);
    return;
  }

  if (check) {
    console.error(`CACHE_VERSION застаріла: у файлі ${current}, має бути ${version}`);
    console.error('Виправити: node games/dyvo-pazzle/tools/stamp-cache-version.mjs');
    process.exit(1);
  }

  fs.writeFileSync(swPath, source.replace(VERSION_RE, `const CACHE_VERSION = '${version}';`));
  console.log(`CACHE_VERSION оновлено: ${current} → ${version} (${fileCount} файлів)`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
