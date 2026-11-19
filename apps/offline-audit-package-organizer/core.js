/* Pure package and template rules. No document content is inspected here. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const LIMITS = Object.freeze({archive: 100 * 1024 * 1024, package: 300 * 1024 * 1024, expanded: 250 * 1024 * 1024, file: 50 * 1024 * 1024, count: 1000, ratio: 200});
  const id = () => (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const clean = value => String(value == null ? '' : value).normalize('NFC').trim();
  const caseKey = value => clean(value).toLocaleLowerCase('en-US');
  const unsafePart = value => !value || value === '.' || value === '..' || /[\u0000-\u001f\u007f<>:"/\\|?*]/u.test(value) || /[. ]$/u.test(value) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/iu.test(value) || value.length > 180;
  function validPart(value, label) { if (unsafePart(clean(value))) throw Error(label + ' contains an unsafe or invalid name.'); return clean(value); }
  function validRelative(path) {
    if (!path || path.length > 1024 || path.startsWith('/') || path.includes('\\') || /^[a-z]:/iu.test(path)) throw Error('Unsafe ZIP path: ' + path);
    const parts = path.replace(/\/$/, '').split('/');
    if (parts.some(p => unsafePart(p))) throw Error('Unsafe ZIP path: ' + path);
    return path;
  }
  function extOf(name) { const i = name.lastIndexOf('.'); return i > 0 && i < name.length - 1 ? name.slice(i) : ''; }
  function stemOf(name) { return name.slice(0, name.length - extOf(name).length); }
  const pad = n => String(n).padStart(2, '0');
  function demoTemplate() {
    const labels = [
      ['Planning', 'Request', 'Approval'], ['Acquisition approach', 'Strategy', 'Schedule'],
      ['Market research', 'Research summary', 'Sources list'], ['Solicitation', 'Request document', 'Questions log'],
      ['Evaluation', 'Evaluation notes', 'Selection memo'], ['Price', 'Quote', 'Price analysis'],
      ['Award', 'Award document', 'Notice'], ['Administration', 'Change record', 'Correspondence'],
      ['Property', 'Inventory list', 'Receipt'], ['Closeout', 'Closeout checklist', 'Final index']
    ];
    return {schemaVersion: VERSION, id: id(), name: 'Illustrative 10-tab audit template', folders: labels.map((row, i) => ({id: id(), name: row[0], types: row.slice(1).map((name, j) => ({id: id(), name, stem: name, required: j === 0}))}))};
  }
  function blankTemplate() { return {schemaVersion: VERSION, id: id(), name: 'My audit template', folders: []}; }
  function validateTemplate(value) {
    if (!value || value.schemaVersion !== VERSION || !Array.isArray(value.folders) || value.folders.length > 100) throw Error('Unsupported or invalid template.');
    const copy = JSON.parse(JSON.stringify(value));
    copy.name = validPart(copy.name, 'Template name');
    const ids = new Set(), folderNames = new Set();
    for (const f of copy.folders) {
      if (!f.id || ids.has(f.id) || !Array.isArray(f.types) || f.types.length > 100) throw Error('Invalid folder definitions.');
      ids.add(f.id); f.name = validPart(f.name, 'Folder name');
      if (folderNames.has(caseKey(f.name))) throw Error('Duplicate folder name: ' + f.name);
      folderNames.add(caseKey(f.name));
      const typeNames = new Set();
      for (const t of f.types) {
        if (!t.id || ids.has(t.id) || typeof t.required !== 'boolean') throw Error('Invalid document type.');
        ids.add(t.id); t.name = validPart(t.name, 'Document type'); t.stem = validPart(t.stem, 'Filename stem');
        if (typeNames.has(caseKey(t.name))) throw Error('Duplicate document type: ' + t.name);
        typeNames.add(caseKey(t.name));
      }
    }
    return copy;
  }
  function assignment(state, file) {
    const fi = state.template.folders.findIndex(f => f.id === file.folderId);
    if (fi < 0) return null;
    const folder = state.template.folders[fi];
    const ti = folder.types.findIndex(t => t.id === file.typeId);
    return {folder, type: ti >= 0 ? folder.types[ti] : null, fi, ti};
  }
  function needsType(file) { return Boolean(file.folderId && !file.typeId && !file.customSelected && !file.customType); }
  function proposedNames(state) {
    const groups = new Map(), names = new Map();
    for (const file of state.files) {
      const a = assignment(state, file);
      if (!a || needsType(file)) continue;
      const group = a.folder.id + '/' + (a.type ? a.type.id : '@custom:' + caseKey(file.customType || 'Other document'));
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(file);
    }
    for (const files of groups.values()) {
      files.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
      for (let i = 0; i < files.length; i++) {
        const f = files[i], a = assignment(state, f), stem = a.type ? a.type.stem : validPart(f.customType || 'Other document', 'Custom document type');
        const prefix = a.type ? pad(a.fi + 1) + '-' + pad(a.ti + 1) + ' - ' : pad(a.fi + 1) + '-Other - ';
        names.set(f.id, f.manualName || prefix + stem + (files.length > 1 ? ' ' + (i + 1) : '') + extOf(f.originalName));
      }
    }
    for (const f of state.files) if (!names.has(f.id)) names.set(f.id, f.manualName || f.originalName);
    return names;
  }
  function packagePlan(state) {
    const template = validateTemplate(state.template), parent = validPart(state.packageName, 'Package name');
    const names = proposedNames(state), entries = [], issues = [], seen = new Set();
    const base = parent + '/';
    const add = (path, file) => {
      validRelative(path);
      const key = caseKey(path);
      if (seen.has(key)) issues.push('Duplicate destination: ' + path);
      seen.add(key); entries.push({path, file});
    };
    add(base, null);
    template.folders.forEach((folder, fi) => add(base + pad(fi + 1) + ' - ' + folder.name + '/', null));
    const assigned = [], unassigned = [], pending = [];
    for (const f of state.files) {
      const a = assignment(state, f);
      const name = validPart(names.get(f.id), 'Exported filename');
      if (extOf(name).toLocaleLowerCase() !== extOf(f.originalName).toLocaleLowerCase()) issues.push('Extension changed: ' + f.originalName);
      if (a && needsType(f)) { pending.push(f); add(base + pad(a.fi + 1) + ' - ' + a.folder.name + '/' + name, f); }
      else if (a) { assigned.push(f); add(base + pad(a.fi + 1) + ' - ' + a.folder.name + '/' + name, f); }
      else unassigned.push(f);
    }
    if (unassigned.length) {
      add(base + 'Unassigned Files/', null);
      for (const f of unassigned) add(base + 'Unassigned Files/' + validPart(names.get(f.id), 'Unassigned filename'), f);
    }
    const missing = [], optional = [], included = [];
    for (const folder of template.folders) for (const type of folder.types) {
      const found = state.files.filter(f => f.folderId === folder.id && f.typeId === type.id);
      if (found.length) included.push({folder, type, files: found});
      else (type.required ? missing : optional).push({folder, type});
    }
    if (state.includePdf) add(base + 'Audit Package Index & Completeness Checklist.pdf', {pdf: true});
    return {parent, entries, names, issues, assigned, unassigned, pending, missing, optional, included, template};
  }
  function rename(file, requested) {
    const value = validPart(requested, 'Exported filename');
    if (caseKey(extOf(value)) !== caseKey(extOf(file.originalName))) throw Error('The original file extension must stay the same.');
    file.manualName = value;
  }
  function validateState(state) {
    const template = validateTemplate(state.template);
    if (!Array.isArray(state.files) || state.files.length > LIMITS.count) throw Error('Invalid session file list.');
    const ids = new Set(); let total = 0;
    for (const f of state.files) {
      if (!f.id || ids.has(f.id) || !(f.bytes instanceof Uint8Array) || f.bytes.length > LIMITS.file) throw Error('Invalid session file.');
      ids.add(f.id); total += f.bytes.length;
      validPart(f.originalName, 'Original filename');
      if (f.originalPath) validRelative(f.originalPath);
      if (f.manualName) rename({...f}, f.manualName);
      if (f.folderId && !template.folders.some(x => x.id === f.folderId)) throw Error('Session references a missing folder.');
      if (f.typeId && !template.folders.some(x => x.id === f.folderId && x.types.some(t => t.id === f.typeId))) throw Error('Session references a missing document type.');
      if (f.customSelected !== undefined && typeof f.customSelected !== 'boolean') throw Error('Invalid custom document type selection.');
      if (f.customType) validPart(f.customType, 'Custom document type');
    }
    if (total > LIMITS.expanded) throw Error('Session exceeds the size limit.');
    validPart(state.packageName, 'Package name');
    return true;
  }
  root.AuditCore = {VERSION, LIMITS, id, clean, caseKey, validPart, validRelative, extOf, stemOf, pad, demoTemplate, blankTemplate, validateTemplate, assignment, needsType, proposedNames, packagePlan, rename, validateState};
})(typeof window !== 'undefined' ? window : globalThis);
