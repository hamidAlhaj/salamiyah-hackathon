// Runs the main requests of the Postman collection against a running API — a tiny Newman-like runner
// with no dependencies (Node 24 fetch / FormData / Blob). It executes the requests exactly as they are
// stored in the collection (URL, path variables, bodies, auth inheritance) and their test scripts
// through a small `pm` shim, so it also checks that the collection itself works.
//
// Usage (from the repository root, API on :4000 after `cd api; npm run demo:reset`):
//   node docs/postman/tools/run-collection.cjs [--baseUrl http://localhost:4000]
// The flow creates pledges and approves one: run `npm run demo:reset` in api/ afterwards.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '../../..');
const collection = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/postman/salamiyah-hackathon.postman_collection.json'), 'utf8'),
);
const argBase = process.argv.indexOf('--baseUrl');
const vars = Object.fromEntries(collection.variable.map((v) => [v.key, v.value]));
if (argBase > 0) vars.baseUrl = process.argv[argBase + 1];

// A small valid PNG (32×32, solid colour) used for every file field: receipts and proofs.
function samplePng() {
  const w = 32;
  const h = 32;
  const crc = (buf) => {
    let c;
    let crcVal = 0xffffffff;
    for (const b of buf) {
      c = (crcVal ^ b) & 0xff;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcVal = (crcVal >>> 8) ^ c;
    }
    return (crcVal ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set([15, 61, 42], y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const PNG = samplePng();

const index = new Map();
(function collect(items, folder) {
  for (const it of items) {
    if (it.item) collect(it.item, it.name);
    else index.set(`${folder} / ${it.name}`, it);
  }
})(collection.item, '');

const sub = (s) => String(s).replace(/\{\{(\w+)\}\}/g, (_m, k) => (vars[k] ?? ''));

function find(folder, method, pathPattern) {
  for (const [k, it] of index) {
    if (!k.startsWith(`${folder} /`)) continue;
    if (it.request.method === method && '/' + it.request.url.path.join('/') === pathPattern) return [k, it];
  }
  throw new Error(`Not in collection: ${folder} ${method} ${pathPattern}`);
}

async function run(folder, method, pathPattern, opts = {}) {
  const [name, it] = pathPattern.startsWith('LOGIN ')
    ? [`Auth / ${pathPattern.slice(6)}`, index.get(`Demo logins (fictional seed accounts) / ${pathPattern.slice(6)}`)]
    : find(folder, method, pathPattern);
  const req = it.request;
  let url = req.url.raw;
  for (const v of req.url.variable || []) url = url.replace(`:${v.key}`, sub(v.value));
  url = sub(url);
  const headers = {};
  for (const h of req.header || []) headers[h.key] = sub(h.value);
  const auth = req.auth || collection.auth;
  if (auth.type === 'bearer' && vars.token && !opts.noToken) headers.Authorization = `Bearer ${vars.token}`;
  let body;
  if (req.body && req.body.mode === 'raw') {
    const json = JSON.parse(sub(req.body.raw));
    body = JSON.stringify({ ...json, ...(opts.body || {}) });
  } else if (req.body && req.body.mode === 'formdata') {
    body = new FormData();
    for (const f of req.body.formdata) {
      if (f.type === 'file') body.append(f.key, new Blob([PNG], { type: 'image/png' }), 'sample-receipt.png');
      else if (!f.disabled) body.append(f.key, sub(f.value));
    }
  }
  const res = await fetch(url, { method: req.method, headers, body });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  const failures = [];
  const pm = {
    response: {
      code: res.status,
      json: () => json,
      to: {
        be: {
          get success() {
            if (res.status < 200 || res.status > 299) throw new Error(`status ${res.status}`);
            return true;
          },
        },
      },
    },
    collectionVariables: { set: (k, v) => (vars[k] = v), get: (k) => vars[k] },
    test: (n, fn) => {
      try {
        fn();
      } catch (e) {
        failures.push(`${n}: ${e.message}`);
      }
    },
  };
  for (const ev of it.event || []) if (ev.listen === 'test') new Function('pm', ev.script.exec.join('\n'))(pm);
  const expected = opts.expect || 'success';
  const ok = expected === 'success' ? failures.length === 0 : res.status === expected;
  const detail = !ok ? ` ← ${text.slice(0, 160)}` : '';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(res.status).padEnd(3)} ${req.method.padEnd(6)} ${url.replace(vars.baseUrl, '')}  [${name}]${detail}`);
  results.push(ok);
  return json;
}

const results = [];
(async () => {
  await run('Health', 'GET', '/health');
  await run('Auth', 'GET', '/auth/me', { noToken: true, expect: 401 });
  await run('Categories', 'GET', '/categories');
  await run('Campaigns', 'GET', '/campaigns');
  await run('Campaigns', 'GET', '/campaigns/:slug');
  await run('Campaigns', 'GET', '/campaigns/:id/ledger');
  await run('Campaigns', 'GET', '/campaigns/:id/transparency');
  await run('Payment methods & receiving accounts', 'GET', '/payment-methods');
  await run('Payment methods & receiving accounts', 'GET', '/campaigns/:id/payment-accounts');
  await run('Beneficiaries', 'GET', '/campaigns/:id/beneficiaries');
  await run('Expenditures (spending)', 'GET', '/campaigns/:id/spending');
  await run('Hospitals & collection points', 'GET', '/collection-points/active');
  await run('Transparency (stats)', 'GET', '/stats/transparency');

  // Donor: transfer pledge → receipt upload, a simulated (Demo) payment, cash at a collection point.
  await run('Auth', 'POST', 'LOGIN Login as DONOR');
  await run('Auth', 'GET', '/auth/me');
  const pledge = await run('Donations (pledges)', 'POST', '/pledges', { body: { amount: '50000' } });
  await run('Donations (pledges)', 'POST', '/pledges/:id/receipts');
  await run('Donations (pledges)', 'POST', '/pledges/demo', { body: { method: 'SHAM_CASH' } });
  await run('Donations (pledges)', 'POST', '/pledges/cash');
  await run('Donations (pledges)', 'GET', '/pledges/mine');
  await run('Notifications & WhatsApp outbox', 'GET', '/notifications');
  await run('Notifications & WhatsApp outbox', 'GET', '/notifications/unread-count');

  // Collector (Mukhi): the cash pledge appears at their points.
  await run('Auth', 'POST', 'LOGIN Login as COLLECTOR (Mukhi)');
  await run('Collector (Mukhi)', 'GET', '/collector/points');
  await run('Collector (Mukhi)', 'GET', '/collector/pledges');

  // Finance verifier: approve the transfer pledge created above → official receipt + QR.
  await run('Auth', 'POST', 'LOGIN Login as FINANCE_VERIFIER');
  const queue = await run('Verifications (finance)', 'GET', '/verifications');
  const arr = Array.isArray(queue) ? queue : (queue && queue.items) || [];
  const mine = arr.find((v) => (v.pledge && v.pledge.id) === (pledge && pledge.id) || v.pledgeId === (pledge && pledge.id));
  if (mine) vars.verificationId = mine.id;
  const approved = await run('Verifications (finance)', 'POST', '/verifications/:id/approve');
  if (!vars.officialReceiptNo && approved) console.log('      approve response keys:', Object.keys(approved).join(', '));
  await run('Donations (pledges)', 'GET', '/official-receipts/:no');

  // Admin views.
  await run('Auth', 'POST', 'LOGIN Login as ADMIN');
  await run('Categories', 'GET', '/categories/all');
  await run('Campaigns', 'GET', '/campaigns/staff/all');
  await run('Users', 'GET', '/users');
  await run('Notifications & WhatsApp outbox', 'GET', '/outbox');
  await run('Audit', 'GET', '/audit');
  // Role check: a donor-only action as ADMIN must be refused or allowed according to the rules; a collector route must be 403.
  await run('Collector (Mukhi)', 'GET', '/collector/points', { expect: 403 });

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} requests passed.`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
