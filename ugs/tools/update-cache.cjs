const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]); }
const runtime = ['js','css','assets/optimized'].flatMap(dir=>walk(path.join(root,dir))).filter(file=>/\.(js|css|webp)$/.test(file));
const pages = fs.readdirSync(root).filter(file=>file.endsWith('.html')).map(file=>path.join(root,file));
const core = ['./','./manifest.webmanifest','./assets/app-icon.svg','./assets/video/motion.webm',...[...pages,...runtime].map(file=>'./'+path.relative(root,file).replaceAll('\\','/')).sort()];
const worker = path.join(root,'sw.js');
const source = fs.readFileSync(worker,'utf8');
const handlers = source.slice(source.indexOf('const corePaths'));
const hash = crypto.createHash('sha256');
for (const asset of core.filter(asset=>asset!=='./')) hash.update(asset).update(fs.readFileSync(path.resolve(root,asset)));
const version = hash.digest('hex').slice(0,12);
fs.writeFileSync(worker, `const CACHE = 'digital-superpowers-shell-v10-${version}';\nconst CORE = ` + JSON.stringify(core,null,2) + ';\n' + handlers);
console.log(`Updated cache: ${core.length} resources.`);
