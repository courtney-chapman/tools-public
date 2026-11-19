(function (root) {
  'use strict';
  const C = root.AuditCore, decoder = new TextDecoder('utf-8', {fatal: true});
  const u16 = (v, p) => v.getUint16(p, true), u32 = (v, p) => v.getUint32(p, true);
  function preflight(buffer, limits = {}) {
    const maxArchive = limits.archive || C.LIMITS.archive, maxExpanded = limits.expanded || C.LIMITS.expanded;
    if (buffer.byteLength > maxArchive) throw Error('ZIP exceeds the size limit.');
    const v = new DataView(buffer), bytes = new Uint8Array(buffer);
    let eocd = -1;
    for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) if (u32(v, p) === 0x06054b50 && p + 22 + u16(v, p + 20) === bytes.length) { eocd = p; break; }
    if (eocd < 0) throw Error('Not a supported ZIP archive.');
    if (u16(v, eocd + 4) || u16(v, eocd + 6) || u16(v, eocd + 8) !== u16(v, eocd + 10)) throw Error('Multi-volume ZIP archives are not supported.');
    const count = u16(v, eocd + 10), cdSize = u32(v, eocd + 12), cdOffset = u32(v, eocd + 16);
    if (count === 65535 || cdSize === 0xffffffff || cdOffset === 0xffffffff) throw Error('ZIP64 archives are not supported.');
    if (count > (limits.count || C.LIMITS.count) || cdOffset + cdSize > eocd) throw Error('ZIP has too many entries or an invalid directory.');
    let p = cdOffset, total = 0, files = 0; const entries = [], names = new Set();
    for (let i = 0; i < count; i++) {
      if (p + 46 > eocd || u32(v, p) !== 0x02014b50) throw Error('Malformed ZIP directory.');
      const flags = u16(v, p + 8), method = u16(v, p + 10), compressed = u32(v, p + 20), expanded = u32(v, p + 24);
      const n = u16(v, p + 28), x = u16(v, p + 30), c = u16(v, p + 32), local = u32(v, p + 42);
      if (p + 46 + n + x + c > eocd || local >= cdOffset) throw Error('Malformed ZIP entry.');
      if (flags & 1 || flags & 0x40) throw Error('Encrypted ZIP entries are not supported.');
      if (method !== 0 && method !== 8) throw Error('Unsupported ZIP compression method.');
      if (compressed === 0xffffffff || expanded === 0xffffffff || local === 0xffffffff) throw Error('ZIP64 entries are not supported.');
      let name;
      try { name = decoder.decode(bytes.subarray(p + 46, p + 46 + n)); } catch (_) { throw Error('ZIP contains a filename that is not valid UTF-8.'); }
      C.validRelative(name);
      const key = C.caseKey(name);
      if (names.has(key)) throw Error('Duplicate ZIP entry: ' + name);
      names.add(key);
      if (!name.endsWith('/')) {
        files++; total += expanded;
        if (expanded > (limits.file || C.LIMITS.file) || total > maxExpanded) throw Error('ZIP exceeds the per-file or total expanded size limit.');
        if (expanded > 1024 * 1024 && expanded / Math.max(1, compressed) > C.LIMITS.ratio) throw Error('ZIP has an excessive compression ratio.');
      }
      entries.push({name, size: expanded, directory: name.endsWith('/')});
      p += 46 + n + x + c;
    }
    if (p !== cdOffset + cdSize || files > (limits.count || C.LIMITS.count)) throw Error('Malformed ZIP directory.');
    return entries;
  }
  async function loadZip(file, limits = {}) {
    if (file.size > (limits.archive || C.LIMITS.archive)) throw Error('ZIP exceeds the size limit.');
    const buffer = await file.arrayBuffer(), entries = preflight(buffer, limits);
    const zip = await root.JSZip.loadAsync(buffer, {checkCRC32: true});
    for (const item of entries) {
      const actual = zip.file(item.name);
      if (!item.directory && (!actual || actual.unsafeOriginalName && actual.unsafeOriginalName !== item.name)) throw Error('ZIP path changed while loading: ' + item.name);
    }
    return {zip, entries};
  }
  async function importZip(file) {
    const loaded = await loadZip(file), files = [];
    for (const item of loaded.entries) {
      if (item.directory) continue;
      const bytes = await loaded.zip.file(item.name).async('uint8array');
      if (bytes.length !== item.size) throw Error('ZIP size mismatch: ' + item.name);
      files.push({id: C.id(), originalName: item.name.split('/').pop(), originalPath: item.name, source: file.name, bytes, folderId: null, typeId: null, customType: '', manualName: null, order: files.length});
    }
    return files;
  }
  function asBlob(bytes, mime) { return new Blob([bytes], {type: mime}); }
  function saveBlob(blob, filename) {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function makeExport(state, pdfBytes) {
    const plan = C.packagePlan(state);
    if (plan.issues.length) throw Error(plan.issues[0]);
    const zip = new root.JSZip();
    for (const entry of plan.entries) {
      if (entry.path.endsWith('/')) zip.folder(entry.path);
      else zip.file(entry.path, entry.file.pdf ? pdfBytes : entry.file.bytes, {binary: true, compression: 'DEFLATE'});
    }
    const blob = await zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
    const checked = await loadZip(blob, {archive: C.LIMITS.package, expanded: C.LIMITS.package, file: C.LIMITS.package, count: C.LIMITS.count + 120});
    const expected = new Map(plan.entries.filter(e => !e.path.endsWith('/')).map(e => [e.path, e.file.pdf ? pdfBytes : e.file.bytes]));
    if (checked.entries.length !== plan.entries.length) throw Error('Export verification failed: entry count changed.');
    for (const entry of checked.entries) if (!entry.directory) {
      const original = expected.get(entry.name), restored = await checked.zip.file(entry.name).async('uint8array');
      if (!original || original.length !== restored.length || original.some((b, i) => b !== restored[i])) throw Error('Export verification failed: file bytes changed.');
    }
    return blob;
  }
  async function saveSession(state) {
    C.validateState(state);
    const zip = new root.JSZip();
    const metadata = {schemaVersion: C.VERSION, kind: 'offline-audit-organizer-session', template: state.template, packageName: state.packageName, includePdf: state.includePdf, files: state.files.map(({bytes, ...f}) => ({...f, byteLength: bytes.length}))};
    zip.file('session.json', JSON.stringify(metadata, null, 2));
    for (const f of state.files) zip.file('files/' + f.id, f.bytes, {binary: true, compression: 'DEFLATE'});
    return zip.generateAsync({type: 'blob', compression: 'DEFLATE'});
  }
  async function loadSession(file) {
    const loaded = await loadZip(file, {archive: C.LIMITS.package, expanded: C.LIMITS.package, count: C.LIMITS.count + 5}), zip = loaded.zip, listed = loaded.entries.filter(e => !e.directory).map(e => e.name);
    if (!listed.includes('session.json')) throw Error('Session metadata is missing.');
    let metadata;
    try { metadata = JSON.parse(await zip.file('session.json').async('string')); } catch (_) { throw Error('Session metadata is invalid.'); }
    if (metadata.kind !== 'offline-audit-organizer-session' || metadata.schemaVersion !== C.VERSION || !Array.isArray(metadata.files)) throw Error('Unsupported session version.');
    if (listed.length !== metadata.files.length + 1) throw Error('Session has unexpected or missing files.');
    const files = [];
    for (const record of metadata.files) {
      if (!record.id || !/^[\w-]+$/u.test(record.id) || !zip.file('files/' + record.id)) throw Error('Session file is missing.');
      const bytes = await zip.file('files/' + record.id).async('uint8array');
      if (bytes.length !== record.byteLength) throw Error('Session file size changed.');
      const {byteLength, ...rest} = record;
      files.push({...rest, bytes});
    }
    const state = {template: metadata.template, packageName: metadata.packageName, includePdf: metadata.includePdf === true, files};
    C.validateState(state);
    return state;
  }
  root.AuditZip = {preflight, loadZip, importZip, asBlob, saveBlob, makeExport, saveSession, loadSession};
})(window);
