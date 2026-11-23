// Builds docs/postman/salamiyah-hackathon.postman_collection.json (Postman Collection v2.1)
// from the API's own OpenAPI document (Swagger, served by the running API at /api/docs-json).
//
// No dependencies: Node 24 built-ins only.
//
// Usage (from the repository root, with the API running on :4000):
//   node docs/postman/tools/build-collection.cjs            # fetch the live spec, save a snapshot, build
//   node docs/postman/tools/build-collection.cjs --offline  # rebuild from tools/openapi.snapshot.json
'use strict';
const fs = require('fs');
const path = require('path');

const toolsDir = __dirname;
const postmanDir = path.resolve(toolsDir, '..');
const snapshotPath = path.join(toolsDir, 'openapi.snapshot.json');
const outPath = path.join(postmanDir, 'salamiyah-hackathon.postman_collection.json');
const specUrl = process.env.SPEC_URL || 'http://localhost:4000/api/docs-json';

// Folder order = domain order of the README "Backend API Overview".
const FOLDERS = [
  ['Health', ['health'], 'Liveness probe.'],
  ['Auth', ['auth'], 'Register, login (saves {{token}}), current user, optional Google sign-in.'],
  ['Categories', ['categories'], 'Campaign categories are data (MEDICAL_AID, ORPHAN_SPONSORSHIP, HOME_RENOVATION + admin-defined).'],
  ['Campaigns', ['campaigns'], 'Public campaign pages, campaign account (ledger), staff management and lifecycle.'],
  ['Payment methods & receiving accounts', ['payment-methods'], 'Receiving details shown to donors (all fake placeholders) and per-campaign overrides.'],
  ['Beneficiaries', ['beneficiaries'], 'Anonymised beneficiaries (public code B-XXXX) and their campaign links.'],
  ['Medical cases', ['cases'], 'Intake → review → publish pipeline for categories with requiresMedicalCase.'],
  ['Donations (pledges)', ['pledges'], 'Every donation path: transfer + receipt, simulated payment (Demo), cash at a collection point, council and collector entries, official receipts.'],
  ['Collector (Mukhi)', ['collector'], 'Cash confirmation at the collector\'s own collection points. Collectors never verify.'],
  ['Verifications (finance)', ['verifications'], 'FINANCE_VERIFIER approves or rejects; approval issues the official receipt R-YYYY-NNNNNN + QR.'],
  ['Expenditures (spending)', ['expenditures'], 'Spending with public-safe proof, monthly sponsorship runs.'],
  ['Notifications & WhatsApp outbox', ['notifications', 'outbox'], 'In-app notifications and the wa.me outbox (no WhatsApp API).'],
  ['Transparency (stats)', ['stats'], 'Public transparency dashboard data.'],
  ['Hospitals & collection points', ['lookups', 'collection-points'], 'Lookups managed by ADMIN.'],
  ['Users', ['users'], 'Staff and role management (ADMIN).'],
  ['Imports', ['imports'], 'Beneficiary Excel/CSV import: preview → validate → commit.'],
  ['Audit', ['audit'], 'Audit log (ADMIN).'],
];

// Path parameter → collection variable, decided by the resource segment before it.
const PARAM_VARS = {
  campaigns: { id: 'campaignId', slug: 'campaignSlug', method: 'paymentMethod', beneficiaryId: 'beneficiaryId' },
  'payment-accounts': { method: 'paymentMethod' },
  config: { method: 'paymentMethod' },
  pledges: { id: 'pledgeId', referenceNo: 'pledgeReference' },
  'by-reference': { referenceNo: 'pledgeReference' },
  verifications: { id: 'verificationId' },
  cases: { id: 'caseId' },
  beneficiaries: { id: 'beneficiaryId', beneficiaryId: 'beneficiaryId' },
  categories: { id: 'categoryId' },
  hospitals: { id: 'hospitalId' },
  'collection-points': { id: 'collectionPointId' },
  users: { id: 'userId' },
  imports: { id: 'importId' },
  notifications: { id: 'notificationId' },
  outbox: { id: 'outboxId' },
  expenditures: { id: 'expenditureId' },
  documents: { id: 'documentId' },
  receipts: { id: 'receiptId' },
  'official-receipts': { no: 'officialReceiptNo' },
};

// Body fields that reference another record use the same collection variables.
const BODY_ID_VARS = {
  campaignId: 'campaignId',
  categoryId: 'categoryId',
  collectionPointId: 'collectionPointId',
  hospitalId: 'hospitalId',
  beneficiaryId: 'beneficiaryId',
};

// Query parameters filled from collection variables instead of the Swagger example.
const QUERY_OVERRIDES = { entityType: 'Campaign', entityId: '{{campaignId}}', campaignId: '{{campaignId}}' };

// Demo logins: the fictional seed accounts documented in README §8 and DEMO.md.
const DEMO_LOGINS = [
  ['ADMIN', '0900000001'],
  ['CASE_OFFICER', '0900000002'],
  ['FINANCE_VERIFIER', '0900000003'],
  ['STAFF', '0900000004'],
  ['COLLECTOR (Mukhi)', '0900000005'],
  ['DONOR', '0900000006'],
];

// Test scripts that capture ids for the next requests (Postman sandbox syntax).
const OK = "pm.test('status is 2xx', function () { pm.response.to.be.success; });";
const CAPTURE = {
  'POST /auth/login':
    "const body = pm.response.json();\nif (body.accessToken) { pm.collectionVariables.set('token', body.accessToken); }",
  'GET /campaigns':
    "const list = pm.response.json().items || [];\nconst c = list.find(function (x) { return x.status === 'ACTIVE'; }) || list[0];\nif (c) { pm.collectionVariables.set('campaignId', c.id); pm.collectionVariables.set('campaignSlug', c.slug); }",
  'GET /categories':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('categoryId', arr[0].id); }",
  'GET /collection-points/active':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('collectionPointId', arr[0].id); }",
  'POST /pledges':
    "const body = pm.response.json();\nconst p = body.pledge || body;\nif (p.id) { pm.collectionVariables.set('pledgeId', p.id); }\nif (p.referenceNo) { pm.collectionVariables.set('pledgeReference', p.referenceNo); }",
  'POST /pledges/cash':
    "const body = pm.response.json();\nconst p = body.pledge || body;\nif (p.id) { pm.collectionVariables.set('pledgeId', p.id); }\nif (p.referenceNo) { pm.collectionVariables.set('pledgeReference', p.referenceNo); }",
  'GET /verifications':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('verificationId', arr[0].id); }",
  'POST /verifications/{id}/approve':
    "const v = pm.response.json();\nconst no = (v.officialReceipt && v.officialReceipt.receiptNo) || v.officialReceiptNo || v.receiptNo;\nif (no) { pm.collectionVariables.set('officialReceiptNo', no); }",
  'GET /notifications':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('notificationId', arr[0].id); }",
  'GET /beneficiaries':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('beneficiaryId', arr[0].id); }",
  'GET /hospitals':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('hospitalId', arr[0].id); }",
  'GET /cases':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('caseId', arr[0].id); }",
  'GET /users':
    "const list = pm.response.json();\nconst arr = Array.isArray(list) ? list : list.items || [];\nif (arr[0]) { pm.collectionVariables.set('userId', arr[0].id); }",
};

const VARIABLES = [
  ['baseUrl', 'http://localhost:4000', 'API origin (README §4). On a phone/LAN demo: http://<LAN-IP>:4000'],
  ['token', '', 'Set automatically by any Login request (Bearer JWT, 8h). Never commit a real token.'],
  ['demoPassword', 'Majlis@2026', 'Shared password of the FICTIONAL demo seed accounts (README §8). Development only.'],
  ['campaignId', '', 'Set by "List public campaigns".'],
  ['campaignSlug', '', 'Set by "List public campaigns".'],
  ['categoryId', '', 'Set by "List active categories".'],
  ['collectionPointId', '', 'Set by "List active collection points".'],
  ['pledgeId', '', 'Set by "Create pledge" / "Cash pledge".'],
  ['pledgeReference', '', 'Set by "Create pledge" / "Cash pledge".'],
  ['verificationId', '', 'Set by "Finance queue".'],
  ['officialReceiptNo', '', 'Set by "Approve verification" (R-YYYY-NNNNNN).'],
  ['caseId', '', 'Set by "List cases".'],
  ['beneficiaryId', '', 'Set by "List beneficiaries".'],
  ['hospitalId', '', 'Set by "List hospitals".'],
  ['userId', '', 'Set by "List users".'],
  ['notificationId', '', 'Set by "List notifications".'],
  ['paymentMethod', 'SYRIATEL_CASH', 'A PaymentMethod enum value.'],
  ['expenditureId', '', 'Copy from "Campaign spending".'],
  ['importId', '', 'Copy from "Import preview".'],
  ['outboxId', '', 'Copy from "Outbox".'],
  ['documentId', '', 'Copy from "Get case".'],
  ['receiptId', '', 'Copy from "Get pledge".'],
];

// ───────────────────────── helpers ─────────────────────────
function sampleFor(name, prop, schemas) {
  if (prop.$ref) return bodyFromSchema(schemas[prop.$ref.split('/').pop()], schemas);
  if (BODY_ID_VARS[name]) return `{{${BODY_ID_VARS[name]}}}`;
  if (prop.example !== undefined) return prop.example;
  if (prop.default !== undefined) return prop.default;
  if (prop.enum) return prop.enum[0];
  if (prop.type === 'boolean') return false;
  if (prop.type === 'number' || prop.type === 'integer') return 1;
  if (prop.type === 'array') return [];
  if (/password/i.test(name)) return '{{demoPassword}}';
  if (/phone/i.test(name)) return '0944000000';
  if (/date|At$/.test(name)) return '2026-11-24';
  return `<${name}>`;
}

function bodyFromSchema(schema, schemas) {
  const out = {};
  for (const [name, prop] of Object.entries(schema.properties || {})) {
    if (prop.format === 'binary') continue;
    out[name] = sampleFor(name, prop, schemas);
  }
  return out;
}

function urlFor(p, parameters) {
  const segs = p.split('/').filter(Boolean);
  const variable = [];
  const raw = segs.map((s, i) => {
    const m = /^\{(.+)\}$/.exec(s);
    if (!m) return s;
    const owner = segs.slice(0, i).reverse().find((x) => !x.startsWith('{')) || '';
    const varName = (PARAM_VARS[owner] && PARAM_VARS[owner][m[1]]) || m[1];
    variable.push({ key: m[1], value: `{{${varName}}}` });
    return `:${m[1]}`;
  });
  const query = (parameters || [])
    .filter((x) => x.in === 'query')
    .map((x) => ({
      key: x.name,
      value: QUERY_OVERRIDES[x.name] ?? String(
        (x.schema && (x.schema.example ?? x.schema.default ?? (x.schema.enum ? x.schema.enum[0] : ''))) ?? '',
      ),
      description: [x.required ? 'required' : 'optional', x.description].filter(Boolean).join(' — '),
      disabled: !x.required,
    }));
  const qs = query.filter((q) => !q.disabled).map((q) => `${q.key}=${q.value}`).join('&');
  return {
    raw: `{{baseUrl}}/${raw.join('/')}${qs ? `?${qs}` : ''}`,
    host: ['{{baseUrl}}'],
    path: raw,
    ...(query.length ? { query } : {}),
    ...(variable.length ? { variable } : {}),
  };
}

function nameFor(method, p, op) {
  const s = (op.summary || '').trim();
  return s ? s : `${method} ${p}`;
}

function requestItem(method, p, op, schemas) {
  const key = `${method} ${p}`;
  const isPublic = !op.security;
  const headers = [];
  let body;
  const content = (op.requestBody && op.requestBody.content) || {};
  if (content['application/json']) {
    const ref = content['application/json'].schema.$ref;
    const schema = ref ? schemas[ref.split('/').pop()] : content['application/json'].schema;
    headers.push({ key: 'Content-Type', value: 'application/json' });
    body = {
      mode: 'raw',
      raw: JSON.stringify(bodyFromSchema(schema, schemas), null, 2),
      options: { raw: { language: 'json' } },
    };
  } else if (content['multipart/form-data']) {
    const ref = content['multipart/form-data'].schema.$ref;
    const schema = ref ? schemas[ref.split('/').pop()] : content['multipart/form-data'].schema;
    const required = new Set(schema.required || []);
    body = {
      mode: 'formdata',
      formdata: Object.entries(schema.properties || {}).map(([name, prop]) =>
        prop.format === 'binary'
          ? { key: name, type: 'file', src: [], description: `${prop.description || 'file'} — choose a file (JPEG/PNG/PDF)` }
          : {
              key: name,
              type: 'text',
              value: String(sampleFor(name, prop, schemas)),
              ...(required.has(name) ? {} : { disabled: true, description: 'optional' }),
            },
      ),
    };
  }
  const login = key === 'POST /auth/login';
  const exec = [OK];
  if (CAPTURE[key]) exec.push(CAPTURE[key]);
  const errors = Object.keys(op.responses || {}).filter((c) => Number(c) >= 400);
  const description = [
    op.summary || '',
    isPublic ? 'Public endpoint (no token).' : 'Requires `Authorization: Bearer {{token}}` — log in with the role named in the summary first (folder Auth → Demo logins).',
    errors.length ? `Documented errors: ${errors.join(', ')}. Error body: { statusCode, message, error, path, timestamp }.` : '',
    `Swagger: {{baseUrl}}/api/docs#/${(op.tags || [''])[0]}/${op.operationId}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    name: login ? 'Login (saves {{token}})' : nameFor(method, p, op),
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: exec.join('\n').split('\n') } }],
    request: {
      ...(isPublic ? { auth: { type: 'noauth' } } : {}),
      method,
      header: headers,
      ...(body ? { body } : {}),
      url: urlFor(p, op.parameters),
      description,
    },
    response: [],
  };
}

async function loadSpec() {
  if (process.argv.includes('--offline')) return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const res = await fetch(specUrl);
  if (!res.ok) throw new Error(`GET ${specUrl} → ${res.status}`);
  const spec = await res.json();
  fs.writeFileSync(snapshotPath, JSON.stringify(spec, null, 2) + '\n');
  return spec;
}

(async () => {
  const spec = await loadSpec();
  const schemas = spec.components.schemas;
  const used = new Set();
  const folders = FOLDERS.map(([name, tags, desc]) => {
    const item = [];
    for (const [p, ops] of Object.entries(spec.paths)) {
      for (const [m, op] of Object.entries(ops)) {
        if (!tags.includes((op.tags || [])[0])) continue;
        used.add(`${m.toUpperCase()} ${p}`);
        item.push(requestItem(m.toUpperCase(), p, op, schemas));
      }
    }
    if (name === 'Auth') {
      item.push({
        name: 'Demo logins (fictional seed accounts)',
        description: 'One login per role. Each one saves {{token}}, so the last login decides who you are.',
        item: DEMO_LOGINS.map(([role, phone]) => ({
          name: `Login as ${role}`,
          event: [{ listen: 'test', script: { type: 'text/javascript', exec: [OK, ...CAPTURE['POST /auth/login'].split('\n')] } }],
          request: {
            auth: { type: 'noauth' },
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ phone, password: '{{demoPassword}}' }, null, 2),
              options: { raw: { language: 'json' } },
            },
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            description: `Fictional seed account (${role}). Saves the token into {{token}}.`,
          },
          response: [],
        })),
      });
    }
    return { name, description: desc, item };
  });
  const missing = Object.entries(spec.paths).flatMap(([p, ops]) =>
    Object.keys(ops).map((m) => `${m.toUpperCase()} ${p}`).filter((k) => !used.has(k)),
  );
  if (missing.length) throw new Error(`Operations without a folder: ${missing.join(', ')}`);

  const collection = {
    info: {
      name: 'Athar (أثر) API — salamiyah-hackathon',
      description:
        'Every endpoint of the NestJS API (generated from its Swagger document; see docs/postman/README.md).\n\n' +
        '1. Set {{baseUrl}} (default http://localhost:4000).\n2. Run Auth → Login or Auth → Demo logins → Login as <ROLE>; the test script saves {{token}}.\n' +
        '3. Protected requests inherit Bearer {{token}} from the collection. Public requests use No Auth.\n\n' +
        'All data is fictional (demo seed). No secrets or real phone numbers are stored here.\n\n' +
        'The app UI and the Swagger title still show the earlier working name «مجلس فند» (Majlis Fund API); rename in progress.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
    variable: VARIABLES.map(([key, value, description]) => ({ key, value, type: 'string', description })),
    item: folders,
  };
  fs.writeFileSync(outPath, JSON.stringify(collection, null, 2) + '\n');
  const count = folders.reduce((n, f) => n + f.item.filter((i) => i.request).length, 0);
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}: ${count} endpoint requests in ${folders.length} folders (+${DEMO_LOGINS.length} demo logins).`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
