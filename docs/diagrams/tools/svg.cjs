// Tiny SVG helpers shared by the diagram builders (no dependencies).
'use strict';

const C = {
  ink: '#1b2a22',
  muted: '#55655c',
  border: '#b7c6bd',
  green: '#1f6b48',
  greenDark: '#0f3d2a',
  greenBg: '#e7f2eb',
  blue: '#2f5d9a',
  blueBg: '#e7eef8',
  amber: '#8a5d0c',
  amberBg: '#fcf1dc',
  red: '#9b3a31',
  redBg: '#f8e6e3',
  grey: '#6b756f',
  greyBg: '#f2f4f3',
  white: '#ffffff',
  give: '#c27c0e',
};
const FONT = "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif";
const AR = /[؀-ۿ]/;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One text line. Arabic lines get direction="rtl" so mixed text orders correctly. */
function text(x, y, s, o = {}) {
  const size = o.size || 13;
  const anchor = o.anchor || 'middle';
  const dir = o.dir || (AR.test(s) && !/^[A-Za-z]/.test(s) ? 'rtl' : 'ltr');
  // In RTL, "start" is the right edge: flip the anchor so callers can think in screen terms.
  let a = anchor;
  if (dir === 'rtl' && anchor === 'start') a = 'end';
  else if (dir === 'rtl' && anchor === 'end') a = 'start';
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.weight || 400}" fill="${o.fill || C.ink}" text-anchor="${a}" direction="${dir}"${o.italic ? ' font-style="italic"' : ''}${o.family ? ` font-family="${o.family}"` : ''}>${esc(s)}</text>`;
}

/** Several lines, centred on (x, y) as a block. */
function lines(x, y, arr, o = {}) {
  const lh = o.lh || (o.size || 13) * 1.35;
  const top = y - ((arr.length - 1) * lh) / 2 + (o.size || 13) * 0.35;
  return arr
    .map((l, i) => (typeof l === 'object' ? text(x, top + i * lh, l.text, { ...o, ...l }) : text(x, top + i * lh, l, o)))
    .join('');
}

function rect(x, y, w, h, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 10}" fill="${o.fill || C.white}" stroke="${o.stroke || C.border}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}

/** A box with centred bilingual label lines. */
function box(x, y, w, h, labelLines, o = {}) {
  return rect(x, y, w, h, o) + lines(x + w / 2, y + h / 2, labelLines, o.text || {});
}

function defs() {
  const m = (id, color) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`;
  return `<defs>${m('arrow', C.muted)}${m('arrowGreen', C.green)}${m('arrowBlue', C.blue)}${m('arrowAmber', C.amber)}${m('arrowRed', C.red)}</defs>`;
}

/** Arrow along points [[x,y],...]. */
function arrow(points, o = {}) {
  const color = o.color || C.muted;
  const marker = o.marker === false ? '' : ` marker-end="url(#${o.markerId || 'arrow'})"`;
  const start = o.both ? ` marker-start="url(#${o.markerId || 'arrow'})"` : '';
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${o.sw || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${marker}${start}/>`;
}

/** A label with a white background, centred on (x, y). */
function tag(x, y, arr, o = {}) {
  const size = o.size || 11.5;
  const lh = size * 1.3;
  const w = o.w || Math.max(...arr.map((s) => String(s).length)) * size * 0.56 + 12;
  const h = arr.length * lh + 6;
  return (
    `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5" fill="${o.bg || C.white}" stroke="${o.stroke || 'none'}" opacity="0.96"/>` +
    lines(x, y, arr, { size, fill: o.fill || C.muted, lh })
  );
}

function svg(w, h, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">
<title>${esc(title)}</title>
${defs()}
<rect width="${w}" height="${h}" fill="${C.white}"/>
${body}
</svg>
`;
}

module.exports = { C, FONT, text, lines, rect, box, arrow, tag, svg, esc };
