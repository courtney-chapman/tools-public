const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(__dirname, '../../apps/offline-audit-package-organizer');
global.window = global;
global.JSZip = require(path.join(app, 'vendor/jszip.min.js'));
global.PDFLib = require(path.join(app, 'vendor/pdf-lib.min.js'));
require(path.join(app, 'core.js'));
require(path.join(app, 'zip.js'));
require(path.join(app, 'pdf.js'));

async function main() {
  const C = global.AuditCore, Z = global.AuditZip, P = global.AuditPdf;
  const template = C.demoTemplate();
  const originalName = '報告😀.txt';
  const file = {id: C.id(), originalName, originalPath: originalName, source: 'synthetic',
    bytes: new TextEncoder().encode('fictional'), folderId: template.folders[0].id,
    typeId: null, customType: '', manualName: null, order: 0};
  const state = {template, packageName: 'Fictional Audit', includePdf: true, files: [file]};
  const pdf = await P.checklist(state);
  assert.equal(String.fromCharCode(...pdf.slice(0, 5)), '%PDF-');
  const archive = await Z.makeExport(state, pdf);
  const opened = await Z.loadZip(archive, {archive: C.LIMITS.package, expanded: C.LIMITS.package,
    file: C.LIMITS.package, count: C.LIMITS.count + 120});
  assert(opened.entries.some(entry => entry.name.endsWith('/01 - Planning/' + originalName)));
  assert(opened.entries.some(entry => entry.name.endsWith('/Audit Package Index & Completeness Checklist.pdf')));
  console.log('PASS: Unicode filename retained in ZIP and checklist PDF created without fontkit');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
