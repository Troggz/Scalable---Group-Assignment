// Minimal markdown -> print-ready HTML for the report. No dependencies:
// the report uses a known, small subset of markdown (headings, tables, fenced
// code, blockquotes, bold/italic/code spans, hr, paragraphs).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const src = readFileSync(process.argv[2], 'utf8');
const out = process.argv[3];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  return s;
}

const lines = src.split(/\r?\n/);
let html = '', i = 0, para = [];

function flushPara() {
  if (para.length) { html += `<p>${inline(para.join(' '))}</p>\n`; para = []; }
}

while (i < lines.length) {
  const line = lines[i];

  if (/^```/.test(line)) {
    flushPara();
    i++;
    const buf = [];
    while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
    i++;
    html += `<pre>${esc(buf.join('\n'))}</pre>\n`;
    continue;
  }

  if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

  if (/^#{1,6} /.test(line)) {
    flushPara();
    const level = line.match(/^#+/)[0].length;
    html += `<h${level}>${inline(line.replace(/^#+ /, ''))}</h${level}>\n`;
    i++;
    continue;
  }

  if (/^---+\s*$/.test(line)) { flushPara(); html += '<hr>\n'; i++; continue; }

  // A line that is only an image becomes a figure, with the alt text as caption.
  const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
  if (img) {
    flushPara();
    // Inline the image so the PDF does not depend on where the HTML sits.
    const file = resolve(dirname(process.argv[2]), img[2]);
    const src = 'data:image/png;base64,' + readFileSync(file).toString('base64');
    html += `<figure><img src="${src}" alt="${esc(img[1])}">` +
      (img[1] ? `<figcaption>${inline(img[1])}</figcaption>` : '') + '</figure>\n';
    i++;
    continue;
  }

  if (/^> /.test(line)) {
    flushPara();
    const buf = [];
    while (i < lines.length && /^> ?/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, ''));
    html += `<blockquote>${inline(buf.join(' '))}</blockquote>\n`;
    continue;
  }

  // table: a header row followed by a |---| separator
  if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
    flushPara();
    const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const head = cells(line);
    i += 2;
    const body = [];
    while (i < lines.length && /^\|/.test(lines[i])) body.push(cells(lines[i++]));
    html += '<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') +
      '</tr></thead><tbody>' +
      body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>\n';
    continue;
  }

  para.push(line.trim());
  i++;
}
flushPara();

const css = `
@page { size: A4; margin: 14mm 14mm 12mm 14mm; }
* { box-sizing: border-box; }
body {
  font-family: "Charter", "Georgia", "Times New Roman", serif;
  font-size: 9.9pt; line-height: 1.35; color: #000; margin: 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 16pt; margin: 15pt 0 5pt; padding-bottom: 2pt; border-bottom: 1.2px solid #000;
     page-break-after: avoid; break-after: avoid; }
h1:first-child { margin-top: 0; border-bottom: none; font-size: 20pt; }
h2 { font-size: 12pt; margin: 10pt 0 3pt; page-break-after: avoid; break-after: avoid; }
h3 { font-size: 10.6pt; margin: 8pt 0 3pt; page-break-after: avoid; break-after: avoid; }
p { margin: 0 0 5pt; text-align: justify; hyphens: auto; }
hr { border: none; border-top: 0.6px solid #bbb; margin: 9pt 0; }
table { border-collapse: collapse; width: 100%; margin: 5pt 0 8pt; font-size: 8.8pt;
        page-break-inside: avoid; break-inside: avoid; }
th, td { border: 0.5px solid #999; padding: 2.6pt 4pt; text-align: left; vertical-align: top; }
th { background: #eee; font-weight: bold; }
pre { background: #f5f5f5; border: 0.5px solid #ccc; border-left: 2px solid #888;
      padding: 4.5pt 6pt; margin: 5pt 0 7pt; font-family: "Consolas", "Menlo", monospace;
      font-size: 8.3pt; line-height: 1.3; white-space: pre-wrap; overflow-wrap: break-word;
      page-break-inside: avoid; break-inside: avoid; }
code { font-family: "Consolas", "Menlo", monospace; font-size: 0.87em; }
blockquote { margin: 5pt 0 6pt; padding: 3pt 0 3pt 8pt; border-left: 2px solid #888;
             font-style: italic; page-break-inside: avoid; break-inside: avoid; }
blockquote p { margin: 0; }
strong { font-weight: 700; }
figure { margin: 6pt 0 8pt; text-align: center; page-break-inside: avoid; break-inside: avoid; }
figure img { max-width: 100%; height: auto; border: 0.5px solid #999; }
figcaption { font-size: 8.2pt; color: #333; margin-top: 3pt; font-style: italic; }
`;

writeFileSync(out,
  `<!doctype html><html><head><meta charset="utf-8"><title>OpenComm report</title>` +
  `<style>${css}</style></head><body>\n${html}</body></html>`);
console.log('wrote', out);
