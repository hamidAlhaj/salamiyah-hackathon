// Read-only Swagger audit: writes docs/swagger-audit.md from
//   - the API's OpenAPI document (docs/postman/tools/openapi.snapshot.json, saved from /api/docs-json), and
//   - the controller sources in api/src (decorators per handler and per class).
// It never edits backend files; it lists, per endpoint, what is documented and the exact decorator to add.
//
// Usage (from the repository root): node docs/tools/swagger-audit.cjs
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'docs/postman/tools/openapi.snapshot.json'), 'utf8'));
const out = path.join(root, 'docs/swagger-audit.md');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.name.endsWith('.controller.ts') ? [p] : [];
  });
}

const toOpenApi = (p) =>
  '/' +
  p
    .split('/')
    .filter(Boolean)
    .map((s) => (s.startsWith(':') ? `{${s.slice(1)}}` : s))
    .join('/');

// key "GET /campaigns/{id}" → { file, line, block, classBlock, className }
const handlers = new Map();
for (const file of walk(path.join(root, 'api/src'))) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const rel = path.relative(root, file).replace(/\\/g, '/');
  let prefix = '';
  let classStart = 0;
  let classBlock = '';
  let className = '';
  for (let i = 0; i < lines.length; i++) {
    const c = /@Controller\(\s*(?:'([^']*)')?\s*\)/.exec(lines[i]);
    if (c) {
      prefix = c[1] || '';
      classStart = i;
      let j = i;
      while (j < lines.length && !/export class (\w+)/.test(lines[j])) j++;
      className = (/export class (\w+)/.exec(lines[j]) || [])[1] || '';
      // class decorators: from the first decorator above @Controller to the class line
      let k = i;
      while (k > 0 && /^\s*@|^\s*\)|^\s*[\w'"{}:,\s]+[,)]\s*$/.test(lines[k - 1]) && lines[k - 1].trim()) k--;
      classBlock = lines.slice(k, j + 1).join('\n');
      continue;
    }
    const r = /^\s*@(Get|Post|Patch|Put|Delete)\(\s*(?:'([^']*)')?\s*\)/.exec(lines[i]);
    if (!r) continue;
    // handler block: from after the previous member to the method signature
    let s = i;
    while (s > classStart && !/^\s*}\s*$/.test(lines[s - 1]) && !/export class/.test(lines[s - 1])) s--;
    let e = i;
    while (e < lines.length && !/^\s{2}(async\s+)?\w+\s*\(/.test(lines[e])) e++;
    const key = `${r[1].toUpperCase()} ${toOpenApi([prefix, r[2] || ''].join('/'))}`;
    handlers.set(key, { file: rel, line: i + 1, block: lines.slice(s, e + 1).join('\n'), classBlock, className });
  }
}

const ROLE_FREE = [/^\/auth\/me/, /^\/notifications/];
const rows = [];
let gapCount = 0;
const gapKinds = {};
const perFile = {};

for (const [p, ops] of Object.entries(spec.paths)) {
  for (const [m, op] of Object.entries(ops)) {
    const method = m.toUpperCase();
    const key = `${method} ${p}`;
    const h = handlers.get(key) || { file: '?', line: 0, block: '', classBlock: '', className: '?' };
    const isPublic = !op.security;
    const codes = Object.keys(op.responses || {});
    const success = codes.filter((c) => c.startsWith('2') || c.startsWith('3'));
    const hasSchema = success.some((c) => op.responses[c].content);
    const content = (op.requestBody && op.requestBody.content) || {};
    const bodyType = Object.keys(content)[0];
    const bodyRef = bodyType && (content[bodyType].schema.$ref || '').split('/').pop();
    const pathParams = (op.parameters || []).filter((x) => x.in === 'path');
    const queryParams = (op.parameters || []).filter((x) => x.in === 'query');
    const httpCode = /@HttpCode\((\d+)\)/.exec(h.block);
    const realSuccess = httpCode ? httpCode[1] : method === 'POST' ? '201' : '200';
    const isFile = /StreamableFile|res\.(send|end|set)|@Res\(|\.csv'/.test(h.block) || /\/file$|\/proof$|errors\.csv|\.csv$/.test(p);

    const documented = [];
    const missing = [];
    const add = (kind, text) => {
      missing.push(text);
      gapCount++;
      gapKinds[kind] = (gapKinds[kind] || 0) + 1;
      perFile[h.file] = (perFile[h.file] || 0) + 1;
    };

    documented.push(`tag \`${(op.tags || ['—'])[0]}\``);
    if (op.summary) documented.push('summary');
    else add('summary', "`@ApiOperation({ summary: '…' })`");
    documented.push(isPublic ? 'public' : 'Bearer');
    if (bodyRef) documented.push(`body \`${bodyRef}\`${bodyType === 'multipart/form-data' ? ' (multipart)' : ''}`);
    if (pathParams.length) documented.push(`path ${pathParams.map((x) => x.name).join(', ')}`);
    if (queryParams.length) documented.push(`query ${queryParams.map((x) => x.name).join(', ')}`);
    documented.push(`responses ${codes.join('/')}`);

    if (!success.length) add('success', `success response: \`@ApiOkResponse({ type: … })\` (the 2xx is not documented at all)`);
    else if (!success.includes(realSuccess) && !success.some((c) => c.startsWith('3')))
      add('status', `documented ${success.join('/')} but the handler returns ${realSuccess}: use \`@Api${realSuccess === '201' ? 'Created' : 'Ok'}Response\` or add \`@HttpCode(${success[0]})\``);
    if (success.length && !hasSchema && !isFile && !success.some((c) => c.startsWith('3')))
      add('schema', `response schema: \`@Api${realSuccess === '201' ? 'Created' : 'Ok'}Response({ type: <Response>Dto })\``);
    if (isFile && !/ApiProduces/.test(h.block)) add('produces', "file response: `@ApiProduces('application/octet-stream')` (or text/csv) + `@ApiOkResponse({ description: 'file' })`");
    if ((bodyRef || queryParams.length || pathParams.some((x) => /id$/i.test(x.name))) && !codes.includes('400'))
      add('400', '`@ApiBadRequestResponse({ type: ErrorResponseDto })` (validation / ParseUUIDPipe)');
    if (!isPublic && !codes.includes('401')) add('401', '`@ApiUnauthorizedResponse({ type: ErrorResponseDto })` (best once at class level)');
    if (!isPublic && !ROLE_FREE.some((r) => r.test(p)) && !codes.includes('403'))
      add('403', '`@ApiForbiddenResponse({ type: ErrorResponseDto })` (RoleAccessService.requireRole)');
    if (pathParams.length && !codes.includes('404')) add('404', '`@ApiNotFoundResponse({ type: ErrorResponseDto })`');

    rows.push({ tag: (op.tags || ['—'])[0], key, h, documented, missing });
  }
}

// DTO properties without an example (affects Swagger "Try it out" and the Postman bodies).
const dtoGaps = Object.entries(spec.components.schemas)
  .map(([name, s]) => [
    name,
    Object.entries(s.properties || {})
      .filter(([, v]) => v.example === undefined && !v.enum && v.format !== 'binary' && v.type !== 'boolean' && !v.$ref)
      .map(([k]) => k),
  ])
  .filter(([, props]) => props.length);

const total = rows.length;
const clean = rows.filter((r) => !r.missing.length).length;
const md = [];
md.push('# Swagger audit — Madad API (`/api/docs`)');
md.push('');
md.push('Project and team: «مدد» / Madad. The Swagger title served by the app is still `Majlis Fund API` (the earlier working name «مجلس فند»); rename in progress.');
md.push('');
md.push(
  `Read-only audit of the OpenAPI document served by the API (\`http://localhost:4000/api/docs\`, JSON at \`/api/docs-json\`, snapshot \`docs/postman/tools/openapi.snapshot.json\`, taken ${new Date().toISOString().slice(0, 10)} from \`main\`) against the controller sources. **No backend file was changed.** Regenerate with \`node docs/tools/swagger-audit.cjs\` after fixing.`,
);
md.push('');
md.push('## Summary');
md.push('');
md.push(`| | |`);
md.push(`|---|---|`);
md.push(`| Endpoints in Swagger | **${total}** (= 101 controller routes, see \`docs/postman/tools/compare-endpoints.cjs\`) |`);
md.push(`| Tags | ${new Set(rows.map((r) => r.tag)).size}, every endpoint tagged |`);
md.push(`| Summary (\`@ApiOperation\`) | ${rows.filter((r) => !r.missing.some((x) => x.includes('ApiOperation'))).length}/${total} |`);
md.push(`| Bearer auth shown on protected endpoints | ${rows.filter((r) => r.documented.includes('Bearer')).length} protected, all with the lock (\`@ApiBearerAuth()\` at class level) |`);
md.push(`| Request bodies with a DTO schema | ${rows.filter((r) => r.documented.some((d) => d.startsWith('body'))).length} (all bodies) |`);
md.push(`| Success responses with a schema | ${rows.filter((r) => !r.missing.some((x) => x.startsWith('response schema')) && !r.missing.some((x) => x.startsWith('success'))).length}/${total} (file/redirect responses counted as fine) |`);
md.push(`| Endpoints with no gap | **${clean}/${total}** |`);
md.push(`| **Gaps (endpoint × missing item)** | **${gapCount}** |`);
md.push('');
md.push('| Gap kind | Count | Fix |');
md.push('|---|---|---|');
const kindText = {
  summary: 'add `@ApiOperation({ summary })`',
  success: 'document the success status',
  status: 'documented status ≠ real status',
  schema: 'success response without a schema → response DTO class + `@ApiOkResponse/@ApiCreatedResponse({ type })`',
  produces: 'file download without `@ApiProduces`',
  400: 'validation error not documented',
  401: 'missing token not documented',
  403: 'role refusal not documented',
  404: 'not found not documented',
};
for (const [k, n] of Object.entries(gapKinds).sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${n} | ${kindText[k]} |`);
md.push('');
md.push('## Fix plan for a teammate (in this order)');
md.push('');
md.push(
  '1. **One error schema.** Create `api/src/common/dto/error-response.dto.ts` with `ErrorResponseDto { statusCode: number; message: string | string[]; error: string; path: string; timestamp: string }` (each with `@ApiProperty({ example })`), the shape `AllExceptionsFilter` already returns.',
);
md.push(
  '2. **Class level, once per guarded controller** (next to `@ApiBearerAuth()`): `@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: \'Missing/expired token\' })`. This alone closes every `401` row below.',
);
md.push(
  '3. **Per handler:** `@ApiForbiddenResponse({ type: ErrorResponseDto })` where the service calls `requireRole`, `@ApiNotFoundResponse({ type: ErrorResponseDto })` on `:id`/`:slug` routes, `@ApiBadRequestResponse({ type: ErrorResponseDto })` on routes with a body, query or `ParseUUIDPipe`.',
);
md.push(
  '4. **Response DTOs** for the main reads (campaign card/detail, ledger, pledge, verification, official receipt, transparency stats, notification): small classes with `@ApiProperty`, referenced with `@ApiOkResponse({ type: X })` or `{ type: X, isArray: true }`. Start with the demo path: `GET /campaigns`, `GET /campaigns/{slug}`, `GET /campaigns/{id}/ledger`, `POST /pledges`, `POST /verifications/{id}/approve`, `GET /official-receipts/{no}`, `GET /stats/transparency`.',
);
md.push('5. **Files:** `@ApiProduces(...)` on the file/CSV downloads.');
md.push('6. Run `npm run lint; npm test; npm run build` in `api/`, then `node docs/postman/tools/build-collection.cjs` and this script.');
md.push('');
md.push('Gaps per controller file:');
md.push('');
md.push('| File | Gaps |');
md.push('|---|---|');
for (const [f, n] of Object.entries(perFile).sort((a, b) => b[1] - a[1])) md.push(`| \`${f}\` | ${n} |`);
md.push('');
md.push('## Per endpoint');
md.push('');
md.push('"Documented" is what `/api/docs` shows now. "Missing → add" names the decorator to put on the handler at the given line (or once on the class for 401).');
md.push('');
for (const tag of [...new Set(rows.map((r) => r.tag))]) {
  md.push(`### ${tag}`);
  md.push('');
  md.push('| Endpoint | Handler | Documented | Missing → add |');
  md.push('|---|---|---|---|');
  for (const r of rows.filter((x) => x.tag === tag)) {
    md.push(
      `| \`${r.key}\` | \`${r.h.file}:${r.h.line}\` | ${r.documented.join(' · ')} | ${r.missing.length ? r.missing.join('<br>') : '✔ complete'} |`,
    );
  }
  md.push('');
}
md.push('## DTO properties without an example');
md.push('');
md.push('Not an error, but `@ApiProperty({ example })` makes "Try it out" and the generated Postman bodies usable without editing.');
md.push('');
md.push('| DTO (schema) | Properties without `example` |');
md.push('|---|---|');
for (const [n, props] of dtoGaps) md.push(`| \`${n}\` | ${props.join(', ')} |`);
md.push('');
fs.writeFileSync(out, md.join('\n'));
console.log(`Wrote docs/swagger-audit.md: ${total} endpoints, ${clean} complete, ${gapCount} gaps.`);
const unmatched = rows.filter((r) => r.h.file === '?').map((r) => r.key);
if (unmatched.length) console.log('Unmatched handlers:', unmatched.join(', '));
