// Compares the Postman collection with the routes declared in api/src/**/*.controller.ts.
// Reads the controller source directly (regex over @Controller / @Get / @Post / @Patch / @Put / @Delete),
// so it does not depend on Swagger being complete.
//
// Usage (from the repository root): node docs/postman/tools/compare-endpoints.cjs
// Exit code 1 when an endpoint is missing from either side.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiSrc = path.join(root, 'api/src');
const collectionPath = path.join(root, 'docs/postman/salamiyah-hackathon.postman_collection.json');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.name.endsWith('.controller.ts') ? [p] : [];
  });
}

const norm = (p) =>
  '/' +
  p
    .split('/')
    .filter(Boolean)
    .map((s) => (s.startsWith(':') ? ':param' : s))
    .join('/');

const fromCode = new Map();
for (const file of walk(apiSrc)) {
  const src = fs.readFileSync(file, 'utf8');
  // Split by class: each @Controller(...) starts a new prefix.
  const re = /@Controller\(\s*(?:'([^']*)')?\s*\)|@(Get|Post|Patch|Put|Delete)\(\s*(?:'([^']*)')?\s*\)/g;
  let prefix = '';
  let m;
  while ((m = re.exec(src))) {
    if (m[0].startsWith('@Controller')) {
      prefix = m[1] || '';
      continue;
    }
    const full = norm([prefix, m[3] || ''].join('/'));
    const key = `${m[2].toUpperCase()} ${full}`;
    const line = src.slice(0, m.index).split('\n').length;
    fromCode.set(key, `${path.relative(root, file).replace(/\\/g, '/')}:${line}`);
  }
}

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
const fromPostman = new Set();
(function collect(items) {
  for (const it of items) {
    if (it.item) collect(it.item);
    else if (it.request) {
      const p = it.request.url.path.join('/');
      fromPostman.add(`${it.request.method} ${norm(p)}`);
    }
  }
})(collection.item);

const missingInPostman = [...fromCode.keys()].filter((k) => !fromPostman.has(k));
const extraInPostman = [...fromPostman].filter((k) => !fromCode.has(k));
console.log(`Controllers: ${fromCode.size} endpoints · Postman: ${fromPostman.size} distinct endpoints`);
for (const k of missingInPostman) console.log(`  MISSING in Postman: ${k}  (${fromCode.get(k)})`);
for (const k of extraInPostman) console.log(`  NOT in controllers: ${k}`);
if (!missingInPostman.length && !extraInPostman.length) console.log('OK: every controller endpoint is in the collection, and nothing else.');
process.exit(missingInPostman.length || extraInPostman.length ? 1 : 0);
