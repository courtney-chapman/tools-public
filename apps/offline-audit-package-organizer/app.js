(function () {
  'use strict';
  const C = window.AuditCore, Z = window.AuditZip, P = window.AuditPdf;
  const main = document.getElementById('main'), nav = document.getElementById('steps'), notice = document.getElementById('notice');
  const dialog = document.getElementById('editor'), form = document.getElementById('editor-form');
  const steps = ['Template', 'Import', 'Organize', 'Review', 'Export'];
  let state = {template: C.demoTemplate(), packageName: 'Procurement Audit', includePdf: true, files: []};
  let undo = [], query = '', filter = 'all', page = 0, editor = null, busy = false;
  const openFolders = new Set();
  const selectedFiles = new Set();
  let bulkFolderId = null, bulkTypeId = '', bulkCustomType = '';
  let feedback = '', feedbackError = false, feedbackStep = -1, editorFocus = null;
  function resetBulkChoice() { bulkFolderId = null; bulkTypeId = ''; bulkCustomType = ''; }
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/gu, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const attr = esc;
  const clone = () => ({template: JSON.parse(JSON.stringify(state.template)), packageName: state.packageName, includePdf: state.includePdf, files: state.files.map(f => ({...f}))});
  function checkpoint() { undo.push(clone()); if (undo.length > 30) undo.shift(); }
  function alertText(message, isError = false) { feedback = message; feedbackError = isError; feedbackStep = step(); notice.textContent = message; notice.classList.toggle('error', isError); notice.hidden = false; clearTimeout(alertText.timer); alertText.timer = setTimeout(() => notice.hidden = true, 7000); }
  function feedbackMarkup() { return feedback && feedbackStep === step() ? `<div class="inline-feedback${feedbackError ? ' error' : ''}" role="${feedbackError ? 'alert' : 'status'}">${esc(feedback)}</div>` : ''; }
  function fail(error) { alertText(error && error.message ? error.message : String(error), true); }
  function step() { const key = location.hash.slice(1).toLowerCase(); return Math.max(0, steps.findIndex(x => x.toLowerCase() === key)); }
  function go(index) { location.hash = '#' + steps[index].toLowerCase(); if (step() === index) render(); main.focus(); window.scrollTo(0, 0); }
  function renderNav() { nav.innerHTML = steps.map((s, i) => `<a href="#${s.toLowerCase()}" ${i === step() ? 'aria-current="step"' : ''}><span class="step-mark">${i+1}</span>${s}</a>`).join(''); }
  function buttons(next) { return `<div class="actions"><button type="button" data-action="undo" ${undo.length ? '' : 'disabled'}>Undo last change</button>${next < steps.length ? `<button class="primary" type="button" data-action="go" data-step="${next}">Continue to ${steps[next]}</button>` : ''}</div>`; }
  function actionIcon(kind) {
    const paths = {edit: '<path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Zm9-13 3.5 3.5"/>', delete: '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v6m4-6v6"/>', restore: '<path d="M4 11a8 8 0 1 1 2.3 5.7M4 5v6h6"/>'};
    return kind === 'up' || kind === 'down' ? arrowIcon(kind === 'up' ? -1 : 1) : `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;
  }
  function actionButton(action, id, kind, label, extra = '', disabled = false) {
    return `<button type="button" class="icon-button${kind === 'delete' ? ' danger' : ''}" data-action="${action}" data-id="${attr(id)}" ${extra} aria-label="${attr(label)}" title="${attr(label)}" ${disabled ? 'disabled' : ''}>${actionIcon(kind)}</button>`;
  }
  function renderTemplate() {
    const folderRows = state.template.folders.map((folder, fi) => `
      <details class="template-folder" data-folder-id="${attr(folder.id)}" ${openFolders.has(folder.id) ? 'open' : ''}>
        <summary><strong>${C.pad(fi+1)} - ${esc(folder.name)}</strong></summary>
        <div class="template-folder-body">
          <div class="template-tools" aria-label="Actions for ${attr(folder.name)}">
            ${actionButton('edit-folder', folder.id, 'edit', `Edit folder ${folder.name}`)}
            ${actionButton('move-folder', folder.id, 'up', `Move folder ${folder.name} up`, 'data-dir="-1"', !fi)}
            ${actionButton('move-folder', folder.id, 'down', `Move folder ${folder.name} down`, 'data-dir="1"', fi === state.template.folders.length-1)}
            ${actionButton('delete-folder', folder.id, 'delete', `Delete folder ${folder.name}`)}
          </div>
          <div class="template-types">${folder.types.map((type, ti) => `
            <div class="template-type">
              <div class="template-type-name"><strong>${C.pad(ti+1)} - ${esc(type.name)}</strong><span class="template-meta">${type.required ? 'Required' : 'Optional'} · ${esc(type.stem)}</span></div>
              <div class="template-tools" aria-label="Actions for ${attr(type.name)}">
                ${actionButton('edit-type', type.id, 'edit', `Edit document type ${type.name}`, `data-folder="${attr(folder.id)}"`)}
                ${actionButton('move-type', type.id, 'up', `Move document type ${type.name} up`, `data-folder="${attr(folder.id)}" data-dir="-1"`, !ti)}
                ${actionButton('move-type', type.id, 'down', `Move document type ${type.name} down`, `data-folder="${attr(folder.id)}" data-dir="1"`, ti === folder.types.length-1)}
                ${actionButton('delete-type', type.id, 'delete', `Delete document type ${type.name}`, `data-folder="${attr(folder.id)}"`)}
              </div>
            </div>`).join('')}</div>
          <button class="small-button template-add-type" data-action="add-type" data-folder="${attr(folder.id)}">Add document type</button>
        </div>
      </details>`).join('');
    return `<h1>1. Template</h1><p>Choose the folders and expected document types. The example is fictional and can be edited.</p><section class="card template-setup"><div class="field"><label for="template-name">Template name</label><input id="template-name" value="${attr(state.template.name)}"></div><details class="template-options"><summary>Template options</summary><div class="actions"><button data-action="new-template">Start blank</button><button data-action="demo-template">Use illustrative 10-tab template</button><button data-action="load-template">Load template JSON</button><button data-action="save-template">Save template JSON</button></div></details></section><section class="card template-list"><div class="template-list-head"><h2>Folders and document types</h2><div class="template-list-actions"><button class="small-button" data-action="expand-folders">Expand all</button><button class="small-button" data-action="collapse-folders">Collapse all</button></div></div><p class="hint">Select a folder to see its document types and edit controls.</p>${folderRows || '<p>No folders yet. Add the first one below.</p>'}<button class="template-add-folder" data-action="add-folder">Add folder</button></section>${buttons(1)}`;
  }
  function renderImport() {
    return `<h1>2. Import</h1><p>Select a ZIP or individual files. The originals are never changed. Every imported file starts unassigned.</p><section class="card"><h2>Bring in files</h2>${feedbackMarkup()}<div class="grid"><div class="field"><label for="zip-input">Import a ZIP</label><input id="zip-input" type="file" accept=".zip,application/zip"><small>Up to 100 MB compressed, 250 MB expanded, and 1,000 files.</small></div><div class="field"><label for="files-input">Add individual files</label><input id="files-input" type="file" multiple></div></div><div class="field"><label for="session-input">Resume from a saved session ZIP</label><input id="session-input" type="file" accept=".zip,application/zip"><small>Loading replaces the current working session after confirmation.</small></div></section><section class="card"><div class="import-list-head"><h2>Imported files</h2><button class="small-button danger" data-action="clear-files" ${state.files.length ? '' : 'disabled'}>Clear imported files</button></div><p>${state.files.length} file${state.files.length === 1 ? '' : 's'} in this session.</p>${state.files.slice(0, 30).map(f => `<div class="file-row"><div class="import-file-line"><div class="file-name">${esc(f.originalName)}</div>${actionButton('remove-file', f.id, 'delete', `Remove ${f.originalName} from session`)}</div><div class="path">${esc(f.originalPath || 'Individual file')} · ${esc(f.source || '')} · ${Math.round(f.bytes.length/1024)} KB</div></div>`).join('')}${state.files.length > 30 ? `<p class="hint">Showing the first 30. All files appear in Organize.</p>` : ''}</section>${buttons(2)}`;
  }
  function folderOptions(selected) { return `<option value="">Unassigned</option>` + state.template.folders.map((f, i) => `<option value="${attr(f.id)}" ${selected === f.id ? 'selected' : ''}>${C.pad(i+1)} - ${esc(f.name)}</option>`).join(''); }
  function bulkFolderOptions() { return `<option value="@choose" ${bulkFolderId === null ? 'selected' : ''}>Choose folder or Unassigned</option><option value="" ${bulkFolderId === '' ? 'selected' : ''}>Unassigned</option>` + state.template.folders.map((f, i) => `<option value="${attr(f.id)}" ${bulkFolderId === f.id ? 'selected' : ''}>${C.pad(i+1)} - ${esc(f.name)}</option>`).join(''); }
  function typeOptions(folderId, selected, customSelected) { const folder = state.template.folders.find(f => f.id === folderId); if (!folder) return `<option value="">Choose a folder first</option>`; return `<option value="" ${!selected && !customSelected ? 'selected' : ''}>Choose a document type</option><option value="@custom" ${customSelected ? 'selected' : ''}>Other document (custom)</option>` + folder.types.map((t, i) => `<option value="${attr(t.id)}" ${selected === t.id ? 'selected' : ''}>${C.pad(i+1)} - ${esc(t.name)}</option>`).join(''); }
  function matchingFiles() {
    const names = C.proposedNames(state);
    return state.files.filter(f => {
      const a = C.assignment(state, f), search = [f.originalName, f.originalPath, names.get(f.id), a && a.folder.name, a && a.type && a.type.name].join(' ').toLowerCase();
      return search.includes(query.toLowerCase()) && (filter === 'all' || (filter === 'unassigned' ? !a : filter === 'needs-type' ? C.needsType(f) : a && a.folder.id === filter));
    }).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  function templateSort(a, b) {
    const x = C.assignment(state, a), y = C.assignment(state, b);
    if (x && !y) return -1;
    if (!x && y) return 1;
    if (x && y) return x.fi - y.fi || (x.ti < 0 ? 999 : x.ti) - (y.ti < 0 ? 999 : y.ti) || a.order - b.order;
    return a.order - b.order;
  }
  function arrowIcon(direction) {
    return direction < 0 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-5 5 5-5 5 5"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-5-5 5 5 5-5"/></svg>';
  }
  function renderFileRow(f, names, index, count) {
    const up = `<button class="icon-button" type="button" data-action="move-file" data-id="${attr(f.id)}" data-dir="-1" aria-label="Move ${attr(f.originalName)} up" title="Move up" ${index ? '' : 'disabled'}>${arrowIcon(-1)}</button>`;
    const down = `<button class="icon-button" type="button" data-action="move-file" data-id="${attr(f.id)}" data-dir="1" aria-label="Move ${attr(f.originalName)} down" title="Move down" ${index < count - 1 ? '' : 'disabled'}>${arrowIcon(1)}</button>`;
    const restore = f.manualName ? actionButton('restore-name', f.id, 'restore', `Restore default exported filename for ${f.originalName}`) : '';
    const customSelected = Boolean(f.customSelected || f.customType);
    return `<div class="file-table-row${C.needsType(f) ? ' needs-type' : ''}" data-file="${attr(f.id)}">
      <input type="checkbox" id="select-${attr(f.id)}" data-select-file="${attr(f.id)}" aria-label="Select ${attr(f.originalName)}" ${selectedFiles.has(f.id) ? 'checked' : ''}>
      <div class="order-controls" aria-label="File order">${up}${down}</div>
      <div class="file-original"><div class="file-original-text"><span class="file-name" title="${attr(f.originalPath || f.originalName)}">${esc(f.originalName)}</span>${C.needsType(f) ? '<span class="needs-type-label">Needs type</span>' : ''}<details class="file-details"><summary>Details</summary><small>${esc(f.originalPath || 'Individual file')} · ${esc(f.source || 'Individual file')} · ${f.bytes.length.toLocaleString()} bytes</small></details></div>${actionButton('remove-file', f.id, 'delete', `Remove ${f.originalName} from session`)}</div>
      <div class="file-cell file-exported"><span class="mobile-label">Exported name</span><div class="exported-name-control"><input id="name-${attr(f.id)}" data-field="name" data-id="${attr(f.id)}" aria-label="Exported filename for ${attr(f.originalName)}" value="${attr(names.get(f.id))}">${restore}</div></div>
      <div class="file-cell file-folder"><span class="mobile-label">Folder</span><select id="folder-${attr(f.id)}" data-field="folder" data-id="${attr(f.id)}" aria-label="Folder for ${attr(f.originalName)}">${folderOptions(f.folderId)}</select></div>
      <div class="file-cell file-type"><span class="mobile-label">Document type</span><select id="type-${attr(f.id)}" data-field="type" data-id="${attr(f.id)}" aria-label="Document type for ${attr(f.originalName)}" ${f.folderId ? '' : 'disabled'}>${typeOptions(f.folderId, f.typeId, customSelected)}</select></div>
      <div class="file-cell custom-cell">${f.folderId && customSelected ? `<span class="mobile-label">Custom type</span><input id="custom-${attr(f.id)}" data-field="custom" data-id="${attr(f.id)}" aria-label="Custom type for ${attr(f.originalName)}" value="${attr(f.customType || '')}" placeholder="Other document">` : ''}</div>
    </div>`;
  }
  function renderOrganize() {
    const names = C.proposedNames(state), visible = matchingFiles();
    const pages = Math.max(1, Math.ceil(visible.length / 100)); page = Math.min(page, pages-1);
    const files = visible.slice(page*100,(page+1)*100);
    const selected = state.files.filter(f => selectedFiles.has(f.id));
    const outsidePage = selected.length - files.filter(f => selectedFiles.has(f.id)).length;
    const selectedPreview = selected.slice(0, 5).map(f => esc(f.originalName)).join(', ');
    return `<h1>3. Organize</h1><p>Select files to assign a folder and document type together. Files stay in place until you use the arrows or Sort.</p>
      <section class="card organize-card">
        ${feedbackMarkup()}<div class="toolbar"><div><label for="search">Search files</label><input id="search" value="${attr(query)}" placeholder="Filename, folder, or type"></div><div><label for="filter">Show</label><select id="filter"><option value="all">All files</option><option value="unassigned" ${filter === 'unassigned' ? 'selected' : ''}>Unassigned</option><option value="needs-type" ${filter === 'needs-type' ? 'selected' : ''}>Needs document type</option>${state.template.folders.map(f => `<option value="${attr(f.id)}" ${filter === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div></div>
        <div class="organize-list-head"><p class="hint">${files.length ? `${files.length} shown${pages > 1 ? ` · page ${page+1} of ${pages}` : ''}` : 'No matching files'} · ${state.files.length} total</p><div class="organize-head-actions"><button class="small-button" data-action="save-session">Save session ZIP</button><button class="small-button" data-action="sort-files" ${state.files.length > 1 ? '' : 'disabled'}>Sort by folder and type</button><button class="small-button danger" data-action="clear-files" ${state.files.length ? '' : 'disabled'}>Clear imported files</button></div></div>
        <div class="bulk-panel"><div class="bulk-selection"><strong>${selected.length} selected</strong><button class="small-button" data-action="select-page" ${files.length ? '' : 'disabled'}>Select page</button><button class="small-button" data-action="select-filtered" ${visible.length ? '' : 'disabled'}>Select all ${visible.length} matching</button><button class="small-button" data-action="clear-selection" ${selected.length ? '' : 'disabled'}>Clear selection</button><button class="small-button danger" data-action="remove-selected" ${selected.length ? '' : 'disabled'}>Remove selected</button></div>${selected.length ? `<p class="selection-preview">Selected: ${selectedPreview}${selected.length > 5 ? `, and ${selected.length - 5} more` : ''}${outsidePage ? ` · ${outsidePage} not on this page` : ''}</p>` : ''}<div class="bulk-fields"><div class="field"><label for="bulk-folder">Set folder</label><select id="bulk-folder">${bulkFolderOptions()}</select></div><div class="field"><label for="bulk-type">Set document type</label><select id="bulk-type" ${bulkFolderId ? '' : 'disabled'}>${typeOptions(bulkFolderId, bulkTypeId, bulkTypeId === '@custom')}</select></div>${bulkFolderId && bulkTypeId === '@custom' ? `<div class="field"><label for="bulk-custom">Custom type</label><input id="bulk-custom" value="${attr(bulkCustomType)}" placeholder="Other document"></div>` : ''}<button class="primary" data-action="apply-bulk" ${selected.length && bulkFolderId !== null ? '' : 'disabled'}>Apply to selected</button></div></div>
        <div class="file-table-scroll"><div class="file-table"><div class="file-table-head"><span aria-hidden="true"></span><span>Order</span><span>Original name</span><span>Exported name</span><span>Folder</span><span>Document type</span><span>Custom</span></div>${files.map((f, i) => renderFileRow(f, names, page*100+i, visible.length)).join('')}</div></div>
        ${pages > 1 ? `<div class="actions"><button data-action="prev-page" ${page ? '' : 'disabled'}>Previous 100</button><button data-action="next-page" ${page < pages-1 ? '' : 'disabled'}>Next 100</button></div>` : ''}
      </section>${buttons(3)}`;
  }
  function review() { try { return C.packagePlan(state); } catch (error) { return {issues: [error.message], assigned: state.files.filter(f=>C.assignment(state,f) && !C.needsType(f)), unassigned: state.files.filter(f=>!C.assignment(state,f)), pending: state.files.filter(C.needsType), missing: [], optional: [], included: [], entries: [], names: C.proposedNames(state), template: state.template}; } }
  function renderReview() {
    const p = review(), warnings = [];
    if (p.missing.length) warnings.push(`${p.missing.length} required document type${p.missing.length === 1 ? '' : 's'} without files`);
    if (p.pending.length) warnings.push(`${p.pending.length} file${p.pending.length === 1 ? '' : 's'} ${p.pending.length === 1 ? 'needs' : 'need'} a document type (they can still be exported in their selected folders)`);
    if (p.unassigned.length) warnings.push(`${p.unassigned.length} unassigned file${p.unassigned.length === 1 ? '' : 's'} (they will be included in Unassigned Files)`);
    const checklist = p.template.folders.map((folder, fi) => {
      const rows = folder.types.map((type, ti) => {
        const found = state.files.filter(f => f.folderId === folder.id && f.typeId === type.id);
        const status = found.length ? 'Included' : type.required ? 'Missing' : 'Optional not included';
        const kind = found.length ? 'included' : type.required ? 'missing' : 'optional';
        return `<li class="checklist-item ${kind}"><span class="checklist-mark" aria-hidden="true">${found.length ? '✓' : type.required ? '' : '–'}</span><div class="checklist-content"><strong>${C.pad(ti+1)} - ${esc(type.name)}</strong><span class="hint">${type.required ? 'Required' : 'Optional'}</span>${found.map(f => `<div class="checklist-file">${esc(p.names.get(f.id))}</div>`).join('')}</div><span class="checklist-status">${status}</span></li>`;
      }).join('');
      const custom = state.files.filter(f => f.folderId === folder.id && !f.typeId && !C.needsType(f)).map(f => `<li class="checklist-item included"><span class="checklist-mark" aria-hidden="true">✓</span><div class="checklist-content"><strong>${esc(f.customType || 'Other document')}</strong><span class="hint">Custom type</span><div class="checklist-file">${esc(p.names.get(f.id))}</div></div><span class="checklist-status">Included</span></li>`).join('');
      const pendingRows = p.pending.filter(f => f.folderId === folder.id).map(f => `<li class="checklist-item pending"><span class="checklist-mark" aria-hidden="true">?</span><div class="checklist-content"><strong>${esc(f.originalName)}</strong><span class="hint">Document type not chosen</span></div><span class="checklist-status">Needs type</span></li>`).join('');
      return `<section class="review-folder"><h3>${C.pad(fi+1)} - ${esc(folder.name)}</h3><ul class="review-checklist">${rows}${custom}${pendingRows}</ul></section>`;
    }).join('');
    return `<h1>4. Review</h1><p>Check file placement before export. These checklist marks reflect organization only, not document review.</p><section class="card">${feedbackMarkup()}<div class="summary"><div class="stat"><strong>${state.files.length}</strong>Imported</div><div class="stat"><strong>${p.assigned.length}</strong>Assigned</div><div class="stat"><strong>${p.pending.length}</strong>Needs type</div><div class="stat"><strong>${p.unassigned.length}</strong>Unassigned</div><div class="stat"><strong>${p.included.filter(x => x.type.required).length}</strong>Required types included</div><div class="stat"><strong>${p.missing.length}</strong>Missing required</div><div class="stat"><strong>${p.optional.length}</strong>Optional not included</div><div class="stat"><strong>${p.issues.filter(x=>x.startsWith('Duplicate destination:')).length}</strong>Duplicate destinations</div></div>${p.issues.length ? `<div class="alert error"><strong>Export blocked</strong><ul>${p.issues.map(x => `<li>${esc(x)} ${x.startsWith('Duplicate destination:') ? `<button class="small-button" data-action="find-issue" data-name="${attr(x.split('/').pop())}">Find files</button>` : ''}</li>`).join('')}</ul></div>` : warnings.length ? `<div class="alert"><strong>Review before export</strong><ul>${warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '<div class="alert success">No organization issues found.</div>'}${p.pending.length ? `<div class="review-pending"><strong>Needs document type</strong><ul>${p.pending.slice(0, 20).map(f => `<li>${esc(f.originalName)} · ${esc(state.template.folders.find(x => x.id === f.folderId)?.name || '')}</li>`).join('')}</ul>${p.pending.length > 20 ? `<p class="hint">And ${p.pending.length - 20} more. Use the Needs document type filter in Organize.</p>` : ''}</div>` : ''}<div class="actions"><button data-action="go-needs-type" ${p.pending.length ? '' : 'disabled'}>Go to files needing type</button><button data-action="go-unassigned" ${p.unassigned.length ? '' : 'disabled'}>Go to unassigned files</button><button data-action="go" data-step="2">Edit file assignments</button></div></section><section class="card"><h2>Expected documents</h2>${checklist ? `<div class="review-folders">${checklist}</div>` : '<p>No expected document types in this template.</p>'}${p.unassigned.length ? `<details class="review-unassigned"><summary>Unassigned files (${p.unassigned.length})</summary><ul>${p.unassigned.slice(0, 30).map(f => `<li>${esc(f.originalName)}</li>`).join('')}</ul>${p.unassigned.length > 30 ? `<p class="hint">And ${p.unassigned.length - 30} more. Use the Unassigned filter in Organize.</p>` : ''}</details>` : ''}</section>${buttons(4)}`;
  }
  function renderExport() {
    const p = review(), tree = p.entries.map(e => e.path).join('\n');
    return `<h1>5. Export</h1><p>Download a new package ZIP and a separate checklist PDF. The original files and ZIP stay unchanged.</p><section class="card">${feedbackMarkup()}<div class="field"><label for="package-name">Parent folder and package name</label><input id="package-name" value="${attr(state.packageName)}"><small>The download will be named “${esc(state.packageName)}.zip”.</small></div><div class="checkline"><input id="include-pdf" type="checkbox" ${state.includePdf ? 'checked' : ''}><label for="include-pdf">Include the PDF checklist in the ZIP</label></div>${p.issues.length ? `<div class="alert error">Export blocked: ${esc(p.issues.join('; '))}</div>` : (p.missing.length || p.unassigned.length || p.pending.length) ? `<div class="alert">The package has ${p.missing.length} missing required types, ${p.pending.length} file${p.pending.length === 1 ? '' : 's'} needing a document type, and ${p.unassigned.length} unassigned files. Incomplete files stay in their selected folders. You will confirm before export.</div>` : '<div class="alert success">Ready to export.</div>'}<div class="actions"><button data-action="download-pdf" ${p.issues.length || busy ? 'disabled' : ''}>Download checklist PDF</button><button class="primary" data-action="export" ${p.issues.length || busy ? 'disabled' : ''}>Download package ZIP</button><button data-action="save-session">Save session ZIP</button></div></section><section class="card"><h2>Proposed folder tree</h2><div class="tree">${esc(tree || 'No package structure yet')}</div></section><section class="card"><h2>What this tool does</h2><p>It organizes file copies and reports assignment status. It does not inspect document meaning, verify contents, or decide compliance.</p><p>Use this tool with controlled information only when your organization has approved the software and the handling method.</p></section>${buttons(5)}`;
  }
  function render() {
    const active = document.activeElement, inMain = Boolean(active && main.contains && main.contains(active));
    const focusId = inMain ? active.id : '', focusAction = inMain && active.dataset?.action ? {action: active.dataset.action, id: active.dataset.id, folder: active.dataset.folder} : null;
    renderNav(); main.innerHTML = [renderTemplate,renderImport,renderOrganize,renderReview,renderExport][step()]();
    if (inMain) {
      let target = focusId ? document.getElementById(focusId) : null;
      if (!target && focusAction && main.querySelectorAll) target = [...main.querySelectorAll('button[data-action]')].find(b => b.dataset.action === focusAction.action && b.dataset.id === focusAction.id && b.dataset.folder === focusAction.folder);
      if (target && !target.disabled) target.focus(); else main.focus();
    }
  }
  function folder(id) { return state.template.folders.find(f => f.id === id); }
  function item(id) { return state.files.find(f => f.id === id); }
  function swap(array, index, dir) { const other = index + dir; if (other < 0 || other >= array.length) return false; [array[index],array[other]] = [array[other],array[index]]; return true; }
  function openEditor(kind, folderId, typeId) {
    const f = folder(folderId), t = f && f.types.find(x => x.id === typeId); editor = {kind, folderId, typeId}; editorFocus = editor;
    document.getElementById('editor-title').textContent = kind.includes('folder') ? (f ? 'Edit folder' : 'Add folder') : (t ? 'Edit document type' : 'Add document type');
    document.getElementById('editor-fields').innerHTML = kind.includes('folder') ? `<div class="field"><label for="edit-name">Folder name</label><input id="edit-name" required value="${attr(f ? f.name : '')}"></div>` : `<div class="field"><label for="edit-name">Document type name</label><input id="edit-name" required value="${attr(t ? t.name : '')}"></div><div class="field"><label for="edit-stem">Standard filename stem</label><input id="edit-stem" required value="${attr(t ? t.stem : '')}"></div><div class="checkline"><input id="edit-required" type="checkbox" ${t && t.required ? 'checked' : ''}><label for="edit-required">Required</label></div>`;
    document.getElementById('editor-error').textContent = ''; dialog.showModal(); document.getElementById('edit-name').focus();
  }
  function restoreEditorFocus() {
    if (!editorFocus || !main.querySelectorAll) return;
    const target = [...main.querySelectorAll('button[data-action]')].find(b => b.dataset.action === editorFocus.kind && (b.dataset.id || undefined) === editorFocus.typeId && (b.dataset.folder || undefined) === (editorFocus.kind.includes('type') ? editorFocus.folderId : undefined))
      || [...main.querySelectorAll('button[data-action]')].find(b => b.dataset.action === editorFocus.kind && b.dataset.id === editorFocus.folderId);
    if (target) target.focus(); else main.focus();
    editorFocus = null;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const name = C.validPart(document.getElementById('edit-name').value, 'Name');
      const candidate = JSON.parse(JSON.stringify(state.template));
      if (editor.kind.includes('folder')) {
        const f = candidate.folders.find(x => x.id === editor.folderId);
        if (f) f.name = name; else candidate.folders.push({id: C.id(), name, types: []});
      } else {
        const f = candidate.folders.find(x => x.id === editor.folderId), stem = C.validPart(document.getElementById('edit-stem').value, 'Filename stem');
        const t = f.types.find(x => x.id === editor.typeId);
        if (t) Object.assign(t, {name, stem, required: document.getElementById('edit-required').checked});
        else f.types.push({id: C.id(), name, stem, required: document.getElementById('edit-required').checked});
      }
      C.validateTemplate(candidate); checkpoint(); state.template = candidate; resetBulkChoice(); dialog.close(); render(); restoreEditorFocus();
    } catch (error) { document.getElementById('editor-error').textContent = error.message; }
  });
  document.getElementById('editor-cancel').onclick = () => {dialog.close(); restoreEditorFocus();};
  main.addEventListener('click', async event => {
    const b = event.target.closest('button[data-action]'); if (!b || busy) return;
    const action = b.dataset.action, f = item(b.dataset.id), folderRef = folder(b.dataset.folder || b.dataset.id);
    try {
      if (action === 'go') return go(Number(b.dataset.step));
      if (action === 'undo') { if (undo.length) state = undo.pop(); render(); return; }
      if (action === 'expand-folders') { state.template.folders.forEach(x => openFolders.add(x.id)); render(); return; }
      if (action === 'collapse-folders') { openFolders.clear(); render(); return; }
      if (action === 'add-folder' || action === 'edit-folder') return openEditor(action, b.dataset.id);
      if (action === 'add-type' || action === 'edit-type') return openEditor(action, b.dataset.folder, b.dataset.id);
      if (action === 'move-folder') { const i = state.template.folders.findIndex(x => x.id === b.dataset.id); checkpoint(); swap(state.template.folders, i, Number(b.dataset.dir)); }
      if (action === 'move-type') { const i = folderRef.types.findIndex(x => x.id === b.dataset.id); checkpoint(); swap(folderRef.types, i, Number(b.dataset.dir)); }
      if (action === 'delete-folder') { if (!confirm('Delete this folder? Its assigned files will become unassigned, but no files will be removed.')) return; checkpoint(); state.files.filter(x => x.folderId === folderRef.id).forEach(x => {x.folderId=null;x.typeId=null;x.customType='';x.customSelected=false;}); state.template.folders = state.template.folders.filter(x => x.id !== folderRef.id); resetBulkChoice(); }
      if (action === 'delete-type') { const t = folderRef.types.find(x => x.id === b.dataset.id); if (!confirm('Delete this document type? Its files will stay in the folder as custom documents.')) return; checkpoint(); state.files.filter(x => x.folderId === folderRef.id && x.typeId === t.id).forEach(x => {x.typeId=null;x.customType=t.name;x.customSelected=true;}); folderRef.types = folderRef.types.filter(x => x.id !== t.id); resetBulkChoice(); }
      if (action === 'new-template' || action === 'demo-template') { if (state.files.length && !confirm('Change templates? Existing files remain, but their assignments will be cleared.')) return; checkpoint(); state.template = action === 'new-template' ? C.blankTemplate() : C.demoTemplate(); state.files.forEach(x => {x.folderId=null;x.typeId=null;x.customType='';x.customSelected=false;}); resetBulkChoice(); }
      if (action === 'load-template') return document.getElementById('template-load').click();
      if (action === 'save-template') { C.validateTemplate(state.template); Z.saveBlob(new Blob([JSON.stringify(state.template, null, 2)], {type: 'application/json'}), 'audit-template.json'); return; }
      if (action === 'clear-files') { if (!state.files.length || !confirm(`Clear all ${state.files.length} imported files from this session? The source files will not be changed.`)) return; checkpoint(); state.files=[]; selectedFiles.clear(); page=0; alertText('Imported files cleared. Use Undo to restore them.'); }
      if (action === 'remove-file') { if (!f || !confirm(`Remove ${f.originalName} from this session? The source file will not be changed.`)) return; checkpoint(); state.files=state.files.filter(x => x.id !== f.id); selectedFiles.delete(f.id); alertText(`${f.originalName} removed. Use Undo to restore it.`); }
      if (action === 'remove-selected') { const targets=state.files.filter(x => selectedFiles.has(x.id)), count=targets.length; if (!count || !confirm(`Remove ${count} selected file${count === 1 ? '' : 's'} from this session?\n${targets.slice(0, 8).map(x => '• ' + x.originalName).join('\n')}${count > 8 ? `\n…and ${count - 8} more` : ''}\nSource files will not be changed.`)) return; checkpoint(); state.files=state.files.filter(x => !selectedFiles.has(x.id)); selectedFiles.clear(); alertText(`${count} file${count === 1 ? '' : 's'} removed. Use Undo to restore them.`); }
      if (action === 'select-page') { matchingFiles().slice(page*100,(page+1)*100).forEach(x => selectedFiles.add(x.id)); render(); return; }
      if (action === 'select-filtered') { matchingFiles().forEach(x => selectedFiles.add(x.id)); render(); return; }
      if (action === 'clear-selection') { selectedFiles.clear(); render(); return; }
      if (action === 'apply-bulk') {
        const targets=state.files.filter(x => selectedFiles.has(x.id));
        if (!targets.length) return;
        if (bulkFolderId === null) throw Error('Choose a folder or Unassigned before applying to selected files.');
        const targetFolder=bulkFolderId ? folder(bulkFolderId) : null;
        if (bulkFolderId && !targetFolder) throw Error('Choose an existing folder for the selected files.');
        if (bulkFolderId && !bulkTypeId) throw Error('Choose a document type before applying to selected files.');
        if (targetFolder && bulkTypeId !== '@custom' && !targetFolder.types.some(x => x.id === bulkTypeId)) throw Error('Choose an existing document type for the selected files.');
        const custom=bulkTypeId === '@custom' ? C.validPart(bulkCustomType || 'Other document','Custom document type') : '';
        checkpoint();
        targets.forEach(x => {x.folderId=bulkFolderId || null;x.typeId=bulkFolderId && bulkTypeId !== '@custom' ? bulkTypeId : null;x.customSelected=Boolean(bulkFolderId && bulkTypeId === '@custom');x.customType=x.customSelected ? custom : '';});
        selectedFiles.clear(); alertText(`${targets.length} file${targets.length === 1 ? '' : 's'} updated.`);
      }
      if (action === 'sort-files') { checkpoint(); state.files.slice().sort(templateSort).forEach((x, i) => {x.order = i;}); page = 0; }
      if (action === 'move-file') { const rows = matchingFiles(), i = rows.findIndex(x => x.id === f.id), j = i + Number(b.dataset.dir); if (i >= 0 && j >= 0 && j < rows.length) { checkpoint(); [f.order, rows[j].order] = [rows[j].order, f.order]; } }
      if (action === 'restore-name') { checkpoint(); f.manualName = null; }
      if (action === 'prev-page') { page--; }
      if (action === 'next-page') { page++; }
      if (action === 'go-unassigned') { filter='unassigned'; page=0; return go(2); }
      if (action === 'go-needs-type') { filter='needs-type'; page=0; return go(2); }
      if (action === 'find-issue') { query=b.dataset.name;filter='all';page=0;return go(2); }
      if (action === 'save-session') { busy=true; alertText('Preparing session ZIP…'); const blob=await Z.saveSession(state); Z.saveBlob(blob,'audit-organizer-session.zip'); busy=false; alertText('Session ZIP saved.'); return render(); }
      if (action === 'download-pdf') { busy=true; alertText('Preparing checklist PDF…'); const bytes=await P.checklist(state); Z.saveBlob(Z.asBlob(bytes,'application/pdf'),'Audit Package Index & Completeness Checklist.pdf'); busy=false; alertText('PDF checklist saved.'); return render(); }
      if (action === 'export') { const p=C.packagePlan(state); if(p.issues.length) throw Error(p.issues[0]); if ((p.missing.length || p.unassigned.length || p.pending.length) && !confirm(`Export with ${p.missing.length} missing required types, ${p.pending.length} files needing a document type, and ${p.unassigned.length} unassigned files? Incomplete files stay in their selected folders; all unassigned files will be included.`)) return; busy=true; alertText('Building and verifying package ZIP…'); const pdf=state.includePdf ? await P.checklist(state) : null; const blob=await Z.makeExport(state,pdf); Z.saveBlob(blob,state.packageName+'.zip'); busy=false; alertText('Verified package ZIP saved.'); return render(); }
      render();
    } catch (error) { busy=false; fail(error); render(); }
  });
  main.addEventListener('change', async event => {
    const el=event.target;
    try {
      if (el.id === 'template-name') { const candidate=JSON.parse(JSON.stringify(state.template)); candidate.name=el.value; C.validateTemplate(candidate); checkpoint(); state.template=candidate; }
      else if (el.id === 'package-name') { C.validPart(el.value,'Package name'); checkpoint(); state.packageName=el.value.trim(); }
      else if (el.id === 'include-pdf') { checkpoint(); state.includePdf=el.checked; }
      else if (el.id === 'filter') { filter=el.value; page=0; }
      else if (el.dataset.selectFile) { if (el.checked) selectedFiles.add(el.dataset.selectFile); else selectedFiles.delete(el.dataset.selectFile); }
      else if (el.id === 'bulk-folder') { bulkFolderId=el.value === '@choose' ? null : el.value;bulkTypeId='';bulkCustomType=''; }
      else if (el.id === 'bulk-type') { bulkTypeId=el.value;bulkCustomType=''; }
      else if (el.id === 'bulk-custom') { bulkCustomType=el.value; }
      else if (el.dataset.field) {
        const f=item(el.dataset.id); checkpoint();
        if (el.dataset.field === 'folder') { f.folderId=el.value || null; f.typeId=null; f.customType=''; f.customSelected=false; }
        if (el.dataset.field === 'type') { f.typeId=el.value && el.value !== '@custom' ? el.value : null; f.customType=''; f.customSelected=el.value === '@custom'; }
        if (el.dataset.field === 'custom') f.customType=el.value ? C.validPart(el.value,'Custom document type') : '';
        if (el.dataset.field === 'name') C.rename(f,el.value);
      }
      else if (el.id === 'zip-input' && el.files[0]) { busy=true; alertText('Checking ZIP and importing files…'); const files=await Z.importZip(el.files[0]); addFiles(files); busy=false; alertText(files.length+' files imported.'); }
      else if (el.id === 'files-input' && el.files.length) { busy=true; const total=[...el.files].reduce((n,x)=>n+x.size,0)+state.files.reduce((n,x)=>n+x.bytes.length,0); if (state.files.length+el.files.length>C.LIMITS.count || total>C.LIMITS.expanded) throw Error('The selected files exceed the session count or size limit.'); const files=[]; for (const input of el.files) { C.validPart(input.name,'Filename'); if (input.size>C.LIMITS.file) throw Error('An individual file exceeds 50 MB.'); files.push({id:C.id(),originalName:input.name,originalPath:'',source:'Individual file',bytes:new Uint8Array(await input.arrayBuffer()),folderId:null,typeId:null,customType:'',customSelected:false,manualName:null,order:state.files.length+files.length}); } addFiles(files); busy=false; alertText(files.length+' files added.'); }
      else if (el.id === 'session-input' && el.files[0]) { busy=true; alertText('Validating session ZIP…'); const loaded=await Z.loadSession(el.files[0]); busy=false; if (state.files.length && !confirm('Replace the current working session with this saved session?')) return; state=loaded; state.files.slice().sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id)).forEach((f,i)=>{f.order=i;}); undo=[]; selectedFiles.clear(); resetBulkChoice(); query='';filter='all';page=0; alertText('Session restored.'); }
      else if (el.id === 'template-load' && el.files[0]) { const data=JSON.parse(await el.files[0].text()); const template=C.validateTemplate(data); if (state.files.length && !confirm('Load this template? Existing files remain, but their assignments will be cleared.')) return; checkpoint();state.template=template;state.files.forEach(f=>{f.folderId=null;f.typeId=null;f.customType='';f.customSelected=false;}); resetBulkChoice(); alertText('Template loaded.'); }
      render();
    } catch (error) { busy=false; fail(error); render(); }
  });
  function addFiles(files) { if (state.files.length+files.length>C.LIMITS.count) throw Error('Session exceeds 1,000 files.'); if (state.files.reduce((n,f)=>n+f.bytes.length,0)+files.reduce((n,f)=>n+f.bytes.length,0)>C.LIMITS.expanded) throw Error('Session exceeds 250 MB of files.'); checkpoint(); const next = state.files.reduce((n,f)=>Math.max(n,f.order),-1)+1; files.forEach((f,i)=>{f.order=next+i;}); state.files.push(...files); }
  main.addEventListener('input', event => { if (event.target.id === 'search') { query=event.target.value; page=0; const start=event.target.selectionStart; render(); const input=document.getElementById('search'); input.focus();input.setSelectionRange(start,start); } });
  main.addEventListener('toggle', event => { if (event.target.matches('.template-folder')) { const id=event.target.dataset.folderId; if (event.target.open) openFolders.add(id); else openFolders.delete(id); } }, true);
  window.addEventListener('hashchange', () => {render(); main.focus(); if (window.scrollTo) window.scrollTo(0, 0);});
  // A hidden input is reused by the template action without opening a network resource.
  const templateInput=document.createElement('input'); templateInput.id='template-load';templateInput.type='file';templateInput.accept='.json,application/json';templateInput.hidden=true;main.after(templateInput);
  templateInput.addEventListener('change', async event => { try { const data=JSON.parse(await event.target.files[0].text());const template=C.validateTemplate(data);if(state.files.length&&!confirm('Load this template? Existing files remain, but their assignments will be cleared.'))return;checkpoint();state.template=template;state.files.forEach(f=>{f.folderId=null;f.typeId=null;f.customType='';f.customSelected=false;});resetBulkChoice();alertText('Template loaded.');render();}catch(error){fail(error);}finally{templateInput.value='';} });
  render();
})();
