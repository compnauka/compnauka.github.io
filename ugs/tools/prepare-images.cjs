// Run with sharp available in NODE_PATH. Source PNGs are preserved.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
async function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(source);
    else if (entry.name.endsWith('.png')) {
      const relative = path.relative(path.join(root, 'assets/images'), source).replace(/\.png$/, '.webp');
      const target = path.join(root, 'assets/optimized', relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await sharp(source).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, alphaQuality: 95 }).toFile(target);
    }
  }
}
walk(path.join(root, 'assets/images')).catch(error => { console.error(error); process.exitCode = 1; });
