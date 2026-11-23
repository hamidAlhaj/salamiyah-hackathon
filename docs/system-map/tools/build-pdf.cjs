// Builds docs/system-map/system-map-en.pdf and system-map-ar.pdf from the two Markdown files.
// Same approach as docs/study/tools/build-pdf.cjs on the docs-study branch: a tiny Markdown converter here, the PDF
// printed by the installed Google Chrome through the Playwright already installed in e2e/. No new dependencies.
// Fonts: IBM Plex Sans Arabic from mobile/node_modules when present (falls back to system fonts).
//
// Usage (from the repository root): node docs/system-map/tools/build-pdf.cjs [--playwright <dir>]
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '../../..');
const mapDir = path.resolve(__dirname, '..');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(t) {
  const codes = [];
  let s = t.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i) => `<code dir="ltr">${esc(codes[Number(i)])}</code>`);
}

function toHtml(md, baseDir) {
  const out = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  let para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  while (i < lines.length) {
    const l = lines[i];
    if (/^<!-- pagebreak -->/.test(l)) {
      flush();
      // Page breaks are left to the browser (figures never split); the markers only document section groups.
    } else if (/^#{1,3} /.test(l)) {
      flush();
      const n = l.match(/^#+/)[0].length;
      out.push(`<h${n}>${inline(l.slice(n + 1))}</h${n}>`);
    } else if (/^!\[/.test(l)) {
      flush();
      const m = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(l);
      const src = 'file:///' + path.resolve(baseDir, m[2]).replace(/\\/g, '/');
      out.push(`<figure><img src="${src}" alt="${esc(m[1])}"><figcaption>${esc(m[1])}</figcaption></figure>`);
    } else if (/^\|/.test(l)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(
        `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      );
    } else if (/^- /.test(l)) {
      flush();
      const items = [];
      while (i < lines.length && /^(- |  )/.test(lines[i])) {
        if (/^- /.test(lines[i])) items.push(lines[i].slice(2));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      i--;
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
    } else if (!l.trim()) flush();
    else para.push(l.trim());
    i++;
  }
  flush();
  return out.join('\n');
}

function css(rtl) {
  const fontDir = path.join(root, 'mobile/node_modules/@expo-google-fonts');
  const face = (fam, w, rel) => {
    const p = path.join(fontDir, rel);
    return fs.existsSync(p) ? `@font-face{font-family:'${fam}';font-weight:${w};src:url('file:///${p.replace(/\\/g, '/')}')}` : '';
  };
  return `
${face('IBM Plex Sans Arabic', 400, 'ibm-plex-sans-arabic/400Regular/IBMPlexSansArabic_400Regular.ttf')}
${face('IBM Plex Sans Arabic', 700, 'ibm-plex-sans-arabic/700Bold/IBMPlexSansArabic_700Bold.ttf')}
${face('Noto Kufi Arabic', 700, 'noto-kufi-arabic/700Bold/NotoKufiArabic_700Bold.ttf')}
@page{size:A4;margin:16mm 14mm 16mm 14mm}
body{font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;font-size:10.5pt;line-height:1.6;color:#1b2a22;direction:${rtl ? 'rtl' : 'ltr'}}
h1{font-family:'Noto Kufi Arabic','IBM Plex Sans Arabic',sans-serif;font-size:20pt;color:#0f3d2a;margin:0 0 6pt;border-bottom:3px solid #1f6b48;padding-bottom:6pt}
h2{font-family:'Noto Kufi Arabic','IBM Plex Sans Arabic',sans-serif;font-size:14pt;color:#1f6b48;margin:14pt 0 6pt}
p{margin:4pt 0 6pt}ul{margin:4pt 0 8pt;padding-${rtl ? 'right' : 'left'}:18pt}li{margin:2pt 0}
code{font-family:Consolas,monospace;font-size:9pt;background:#eef3f0;padding:0 3px;border-radius:3px;unicode-bidi:isolate}
table{width:100%;border-collapse:collapse;margin:6pt 0 10pt;font-size:9pt;page-break-inside:auto}
th,td{border:1px solid #c3d0c8;padding:3pt 5pt;text-align:${rtl ? 'right' : 'left'};vertical-align:top}
th{background:#e7f2eb}tr{page-break-inside:avoid}
figure{margin:6pt 0 10pt;text-align:center;page-break-inside:avoid}
img{max-width:100%;max-height:112mm;border:1px solid #dfe7e2;border-radius:4px}
figcaption{font-size:8.5pt;color:#55655c}
.pb{page-break-after:always}
`;
}

async function main() {
  const pwArg = process.argv.indexOf('--playwright');
  const pwDir = pwArg > 0 ? process.argv[pwArg + 1] : path.join(root, 'e2e');
  const { chromium } = require(require.resolve('@playwright/test', { paths: [pwDir] }));
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  for (const lang of ['en', 'ar']) {
    const md = fs.readFileSync(path.join(mapDir, `system-map-${lang}.md`), 'utf8');
    const html = `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${css(lang === 'ar')}</style></head><body>${toHtml(md, mapDir)}</body></html>`;
    const tmp = path.join(os.tmpdir(), `majlis-system-map-${lang}.html`);
    fs.writeFileSync(tmp, html);
    await page.goto(`file:///${tmp.replace(/\\/g, '/')}`);
    await page.evaluate(() => document.fonts.ready);
    const pdfPath = path.join(mapDir, `system-map-${lang}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#666">Majlis Fund · System Construction Map · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    const pages = (fs.readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${path.relative(root, pdfPath)}: ${pages} pages`);
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
