// Builds the four submission Word files in docs/submission/ with the guide's exact name patterns:
//   <team-ar>_ملخص-المشروع.docx · <TeamName>_ProjectBrief_EN.docx
//   <team-ar>_الدراسة-التحليلية-والتصميمية.docx · <TeamName>_AnalysisDesign_EN.docx
// and a PDF of each in docs/submission/pdf/ (to check the real page count, RTL and diagram readability).
//
// No dependencies: Node writes Word-flavoured HTML (RTL for Arabic, Arial, A4), then Microsoft Word itself
// (COM automation through tools/html-to-docx.ps1) opens it, embeds the PNG diagrams, saves .docx and .pdf and
// reports the page count. Windows + Word required.
//
// Usage (from the repository root):
//   node docs/submission/tools/build-docx.cjs [--team-en Athar] [--team-ar أثر]
//                                             [--label-en Athar] [--label-ar أثر]
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { brief, analysis, MEMBERS } = require('./content.cjs');

const root = path.resolve(__dirname, '../../..');
const outDir = path.resolve(__dirname, '..');
const pdfDir = path.join(outDir, 'pdf');
const diagrams = path.join(root, 'docs/diagrams');
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > 0 ? process.argv[i + 1] : d;
};
const TEAM_EN = arg('--team-en', 'Athar');
const TEAM_AR = arg('--team-ar', 'أثر');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Content strings may contain <b>…</b>; everything else is escaped.
const rich = (s) => esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
// The team label printed inside the documents (the file names keep --team-en / --team-ar).
const LABEL_EN = arg('--label-en', 'Athar');
const LABEL_AR = arg('--label-ar', 'أثر');
const fill = (s) => s.replace('TEAM_AR', LABEL_AR).replace('TEAM_EN', LABEL_EN);

function page(lang, bodyHtml, { size = 10.5 } = {}) {
  const rtl = lang === 'ar';
  const dir = rtl ? 'rtl' : 'ltr';
  const align = rtl ? 'right' : 'left';
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"><meta name="ProgId" content="Word.Document">
<style>
@page WordSection1 { size: 595.3pt 841.9pt; margin: 42pt 46pt 42pt 46pt; }
div.WordSection1 { page: WordSection1; }
@page WordSection2 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 30pt 30pt 30pt 30pt; }
div.WordSection2 { page: WordSection2; }
@page WordSection3 { size: 595.3pt 841.9pt; margin: 42pt 46pt 42pt 46pt; }
div.WordSection3 { page: WordSection3; }
body, p, li, td, th { font-family: Arial; mso-bidi-font-family: Arial; font-size: ${size}pt; mso-bidi-font-size: ${size}pt; }
p { margin: 0 0 4pt 0; line-height: 125%; text-align: ${align}; direction: ${dir}; }
h1 { font-family: Arial; mso-bidi-font-family: Arial; font-size: 17pt; mso-bidi-font-size: 17pt; color: #0F3D2A; margin: 0 0 2pt 0; text-align: ${align}; }
h2 { font-family: Arial; mso-bidi-font-family: Arial; font-size: 12.5pt; mso-bidi-font-size: 12.5pt; color: #1F6B48; margin: 9pt 0 3pt 0; text-align: ${align}; border-bottom: solid #1F6B48 1pt; }
.sub { color: #55655C; font-size: ${size - 1}pt; mso-bidi-font-size: ${size - 1}pt; margin-bottom: 6pt; }
table { border-collapse: collapse; width: 100%; margin: 2pt 0 6pt 0; }
td, th { border: solid #B7C6BD 1pt; padding: 2pt 4pt; vertical-align: top; text-align: ${align}; }
th { background: #E7F2EB; }
li { margin: 0 0 2pt 0; text-align: ${align}; }
.uc { margin: 5pt 0 2pt 0; }
.cap { color: #55655C; font-size: 8.5pt; mso-bidi-font-size: 8.5pt; text-align: center; }
.img { text-align: center; margin: 2pt 0 0 0; }
</style></head>
<body dir="${dir}"><div class="WordSection1" dir="${dir}">${bodyHtml}</div></body></html>`;
}

function para(lang, html, cls) {
  return `<p dir="${lang === 'ar' ? 'rtl' : 'ltr'}"${cls ? ` class="${cls}"` : ''}>${html}</p>`;
}
function table(lang, head, rows) {
  const d = lang === 'ar' ? 'rtl' : 'ltr';
  return `<table dir="${d}"><tr>${head.map((h) => `<th dir="${d}">${rich(h)}</th>`).join('')}</tr>${rows
    // GitHub handles (@user) stay left-to-right inside Arabic cells.
    .map((r) => `<tr>${r.map((c) => `<td dir="${d}">${c.startsWith('@') ? `<span dir="ltr">${esc(c)}</span>` : rich(c)}</td>`).join('')}</tr>`)
    .join('')}</table>`;
}
function list(lang, items, ordered) {
  const d = lang === 'ar' ? 'rtl' : 'ltr';
  const t = ordered ? 'ol' : 'ul';
  return `<${t} dir="${d}">${items.map((x) => `<li dir="${d}">${rich(x)}</li>`).join('')}</${t}>`;
}
function img(file, caption, widthPx) {
  const p = path.join(diagrams, file);
  const src = 'file:///' + p.replace(/\\/g, '/');
  // Word needs both dimensions, otherwise it keeps the PNG's own height and stretches the picture.
  const png = fs.readFileSync(p);
  const heightPx = Math.round((widthPx * png.readUInt32BE(20)) / png.readUInt32BE(16));
  return `<p class="img"><img src="${src}" width="${widthPx}" height="${heightPx}" style="width:${widthPx}px;height:${heightPx}px"></p><p class="cap">${esc(caption)}</p>`;
}

function briefHtml(lang) {
  const c = brief[lang];
  let h = `<h1 dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${esc(c.title)}</h1>` + para(lang, esc(fill(c.sub)), 'sub');
  for (const [t, ps] of c.sections) {
    h += `<h2 dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${esc(t)}</h2>` + ps.map((x) => para(lang, rich(x))).join('');
  }
  h += `<h2 dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${esc(c.teamTitle)}</h2>`;
  h += table(
    lang,
    c.teamHead,
    MEMBERS.map(([ar, en, gh, roleAr, roleEn, cAr, cEn]) =>
      lang === 'ar' ? [ar, roleAr, cAr, `@${gh}`] : [en, roleEn, cEn, `@${gh}`],
    ),
  );
  h += c.links.map(([k, v]) => para(lang, `<b>${esc(k)}:</b> ${/^https?:/.test(v) ? `<span dir="ltr">${esc(v)}</span>` : esc(v)}`)).join('');
  return page(lang, h, { size: 10 });
}

function analysisHtml(lang) {
  const c = analysis[lang];
  const d = lang === 'ar' ? 'rtl' : 'ltr';
  let h = `<h1 dir="${d}">${esc(c.title)}</h1>` + para(lang, esc(fill(c.sub)), 'sub');
  for (const b of c.blocks) {
    const [kind] = b;
    if (kind === 'h') h += `<h2 dir="${d}">${esc(b[1])}</h2>`;
    else if (kind === 'p') h += para(lang, rich(b[1]));
    else if (kind === 'table') h += table(lang, b[1], b[2]);
    else if (kind === 'ol') h += list(lang, b[1], true);
    else if (kind === 'ul') h += list(lang, b[1], false);
    else if (kind === 'uc') {
      const actorLabel = lang === 'ar' ? 'الفاعلون' : 'Actors';
      h += para(lang, `<b>${esc(b[1])}</b> — ${esc(actorLabel)}: ${esc(b[2])}`, 'uc') + list(lang, b[3], true);
    } else if (kind === 'img' && b[1] === 'erd.png') {
      // The ERD gets its own landscape page (Word section) so its field names stay readable when printed.
      const brk = `<br clear="all" style="page-break-before:always;mso-break-type:section-break">`;
      h += `</div>${brk}<div class="WordSection2" dir="${d}">${img(b[1], b[2], 1000)}</div>${brk}<div class="WordSection3" dir="${d}">`;
    } else if (kind === 'img') h += img(b[1], b[2], 620);
  }
  return page(lang, h, { size: 10 });
}

const docs = [
  [`${TEAM_AR}_ملخص-المشروع`, 'brief-ar', briefHtml('ar'), 1],
  [`${TEAM_EN}_ProjectBrief_EN`, 'brief-en', briefHtml('en'), 1],
  [`${TEAM_AR}_الدراسة-التحليلية-والتصميمية`, 'analysis-ar', analysisHtml('ar'), 10],
  [`${TEAM_EN}_AnalysisDesign_EN`, 'analysis-en', analysisHtml('en'), 10],
];

fs.mkdirSync(pdfDir, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'majlis-docx-'));
const ps1 = path.join(__dirname, 'html-to-docx.ps1');
let failed = false;
for (const [name, ascii, html, maxPages] of docs) {
  const htmlPath = path.join(work, `${ascii}.html`);
  fs.writeFileSync(htmlPath, '﻿' + html, 'utf8');
  const out = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-Html', htmlPath, '-Docx', path.join(work, `${ascii}.docx`), '-Pdf', path.join(work, `${ascii}.pdf`)], { encoding: 'utf8' }).trim();
  const pages = Number((/PAGES=(\d+)/.exec(out) || [])[1]);
  fs.copyFileSync(path.join(work, `${ascii}.docx`), path.join(outDir, `${name}.docx`));
  fs.copyFileSync(path.join(work, `${ascii}.pdf`), path.join(pdfDir, `${name}.pdf`));
  const ok = pages <= maxPages;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK  ' : 'OVER'} ${name}.docx — ${pages} page(s) (limit ${maxPages})`);
}
fs.rmSync(work, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
