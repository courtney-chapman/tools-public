'use strict';
(() => {
  const STATUSES = ['Available', 'Requested', 'Pending', 'Not Available', 'Not Applicable', 'Not Reviewed'];
  const OUTSTANDING = new Set(['Requested', 'Pending', 'Not Available', 'Not Reviewed']);
  const META_LIMITS = { reference: 120, date: 10, organization: 120, period: 120, cageCodes: 1000, contractNumbers: 2000, preparer: 120, notes: 2000 };
  const DOC_LIMITS = { title: 200, reference: 160, revision: 100, owner: 120, location: 300, contents: 500, count: 40, notes: 1000, versionNote: 160, requestedOn: 10, receivedOn: 10 };
  const SAMPLE_LIMITS = { populationRequested: 300, populationPeriod: 120, populationSize: 100, populationSuppliedBy: 120, selectionMethod: 300, selectionCommunicatedOn: 10, sampleSize: 100, samplePerformedBy: 120, samplePerformedDate: 100, sampleHow: 1000, sampleLimitations: 500 };
  const LEGACY_SAMPLE_KEYS = ['samplePopulation', 'sampleMethod', 'sampleSize', 'samplePerformedBy', 'samplePerformedDate', 'sampleHow', 'sampleLimitations'];
  const DOC_TYPES = ['Document', 'Record set / ZIP', 'Backup / archive', 'Other'];
  const PROVIDED_BY = ['', 'Auditee', 'Auditor', 'Other'];
  const VERSION_STATUSES = ['', 'New', 'Revised version', 'Replacement', 'Superseded'];
  const GATHER_HEADER = ['Row Type', 'Element Number', 'Prompt ID', 'Status', 'Prompt Notes', 'Population Requested', 'Population Period', 'Population Size', 'Population Supplied By', 'Selection Method', 'Method Communicated On', 'Sample Size', 'Sample Performed By', 'Sample Performed When', 'How Sampling Was Performed', 'Sampling Limitations'];
  const GATHER_SAMPLE_KEYS = Object.keys(SAMPLE_LIMITS);
  const catalogById = new Map(CATALOG.map(item => [item.id, item]));
  const names = [...new Map(CATALOG.map(item => [item.element, item.name])).entries()];
  const elementGroups = [
    { title: 'Acquire & Receive', numbers: [3, 4, 5] },
    { title: 'Identify & Record', numbers: [6, 7, 8, 16] },
    { title: 'Use & Manage', numbers: [14, 17, 18, 19, 20] },
    { title: 'Reports & Review', numbers: [9, 10, 12, 13, 15] },
    { title: 'Disposition & Closeout', numbers: [21, 22] },
    { title: 'Governance & Oversight', numbers: [1, 2, 11] }
  ];
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const scopeLines = value => String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const scopeList = value => { const lines = scopeLines(value); return lines.length ? `<ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : '<p>Not entered.</p>'; };
  const blankSampling = () => ({ ...Object.fromEntries(Object.keys(SAMPLE_LIMITS).map(key => [key, ''])), legacyReferences: [] });
  const blank = (selectAll = true) => ({
    meta: { reference: '', date: '', organization: '', period: '', cageCodes: '', contractNumbers: '', preparer: '', notes: '' },
    elements: Object.fromEntries(names.map(([n]) => [n, { selected: selectAll, na: false, note: '', sampling: blankSampling() }])),
    prompts: {}, documents: [], unassignedLegacySampling: []
  });
  let state = blank();
  let nextDocumentId = 1;
  let elementGroupsRendered = false;
  let gatherRendered = false;
  let editingElementIds = [];
  let documentView = 'document';

  function promptState(id) {
    if (!state.prompts[id]) state.prompts[id] = { status: 'Not Reviewed', note: '' };
    return state.prompts[id];
  }
  function effectiveStatus(item) { return state.elements[item.element].na ? 'Not Applicable' : promptState(item.id).status; }
  function selectedItems(includeNA = true) { return CATALOG.filter(item => state.elements[item.element].selected && (includeNA || !state.elements[item.element].na)); }
  function labelFor(item) { return `${item.element}. ${item.name} — ${item.category}`; }
  function legacySampleDescription(entry) { return [['Population', entry.samplePopulation], ['Method', entry.sampleMethod], ['Sample size', entry.sampleSize], ['Performed by', entry.samplePerformedBy], ['When', entry.samplePerformedDate], ['How', entry.sampleHow], ['Limitations', entry.sampleLimitations]].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join(' · '); }
  function hasWorkingEntries() { return Object.values(state.meta).some(Boolean) || state.documents.length > 0 || Object.values(state.prompts).some(p => p.status !== 'Not Reviewed' || p.note) || Object.values(state.elements).some(e => !e.selected || e.na || e.note || Object.keys(SAMPLE_LIMITS).some(key => e.sampling[key]) || e.sampling.legacyReferences.length); }
  function sourceLabel(value) { return value.replaceAll('[F]', 'FAR 52.245-1').replaceAll('[D5]', 'DFARS 252.245-7005').replaceAll('[J]', 'DCMA Job Aid Rev. 4'); }
  function badgeClass(value) { return value === 'Conditional requirement' ? 'conditional' : value === 'DCMA assessment guidance' ? 'guidance' : value === 'Optional preparation practice' ? 'optional' : ''; }
  function announce(message, isError = false) { const el = $('#import-message'); el.textContent = message; el.classList.toggle('error', isError); }
  function csvMessage(selector, message, isError = false) { const el = $(selector); el.textContent = message; el.classList.toggle('error', isError); }

  function showStep() {
    const match = /^#step-([1-5])$/.exec(location.hash);
    const step = match ? Number(match[1]) : 1;
    document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.panel) !== step; });
    document.querySelectorAll('.page-nav a').forEach(link => {
      if (Number(link.dataset.step) === step) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    if (step === 2) renderPrompts();
    if (step === 3) renderDocuments();
    if (step === 4) renderReview();
    if (step === 5) announce('');
  }
  function renderMeta() { document.querySelectorAll('[data-meta]').forEach(input => { input.value = state.meta[input.dataset.meta]; }); }
  function renderElements() {
    const existing = document.querySelectorAll('#element-list details[open]');
    const openGroups = elementGroupsRendered ? new Set([...existing].map(group => Number(group.dataset.group))) : new Set([0]);
    const selected = names.filter(([n]) => state.elements[n].selected).length;
    const outside = names.filter(([n]) => state.elements[n].selected && state.elements[n].na).length;
    $('#selection-summary').textContent = `${selected} of 22 selected${outside ? ` · ${outside} outside scope` : ''}`;
    $('#element-list').innerHTML = elementGroups.map((group, index) => {
      const groupNames = names.filter(([n]) => group.numbers.includes(n));
      const groupSelected = groupNames.filter(([n]) => state.elements[n].selected).length;
      const rows = groupNames.map(([n, name]) => {
        const e = state.elements[n];
        return `<div class="element-row${e.selected ? ' is-selected' : ''}"><label class="element-main"><input type="checkbox" data-element-select="${n}" ${e.selected ? 'checked' : ''}><span>${n}. ${escapeHtml(name)}</span></label>${e.selected ? `<label class="element-scope">Preparation choice<select data-element-scope="${n}" aria-label="Preparation choice for element ${n}: ${escapeHtml(name)}"><option value="active" ${!e.na ? 'selected' : ''}>Gather evidence</option><option value="na" ${e.na ? 'selected' : ''}>Outside scope</option></select></label>` : ''}${e.selected && e.na ? `<label class="element-reason">Reason (optional)<input data-element-note="${n}" maxlength="500" value="${escapeHtml(e.note)}" placeholder="Why is this outside scope?"></label>` : ''}</div>`;
      }).join('');
      return `<details class="element-group" data-group="${index}" ${openGroups.has(index) ? 'open' : ''}><summary><span class="group-caret" aria-hidden="true"></span><span class="group-title">${escapeHtml(group.title)} <small>Elements ${group.numbers.join(', ')}</small></span><span class="group-count">${groupSelected} of ${groupNames.length} selected</span></summary><div class="group-body"><div class="group-actions"><button type="button" class="quiet" data-select-group="${index}">Select group</button><button type="button" class="quiet" data-clear-group="${index}">Clear group</button></div><div class="group-rows">${rows}</div></div></details>`;
    }).join('');
    elementGroupsRendered = true;
  }
  function renderPrompts() {
    const firstActive = elementGroups.flatMap(group => group.numbers).find(n => state.elements[n].selected && !state.elements[n].na);
    const firstGroup = elementGroups.findIndex(group => group.numbers.includes(firstActive));
    const openGroups = gatherRendered ? new Set([...document.querySelectorAll('#prompts details[data-gather-group][open]')].map(x => Number(x.dataset.gatherGroup))) : new Set(firstGroup >= 0 ? [firstGroup] : []);
    const openElements = gatherRendered ? new Set([...document.querySelectorAll('#prompts details[data-gather-element][open]')].map(x => Number(x.dataset.gatherElement))) : new Set(firstActive ? [firstActive] : []);
    const active = names.filter(([n]) => state.elements[n].selected && !state.elements[n].na).length;
    $('#gather-count').textContent = `${selectedItems(false).length} prompts across ${active} active element${active === 1 ? '' : 's'}. Open a group to work in any order.`;
    const promptCard = item => {
      const p = promptState(item.id);
      return `<article class="prompt-card"><div class="prompt-head"><h4>${escapeHtml(item.category)}</h4><span class="badge ${badgeClass(item.classification)}">${escapeHtml(item.classification)}</span></div><p class="prompt-description">${escapeHtml(item.prompt)}</p><div class="prompt-fields"><label>Status<select data-prompt-status="${item.id}">${STATUSES.map(status => `<option ${p.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Notes / applicability explanation<textarea rows="2" maxlength="1000" data-prompt-note="${item.id}">${escapeHtml(p.note)}</textarea></label></div><details class="prompt-extra"><summary>Source and applicability</summary><p class="prompt-source"><strong>Source:</strong> ${escapeHtml(sourceLabel(item.source))}. <a href="sources.html" target="_blank" rel="noopener noreferrer">Source details (new tab)</a><br><strong>When relevant:</strong> ${escapeHtml(item.applicability)}</p></details></article>`;
    };
    const samplingButton = n => {
      const sampling = state.elements[n].sampling;
      const recorded = Object.keys(SAMPLE_LIMITS).some(key => sampling[key]) || sampling.legacyReferences.length;
      return `<div class="sampling-launch"><button type="button" class="secondary" data-open-sampling="${n}">Population and sampling notes${recorded ? ' · recorded' : ' (optional)'}</button></div>`;
    };
    $('#prompts').innerHTML = active ? elementGroups.map((group, index) => {
      const activeNumbers = group.numbers.filter(n => state.elements[n].selected && !state.elements[n].na);
      const sections = activeNumbers.map(n => {
        const name = names.find(([number]) => number === n)[1];
        const items = CATALOG.filter(item => item.element === n);
        const reviewed = items.filter(item => promptState(item.id).status !== 'Not Reviewed').length;
        return `<details class="gather-element" data-gather-element="${n}" ${openElements.has(n) ? 'open' : ''}><summary><span>${n}. ${escapeHtml(name)}</span><small>${reviewed} of ${items.length} reviewed</small></summary><div class="gather-element-body">${items.map(promptCard).join('')}${samplingButton(n)}</div></details>`;
      }).join('');
      return `<details class="gather-group" data-gather-group="${index}" ${openGroups.has(index) ? 'open' : ''}><summary><span>${escapeHtml(group.title)}</span><small>${activeNumbers.length} active element${activeNumbers.length === 1 ? '' : 's'}</small></summary><div class="gather-group-body">${sections || '<p class="empty">No active elements in this group. Change the selection in Set Up to include one.</p>'}</div></details>`;
    }).join('') : '<p class="empty">No active elements. Choose at least one element in Set Up.</p>';
    gatherRendered = true;
  }
  function renderDocuments() {
    const search = $('#document-search').value.trim().toLowerCase();
    const sort = $('#document-sort').value;
    const visible = state.documents.filter(doc => !search || `${doc.title} ${doc.type} ${doc.reference} ${doc.owner} ${doc.contents} ${doc.location} ${doc.elementIds.join(' ')} ${doc.providedBy} ${doc.versionStatus} ${doc.versionNote} ${doc.requestedOn} ${doc.receivedOn}`.toLowerCase().includes(search));
    const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id);
    const compare = (a, b) => {
      if (sort === 'title') return byTitle(a, b);
      const key = sort.startsWith('requested') ? 'requestedOn' : 'receivedOn';
      if (!a[key] && !b[key]) return byTitle(a, b);
      if (!a[key]) return 1;
      if (!b[key]) return -1;
      const order = sort.endsWith('oldest') ? 1 : -1;
      return order * a[key].localeCompare(b[key]) || byTitle(a, b);
    };
    visible.sort(compare);
    const waiting = visible.filter(doc => doc.requestedOn && !doc.receivedOn).length;
    $('#document-count').textContent = `${visible.length} of ${state.documents.length} references shown${waiting ? ` · ${waiting} requested, not received` : ''}`;
    for (const tab of document.querySelectorAll('[data-document-view]')) {
      const active = tab.dataset.documentView === documentView;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    $('#document-list').setAttribute('aria-labelledby', `view-${documentView}`);
    const iconActions = doc => `<div class="table-actions"><button type="button" class="quiet icon-action" data-edit-doc="${escapeHtml(doc.id)}" aria-label="Edit ${escapeHtml(doc.title)}" title="Edit ${escapeHtml(doc.title)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h4l11-11-4-4L4 16v4Zm10-14 4 4M4 20h16"/></svg></button><button type="button" class="quiet icon-action" data-delete-doc="${escapeHtml(doc.id)}" aria-label="Remove ${escapeHtml(doc.title)}" title="Remove ${escapeHtml(doc.title)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v6m4-6v6"/></svg></button></div>`;
    const pendingBadge = doc => doc.requestedOn && !doc.receivedOn ? '<span class="receipt-flag">Requested · not received</span>' : '';
    const row = doc => `<tr><th scope="row">${escapeHtml(doc.title)}<small>${escapeHtml([doc.reference, doc.revision].filter(Boolean).join(' · '))}</small><small>${escapeHtml([doc.owner, doc.location].filter(Boolean).join(' · '))}</small></th><td>${escapeHtml(doc.type)}${doc.contents ? `<small>${escapeHtml(doc.contents)}</small>` : ''}${doc.count ? `<small>Approx. items: ${escapeHtml(doc.count)}</small>` : ''}</td><td>${doc.elementIds.length ? escapeHtml(doc.elementIds.join(', ')) : '<em>Unassigned</em>'}</td><td>${escapeHtml(doc.providedBy || 'Not recorded')}</td><td>${escapeHtml(doc.versionStatus || 'Not recorded')}${doc.versionNote ? `<small>${escapeHtml(doc.versionNote)}</small>` : ''}</td><td>${escapeHtml(doc.requestedOn || '—')}</td><td>${escapeHtml(doc.receivedOn || '—')}${pendingBadge(doc)}</td><td>${iconActions(doc)}</td></tr>`;
    const card = doc => `<article class="document-card"><div class="document-card-head"><h4>${escapeHtml(doc.title)}</h4><span>${escapeHtml(doc.type)}</span></div><p class="document-card-id">${escapeHtml([doc.reference, doc.revision].filter(Boolean).join(' · ') || 'No identifier entered')}</p>${pendingBadge(doc)}<p><strong>Elements:</strong> ${doc.elementIds.length ? escapeHtml(doc.elementIds.join(', ')) : 'Unassigned'} <span class="document-card-divider">·</span> <strong>Provided by:</strong> ${escapeHtml(doc.providedBy || 'Not recorded')}</p><p><strong>Version:</strong> ${escapeHtml(doc.versionStatus || 'Not recorded')}</p><p><strong>Requested:</strong> ${escapeHtml(doc.requestedOn || '—')} <span class="document-card-divider">·</span> <strong>Received:</strong> ${escapeHtml(doc.receivedOn || '—')}</p><details><summary>More details</summary><dl><div><dt>Related version</dt><dd>${escapeHtml(doc.versionNote || '—')}</dd></div><div><dt>Owner</dt><dd>${escapeHtml(doc.owner || '—')}</dd></div><div><dt>Location</dt><dd>${escapeHtml(doc.location || '—')}</dd></div><div><dt>Contents</dt><dd>${escapeHtml(doc.contents || '—')}</dd></div><div><dt>Approximate count</dt><dd>${escapeHtml(doc.count || '—')}</dd></div><div><dt>Notes</dt><dd>${escapeHtml(doc.notes || '—')}</dd></div></dl></details>${iconActions(doc)}</article>`;
    const renderList = docs => `<div class="document-table-view table-scroll"><table class="document-table"><caption class="sr-only">Evidence references</caption><thead><tr><th scope="col">Reference / owner</th><th scope="col">Type and contents</th><th scope="col">Linked elements</th><th scope="col">Provided by</th><th scope="col">Version</th><th scope="col">Requested</th><th scope="col">Received</th><th scope="col">Actions</th></tr></thead><tbody>${docs.map(row).join('')}</tbody></table></div><div class="document-card-view">${docs.map(card).join('')}</div>`;
    if (!visible.length) { $('#document-list').innerHTML = `<p class="empty">${state.documents.length ? 'No references match this search.' : 'No evidence references yet. Use Add reference to start a table.'}</p>`; return; }
    if (documentView === 'document') { $('#document-list').innerHTML = renderList(visible); return; }
    const groups = documentView === 'element'
      ? [...names.map(([n, name]) => ({ label: `${n}. ${name}`, docs: visible.filter(doc => doc.elementIds.includes(n)) })), { label: 'Unassigned', docs: visible.filter(doc => !doc.elementIds.length) }]
      : ['Auditee', 'Auditor', 'Other', 'Not recorded'].map(provider => ({ label: provider, docs: visible.filter(doc => (doc.providedBy || 'Not recorded') === provider) }));
    $('#document-list').innerHTML = `${documentView === 'element' ? '<p class="helper">A reference linked to multiple elements appears in each relevant group.</p>' : ''}${groups.filter(group => group.docs.length).map(group => `<section class="document-group"><h4>${escapeHtml(group.label)} <span>${group.docs.length}</span></h4>${renderList(group.docs)}</section>`).join('')}`;
  }
  function renderDocElements() {
    $('#doc-element-tags').innerHTML = editingElementIds.length ? editingElementIds.map(n => `<span class="doc-element-tag">${n}. ${escapeHtml(names.find(([id]) => id === n)[1])} <button type="button" class="quiet" data-remove-doc-element="${n}" aria-label="Remove element ${n}">×</button></span>`).join('') : '<span class="helper">No elements linked yet.</span>';
  }
  function clearDocForm() { if ($('#document-editor').open) $('#document-editor').close(); $('#document-form').reset(); $('#document-id').value = ''; $('#doc-type').value = 'Document'; $('#doc-providedBy').value = ''; $('#doc-versionStatus').value = ''; editingElementIds = []; renderDocElements(); $('#save-document').textContent = 'Add reference'; $('#document-editor-title').textContent = 'Add evidence reference'; }
  function renderReview() {
    const all = selectedItems();
    const active = selectedItems(false);
    const statuses = Object.fromEntries(STATUSES.map(s => [s, 0]));
    active.forEach(item => statuses[effectiveStatus(item)]++);
    const naElements = names.filter(([n]) => state.elements[n].selected && state.elements[n].na);
    const values = [
      [names.filter(([n]) => state.elements[n].selected).length, 'Selected elements'],
      [active.length - statuses['Not Reviewed'], 'Prompts reviewed'],
      [statuses['Not Reviewed'], 'Not reviewed'],
      [statuses.Available, 'Available'],
      [statuses.Requested + statuses.Pending, 'Requested or pending'],
      [statuses['Not Available'], 'Not available'],
      [statuses['Not Applicable'] + all.filter(item => state.elements[item.element].na).length, 'Not applicable prompts'],
      [state.documents.length, 'Document references']
    ];
    const primary = [values[0], values[1], [statuses.Requested + statuses.Pending + statuses['Not Available'], 'Needs follow-up'], values[2]];
    $('#counts').innerHTML = primary.map(([count, label]) => `<div class="count"><strong>${count}</strong><span>${label}</span></div>`).join('');
    $('#review-secondary').textContent = `${statuses.Available} available · ${values[6][0]} not applicable · ${state.documents.length} document references`;
    const cageCount = scopeLines(state.meta.cageCodes).length;
    const contractCount = scopeLines(state.meta.contractNumbers).length;
    $('#review-scope').innerHTML = `<details class="review-scope"><summary><strong>Scope under review</strong><span>${cageCount} CAGE code${cageCount === 1 ? '' : 's'} · ${contractCount} contract number${contractCount === 1 ? '' : 's'}</span></summary><div class="review-scope-lists"><div><h4>CAGE codes</h4>${scopeList(state.meta.cageCodes)}</div><div><h4>Contract numbers</h4>${scopeList(state.meta.contractNumbers)}</div></div></details>`;
    const barStatuses = [['Available', 'available'], ['Requested', 'requested'], ['Pending', 'pending'], ['Not Available', 'unavailable'], ['Not Applicable', 'na'], ['Not Reviewed', 'unreviewed']];
    $('#group-status-bars').innerHTML = elementGroups.map(group => {
      const items = active.filter(item => group.numbers.includes(item.element));
      const counts = Object.fromEntries(barStatuses.map(([status]) => [status, items.filter(item => effectiveStatus(item) === status).length]));
      const reviewed = items.length - counts['Not Reviewed'];
      const description = items.length ? barStatuses.filter(([status]) => counts[status]).map(([status]) => `${counts[status]} ${status.toLowerCase()}`).join(', ') : 'No active prompts';
      const segments = items.length ? barStatuses.filter(([status]) => counts[status]).map(([status, key]) => `<span class="status-segment status-${key}" style="width:${(counts[status] / items.length * 100).toFixed(2)}%"></span>`).join('') : '';
      return `<div class="group-status-row"><strong>${escapeHtml(group.title)}</strong><div class="status-bar" role="img" aria-label="${escapeHtml(`${group.title}: ${description}`)}">${segments}</div><span>${items.length ? `${reviewed} of ${items.length} with status` : 'No active prompts'}</span>${items.length ? `<small class="group-status-mix">${escapeHtml(description)}</small>` : ''}</div>`;
    }).join('');
    const outstanding = active.filter(item => OUTSTANDING.has(effectiveStatus(item)));
    const followup = outstanding.filter(item => effectiveStatus(item) !== 'Not Reviewed');
    const notReviewed = outstanding.filter(item => effectiveStatus(item) === 'Not Reviewed');
    const groupedReview = (items, showStatus) => elementGroups.map(group => {
      const inGroup = items.filter(item => group.numbers.includes(item.element));
      if (!inGroup.length) return '';
      return `<details class="review-group"><summary><strong>${escapeHtml(group.title)}</strong><span>${inGroup.length} item${inGroup.length === 1 ? '' : 's'}</span></summary><ul class="review-list">${inGroup.map(item => `<li><span class="review-item-element">${item.element}. ${escapeHtml(item.name)}</span><strong>${escapeHtml(item.category)}</strong>${showStatus ? `<span class="review-status">${escapeHtml(effectiveStatus(item))}</span>` : ''}${promptState(item.id).note ? `<small>${escapeHtml(promptState(item.id).note)}</small>` : ''}</li>`).join('')}</ul></details>`;
    }).join('');
    $('#outstanding').innerHTML = followup.length ? `<p class="review-total">${followup.length} item${followup.length === 1 ? '' : 's'} need follow-up.</p><div class="review-groups">${groupedReview(followup, true)}</div>` : '<p class="empty">No requested, pending, or unavailable prompts in the selected active elements.</p>';
    $('#not-reviewed').innerHTML = notReviewed.length ? `<details class="review-section"><summary><span>Not reviewed yet</span><strong>${notReviewed.length} prompt${notReviewed.length === 1 ? '' : 's'}</strong></summary><p class="helper">These have not been reviewed. Open a group to see the prompts.</p><div class="review-groups">${groupedReview(notReviewed, false)}</div></details>` : '<p class="review-complete">All selected active prompts have a recorded status.</p>';
    const naPrompts = active.filter(item => effectiveStatus(item) === 'Not Applicable');
    const naCount = naElements.length + naPrompts.length;
    $('#na-list').innerHTML = naCount ? `<details class="review-section"><summary><span>Not applicable notes</span><strong>${naCount} item${naCount === 1 ? '' : 's'}</strong></summary><ul class="review-list">${naElements.map(([n, name]) => `<li><strong>${n}. ${escapeHtml(name)} — entire element</strong><small>${escapeHtml(state.elements[n].note || 'No explanation entered')}</small></li>`).join('')}${naPrompts.map(item => `<li><strong>${escapeHtml(labelFor(item))}</strong><small>${escapeHtml(promptState(item.id).note || 'No explanation entered')}</small></li>`).join('')}</ul></details>` : '';
    $('#legacy-unassigned').innerHTML = state.unassignedLegacySampling.length ? `<h3>Sampling notes to assign to an element</h3><p class="helper">These notes came from an older session's unassigned document references. Open an element in Gather and copy them there when appropriate.</p><ul class="review-list">${state.unassignedLegacySampling.map(entry => `<li><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(legacySampleDescription(entry))}</small></li>`).join('')}</ul>` : '';
    return { all, active, outstanding, followup, notReviewed, naElements, naPrompts, statuses, values };
  }
  function cell(value) {
    let text = String(value ?? '');
    if (/^\s*[=+\-@]/u.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }
  function csv(rows) { return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n'; }
  function parseCsv(text) {
    if (typeof text !== 'string' || text.length > 12 * 1024 * 1024) throw new Error('CSV exceeds the 12 MB limit.');
    const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const rows = []; let row = []; let value = ''; let quoted = false; let closed = false;
    const finish = () => { row.push(value); if (row.length > 1 || row[0].trim()) rows.push(row); row = []; value = ''; closed = false; };
    for (const ch of source) {
      if (quoted) { if (ch === '"') quoted = false, closed = true; else value += ch; continue; }
      if (closed) { if (ch === '"') { value += '"'; quoted = true; closed = false; } else if (ch === ',') { row.push(value); value = ''; closed = false; } else if (ch === '\n') finish(); else if (!/^[ \t]$/.test(ch)) throw new Error('Malformed CSV after a quoted value.'); continue; }
      if (ch === '"') { if (value) throw new Error('Malformed CSV quote.'); quoted = true; }
      else if (ch === ',') { row.push(value); value = ''; }
      else if (ch === '\n') finish();
      else value += ch;
    }
    if (quoted) throw new Error('Unclosed CSV quote.');
    if (row.length || value) finish();
    if (!rows.length) throw new Error('CSV is empty.');
    const width = rows[0].length;
    if (rows.some(row => row.length !== width)) throw new Error('CSV rows have different numbers of columns.');
    return rows;
  }
  function csvInput(value) { return /^'[\s]*[=+\-@]/u.test(value) ? value.slice(1) : value; }
  function checkHeader(actual, expected) { if (actual.length !== expected.length || actual.some((value, i) => value.trim() !== expected[i])) throw new Error('CSV columns do not match this tool’s template. Download the matching CSV first.'); }
  function gatherRows() {
    const rows = [GATHER_HEADER];
    names.forEach(([n]) => { const s = state.elements[n].sampling; rows.push(['Element', n, '', '', '', ...GATHER_SAMPLE_KEYS.map(key => s[key])]); });
    CATALOG.forEach(item => { const p = state.prompts[item.id] || { status: 'Not Reviewed', note: '' }; rows.push(['Prompt', item.element, item.id, p.status, p.note, ...GATHER_SAMPLE_KEYS.map(() => '')]); });
    return rows;
  }
  function parseGatherCsv(text) {
    const [header, ...rows] = parseCsv(text); checkHeader(header, GATHER_HEADER);
    if (rows.length > 66) throw new Error('Gather CSV has too many rows.');
    const next = structuredClone(state); const seen = new Set();
    rows.forEach((values, index) => {
      const line = index + 2; const [kind, elementText, promptId, status, note, ...sampleValues] = values.map(csvInput);
      const n = Number(elementText);
      if (!Number.isInteger(n) || n < 1 || n > 22) throw new Error(`Row ${line}: invalid element number.`);
      if (kind === 'Element') {
        if (promptId || status || note || seen.has(`E${n}`)) throw new Error(`Row ${line}: invalid or duplicate element row.`);
        seen.add(`E${n}`);
        GATHER_SAMPLE_KEYS.forEach((key, i) => { next.elements[n].sampling[key] = requireText(sampleValues[i], SAMPLE_LIMITS[key], `row ${line} ${key}`); });
        requireDate(next.elements[n].sampling.selectionCommunicatedOn, `row ${line} method date`);
      } else if (kind === 'Prompt') {
        const item = catalogById.get(promptId);
        if (!item || item.element !== n || seen.has(`P${promptId}`) || sampleValues.some(Boolean)) throw new Error(`Row ${line}: invalid or duplicate prompt row.`);
        seen.add(`P${promptId}`);
        const cleanStatus = status || 'Not Reviewed';
        if (!STATUSES.includes(cleanStatus)) throw new Error(`Row ${line}: invalid status.`);
        next.prompts[promptId] = { status: cleanStatus, note: requireText(note, 1000, `row ${line} prompt notes`) };
      } else throw new Error(`Row ${line}: Row Type must be Element or Prompt.`);
    });
    return { next, count: rows.length };
  }
  function parseDocumentsCsv(text) {
    const [header, ...rows] = parseCsv(text); checkHeader(header, documentRows()[0]);
    if (rows.length > 1000) throw new Error('Documents CSV has more than 1,000 references.');
    const documents = rows.map((raw, index) => {
      const line = index + 2; const v = raw.map(csvInput);
      const keys = ['assessment', 'title', 'type', 'reference', 'revision', 'owner', 'providedBy', 'versionStatus', 'versionNote', 'requestedOn', 'receivedOn', 'location', 'contents', 'count', 'elementIds', 'notes'];
      const fields = Object.fromEntries(keys.map((key, i) => [key, v[i]]));
      const doc = { id: `doc-${index + 1}` };
      for (const [key, limit] of Object.entries(DOC_LIMITS)) doc[key] = requireText(fields[key] ?? '', limit, `row ${line} ${key}`);
      if (!doc.title.trim()) throw new Error(`Row ${line}: reference title is required.`);
      doc.type = fields.type || 'Document'; doc.providedBy = fields.providedBy; doc.versionStatus = fields.versionStatus;
      if (!DOC_TYPES.includes(doc.type) || !PROVIDED_BY.includes(doc.providedBy) || !VERSION_STATUSES.includes(doc.versionStatus)) throw new Error(`Row ${line}: invalid type, provider, or version status.`);
      requireDate(doc.requestedOn, `row ${line} requested date`); requireDate(doc.receivedOn, `row ${line} received date`);
      const ids = fields.elementIds.trim() ? fields.elementIds.split(/[;,\s]+/).filter(Boolean).map(Number) : [];
      if (ids.length > 22 || ids.some(n => !Number.isInteger(n) || n < 1 || n > 22) || new Set(ids).size !== ids.length) throw new Error(`Row ${line}: invalid linked element numbers.`);
      doc.elementIds = ids.sort((a, b) => a - b);
      return doc;
    });
    return documents;
  }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function evidenceRows() {
    const header = ['Assessment Reference', 'Element Number', 'Element Name', 'Evidence Category', 'Evidence Status', 'Reference Level', 'Reference Title', 'Reference Type', 'Reference ID', 'Reference Date or Revision', 'Reference Owner', 'Provided By', 'Version Status', 'Related Version or Reference', 'Requested On', 'Received On', 'Storage Reference', 'Contents or Coverage', 'Approximate Item Count', 'Element Population Requested', 'Element Population Period', 'Element Population Size', 'Element Population Supplied By', 'Element Selection Method', 'Element Method Communicated On', 'Element Sample Size', 'Element Sample Performed By', 'Element Sample Performed When', 'Element Sampling Steps', 'Element Sampling Limitations', 'Imported Element Sampling Notes', 'Prompt Notes', 'Reference Notes', 'Authority Classification', 'Public Source', 'Applicability Explanation'];
    const rows = [header];
    selectedItems().forEach(item => {
      const p = promptState(item.id);
      const linked = state.documents.filter(doc => doc.elementIds.includes(item.element));
      const s = state.elements[item.element].sampling;
      (linked.length ? linked : [null]).forEach(doc => rows.push([state.meta.reference, item.element, item.name, item.category, effectiveStatus(item), doc ? 'Element-level reference; prompt support not assessed' : '', doc?.title, doc?.type, doc?.reference, doc?.revision, doc?.owner, doc?.providedBy, doc?.versionStatus, doc?.versionNote, doc?.requestedOn, doc?.receivedOn, doc?.location, doc?.contents, doc?.count, s.populationRequested, s.populationPeriod, s.populationSize, s.populationSuppliedBy, s.selectionMethod, s.selectionCommunicatedOn, s.sampleSize, s.samplePerformedBy, s.samplePerformedDate, s.sampleHow, s.sampleLimitations, s.legacyReferences.map(entry => `${entry.title}: ${legacySampleDescription(entry)}`).join(' | '), p.note, doc?.notes, item.classification, sourceLabel(item.source), state.elements[item.element].na ? state.elements[item.element].note : p.status === 'Not Applicable' ? p.note : '']));
    });
    return rows;
  }
  function documentRows() {
    return [['Assessment Reference', 'Reference Title', 'Reference Type', 'Reference ID', 'Reference Date or Revision', 'Owner', 'Provided By', 'Version Status', 'Related Version or Reference', 'Requested On', 'Received On', 'Storage Reference', 'Contents or Coverage', 'Approximate Item Count', 'Linked Element Numbers', 'Notes'], ...state.documents.map(doc => [state.meta.reference, doc.title, doc.type, doc.reference, doc.revision, doc.owner, doc.providedBy, doc.versionStatus, doc.versionNote, doc.requestedOn, doc.receivedOn, doc.location, doc.contents, doc.count, doc.elementIds.join('; '), doc.notes])];
  }
  function outstandingRows() {
    const rows = [['Assessment Reference', 'Element Number', 'Element Name', 'Evidence Category', 'Current Status', 'Possible Element Contacts', 'Notes']];
    selectedItems(false).filter(item => OUTSTANDING.has(effectiveStatus(item))).forEach(item => {
      const p = promptState(item.id);
      const owners = [...new Set(state.documents.filter(doc => doc.elementIds.includes(item.element)).map(doc => doc.owner).filter(Boolean))].join('; ');
      rows.push([state.meta.reference, item.element, item.name, item.category, effectiveStatus(item), owners, p.note]);
    });
    return rows;
  }
  function sessionForExport() {
    const elements = Object.fromEntries(Object.entries(state.elements).filter(([, e]) => e.selected || e.na || e.note || Object.keys(SAMPLE_LIMITS).some(key => e.sampling[key]) || e.sampling.legacyReferences.length));
    const prompts = Object.fromEntries(Object.entries(state.prompts).filter(([, p]) => p.status !== 'Not Reviewed' || p.note));
    return { schemaVersion: 4, meta: state.meta, elements, prompts, documents: state.documents, unassignedLegacySampling: state.unassignedLegacySampling };
  }
  function requireText(value, limit, label) { if (typeof value !== 'string' || value.length > limit) throw new Error(`Invalid ${label}.`); return value; }
  function requireDate(value, label) { if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid ${label}.`); return value; }
  function cleanLegacyEntry(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Invalid imported sampling note.');
    const clean = { title: requireText(entry.title ?? '', 200, 'imported sampling title'), reference: requireText(entry.reference ?? '', 160, 'imported sampling reference') };
    for (const key of LEGACY_SAMPLE_KEYS) clean[key] = requireText(entry[key] ?? '', key === 'samplePopulation' || key === 'sampleMethod' ? 300 : key === 'sampleSize' || key === 'samplePerformedDate' ? 100 : key === 'samplePerformedBy' ? 120 : key === 'sampleHow' ? 1000 : 500, `imported ${key}`);
    return clean;
  }
  function importSession(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || ![1, 2, 3, 4].includes(raw.schemaVersion)) throw new Error('Unsupported session format.');
    if (!raw.meta || !raw.elements || !raw.prompts || !Array.isArray(raw.documents)) throw new Error('Session sections are missing.');
    const next = blank(false);
    for (const [key, limit] of Object.entries(META_LIMITS)) next.meta[key] = requireText(raw.meta[key] ?? '', limit, key);
    requireDate(next.meta.date, 'preparation date');
    if (Object.keys(raw.elements).length > 22 || Object.keys(raw.prompts).length > 44 || raw.documents.length > 1000) throw new Error('Session is too large.');
    for (const [key, e] of Object.entries(raw.elements)) {
      if (!/^(?:[1-9]|1\d|2[0-2])$/.test(key) || !e || typeof e !== 'object' || Array.isArray(e) || typeof e.selected !== 'boolean' || typeof e.na !== 'boolean') throw new Error('Invalid element selection.');
      const sampling = blankSampling();
      if (raw.schemaVersion === 4) {
        if (!e.sampling || typeof e.sampling !== 'object' || Array.isArray(e.sampling)) throw new Error('Invalid element sampling.');
        for (const [field, limit] of Object.entries(SAMPLE_LIMITS)) sampling[field] = requireText(e.sampling[field] ?? '', limit, `element sampling ${field}`);
        requireDate(sampling.selectionCommunicatedOn, 'method communication date');
        if (!Array.isArray(e.sampling.legacyReferences) || e.sampling.legacyReferences.length > 1000) throw new Error('Invalid imported sampling notes.');
        sampling.legacyReferences = e.sampling.legacyReferences.map(cleanLegacyEntry);
      }
      next.elements[key] = { selected: e.selected, na: e.na && e.selected, note: requireText(e.note ?? '', 500, 'element note'), sampling };
    }
    const ids = new Set();
    for (const doc of raw.documents) {
      if (!doc || typeof doc !== 'object' || Array.isArray(doc) || typeof doc.id !== 'string' || !/^doc-[0-9]{1,12}$/.test(doc.id) || ids.has(doc.id)) throw new Error('Invalid or duplicate document ID.');
      ids.add(doc.id);
      const clean = { id: doc.id };
      for (const [key, limit] of Object.entries(DOC_LIMITS)) clean[key] = requireText(doc[key] ?? '', limit, `document ${key}`);
      requireDate(clean.requestedOn, 'requested date'); requireDate(clean.receivedOn, 'received date');
      clean.type = raw.schemaVersion === 1 ? 'Document' : requireText(doc.type, 30, 'reference type');
      if (!DOC_TYPES.includes(clean.type)) throw new Error('Invalid reference type.');
      clean.providedBy = raw.schemaVersion >= 3 ? requireText(doc.providedBy ?? '', 30, 'provided by') : '';
      clean.versionStatus = raw.schemaVersion >= 3 ? requireText(doc.versionStatus ?? '', 30, 'version status') : '';
      if (!PROVIDED_BY.includes(clean.providedBy) || !VERSION_STATUSES.includes(clean.versionStatus)) throw new Error('Invalid provenance or version status.');
      if (raw.schemaVersion >= 2) {
        if (!Array.isArray(doc.elementIds) || doc.elementIds.length > 22 || doc.elementIds.some(n => !Number.isInteger(n) || n < 1 || n > 22) || new Set(doc.elementIds).size !== doc.elementIds.length) throw new Error('Invalid element links.');
        clean.elementIds = [...doc.elementIds];
      } else clean.elementIds = [];
      if (!clean.title.trim()) throw new Error('A document title is missing.');
      next.documents.push(clean);
      if (raw.schemaVersion === 3 && LEGACY_SAMPLE_KEYS.some(key => doc[key])) {
        const entry = cleanLegacyEntry({ title: clean.title, reference: clean.reference, ...Object.fromEntries(LEGACY_SAMPLE_KEYS.map(key => [key, doc[key] ?? ''])) });
        if (clean.elementIds.length) clean.elementIds.forEach(n => next.elements[n].sampling.legacyReferences.push(entry));
        else next.unassignedLegacySampling.push(entry);
      }
    }
    for (const [id, p] of Object.entries(raw.prompts)) {
      if (!catalogById.has(id) || !p || typeof p !== 'object' || Array.isArray(p) || !STATUSES.includes(p.status)) throw new Error('Invalid prompt entry.');
      if (raw.schemaVersion === 1) {
        if (!Array.isArray(p.documentIds) || p.documentIds.length > 1000 || p.documentIds.some(docId => typeof docId !== 'string' || !ids.has(docId)) || new Set(p.documentIds).size !== p.documentIds.length) throw new Error('Invalid document relationship.');
        for (const docId of p.documentIds) { const doc = next.documents.find(d => d.id === docId); const n = catalogById.get(id).element; if (!doc.elementIds.includes(n)) doc.elementIds.push(n); }
      }
      next.prompts[id] = { status: p.status, note: requireText(p.note ?? '', 1000, 'prompt note') };
    }
    next.documents.forEach(doc => doc.elementIds.sort((a, b) => a - b));
    if (raw.schemaVersion === 4) {
      if (!Array.isArray(raw.unassignedLegacySampling) || raw.unassignedLegacySampling.length > 1000) throw new Error('Invalid unassigned sampling notes.');
      next.unassignedLegacySampling = raw.unassignedLegacySampling.map(cleanLegacyEntry);
    }
    return next;
  }
  function elementIndicator(n) {
    const element = state.elements[n];
    if (!element.selected) return { color: 'muted', label: 'Not selected', detail: 'Not in this preparation scope' };
    if (element.na) return { color: 'slate', label: 'Outside scope', detail: 'Entire element marked outside scope' };
    const statuses = CATALOG.filter(item => item.element === n).map(item => promptState(item.id).status);
    const detail = STATUSES.filter(status => statuses.includes(status)).map(status => `${statuses.filter(value => value === status).length} ${status.toLowerCase()}`).join(' · ');
    const applicable = statuses.filter(status => status !== 'Not Applicable');
    if (statuses.includes('Not Available')) return { color: 'red', label: 'Not available', detail };
    if (!applicable.length) return { color: 'slate', label: 'Not applicable', detail };
    if (applicable.every(status => status === 'Available')) return { color: 'green', label: 'Available', detail };
    if (applicable.every(status => status === 'Not Reviewed')) return { color: 'gray', label: 'Not reviewed', detail };
    return { color: 'yellow', label: 'Open or mixed', detail };
  }
  function printDashboard() {
    const review = renderReview();
    $('#print-report').setAttribute('aria-label', 'Printable evidence status dashboard');
    const meta = state.meta;
    const details = [['Assessment reference', meta.reference], ['Preparation date', meta.date], ['Organization or site', meta.organization], ['Assessment period', meta.period]].filter(([, value]) => value).map(([label, value]) => `<span><strong>${label}:</strong> ${escapeHtml(value)}</span>`).join('');
    const followup = review.statuses.Requested + review.statuses.Pending + review.statuses['Not Available'];
    const cards = [[review.values[0][0], 'Selected elements'], [review.active.length - review.statuses['Not Reviewed'], 'Prompts with status'], [followup, 'Need follow-up'], [review.statuses['Not Reviewed'], 'Not reviewed']].map(([count, label]) => `<div class="dashboard-count"><strong>${count}</strong><span>${label}</span></div>`).join('');
    const legend = [['green', 'Available'], ['yellow', 'Open or mixed'], ['red', 'Not available'], ['gray', 'Not reviewed'], ['slate', 'N/A or outside scope'], ['muted', 'Not selected']].map(([key, label]) => `<span><i class="indicator-${key}"></i>${label}</span>`).join('');
    const elements = names.map(([n, name]) => { const indicator = elementIndicator(n); return `<div class="dashboard-element indicator-${indicator.color}"><div class="dashboard-element-head"><strong>${n}. ${escapeHtml(name)}</strong><span>${indicator.label}</span></div><small>${escapeHtml(indicator.detail)}</small></div>`; }).join('');
    $('#print-report').innerHTML = `<div class="print-dashboard"><p class="dashboard-kicker">Government property · Preparation snapshot</p><h1>PMSA Evidence Status Dashboard</h1><p class="dashboard-intro">User-entered status across all 22 elements. Colors summarize evidence-prompt entries, not compliance or evidence quality.</p>${details ? `<div class="dashboard-meta">${details}</div>` : ''}<div class="dashboard-scope"><div><strong>CAGE codes under review</strong>${scopeList(meta.cageCodes)}</div><div><strong>Contract numbers under review</strong>${scopeList(meta.contractNumbers)}</div></div><div class="dashboard-counts">${cards}</div><div class="dashboard-subcounts">${review.statuses.Available} available · ${review.values[6][0]} not applicable · ${state.documents.length} document references</div><h2>Evidence status by element</h2><div class="dashboard-legend">${legend}</div><div class="dashboard-element-grid">${elements}</div><p class="dashboard-footnote">Green: all applicable prompts marked Available. Yellow: requested, pending, or mixed entries. Red: at least one prompt marked Not Available. Gray: not reviewed. Colors describe user entries only; they are not compliance findings. Revision 1 · Generated locally.</p></div>`;
    window.print();
  }
  function printReport() {
    const review = renderReview();
    $('#print-report').setAttribute('aria-label', 'Printable preparation summary');
    const meta = state.meta;
    const row = (a, b) => `<tr><th>${escapeHtml(a)}</th><td>${escapeHtml(b)}</td></tr>`;
    const counts = review.values.map(([n, label]) => row(label, n)).join('');
    const elements = names.filter(([n]) => state.elements[n].selected).map(([n, name]) => `${n}. ${name}${state.elements[n].na ? ' (outside scope)' : ''}`).join('; ');
    const groups = names.filter(([n]) => review.followup.some(item => item.element === n)).map(([n, name]) => `<div class="print-block"><h3>${n}. ${escapeHtml(name)}</h3><ul>${review.followup.filter(item => item.element === n).map(item => `<li>${escapeHtml(item.category)} — ${escapeHtml(effectiveStatus(item))}${promptState(item.id).note ? `: ${escapeHtml(promptState(item.id).note)}` : ''}</li>`).join('')}</ul></div>`).join('');
    const naItems = [...review.naElements.map(([n, name]) => `${n}. ${name} (element): ${state.elements[n].note || 'No explanation entered'}`), ...review.naPrompts.map(item => `${labelFor(item)}: ${promptState(item.id).note || 'No explanation entered'}`)];
    const sampleLabels = { populationRequested: 'Population', populationPeriod: 'Period', populationSize: 'Population size', populationSuppliedBy: 'Supplied by', selectionMethod: 'Selection method', selectionCommunicatedOn: 'Method communicated on', sampleSize: 'Sample size', samplePerformedBy: 'Performed by', samplePerformedDate: 'Performed when', sampleHow: 'How performed', sampleLimitations: 'Limitations' };
    const sampling = names.map(([n, name]) => { const s = state.elements[n].sampling; const entries = Object.entries(sampleLabels).filter(([key]) => s[key]).map(([key, label]) => `<li><strong>${label}:</strong> ${escapeHtml(s[key])}</li>`).join(''); const legacy = s.legacyReferences.map(entry => `<li><strong>Imported from ${escapeHtml(entry.title)}:</strong> ${escapeHtml(legacySampleDescription(entry))}</li>`).join(''); return entries || legacy ? `<div class="print-block"><h3>${n}. ${escapeHtml(name)}</h3><ul>${entries}${legacy}</ul></div>` : ''; }).join('');
    const unassigned = state.unassignedLegacySampling.length ? `<div class="print-block"><h3>Imported notes not assigned to an element</h3><ul>${state.unassignedLegacySampling.map(entry => `<li><strong>${escapeHtml(entry.title)}:</strong> ${escapeHtml(legacySampleDescription(entry))}</li>`).join('')}</ul></div>` : '';
    $('#print-report').innerHTML = `<h1>Evidence preparation summary</h1><p class="print-note">Revision 1 · Locally generated preparation notes · Not an official PMSA report</p><table>${row('Assessment reference', meta.reference)}${row('Preparation date', meta.date)}${row('Organization or site', meta.organization)}${row('Assessment period', meta.period)}${row('CAGE codes under review', scopeLines(meta.cageCodes).join(', ') || 'Not entered')}${row('Contract numbers under review', scopeLines(meta.contractNumbers).join(', ') || 'Not entered')}${row('Preparer', meta.preparer)}</table><h2>Selected elements</h2><p>${escapeHtml(elements || 'None selected')}</p><h2>Preparation counts</h2><table>${counts}</table><h2>Needs follow-up</h2>${groups || '<p>None recorded.</p>'}<p>${review.notReviewed.length} prompt${review.notReviewed.length === 1 ? '' : 's'} not reviewed yet. See the outstanding CSV for the full list.</p><h2>Not applicable items</h2><ul>${naItems.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '<li>None recorded.</li>'}</ul><h2>Population and sampling notes by element</h2>${sampling || '<p>None entered.</p>'}${unassigned}<h2>General notes</h2><p>${escapeHtml(meta.notes || 'None entered.')}</p><h2>Limits</h2><p class="print-note">These are user-entered statuses and references, not compliance findings or evidence-sufficiency determinations. Population and sampling notes describe what the user entered; the tool does not select samples or verify a method. Determine applicability from the actual contract, incorporated clause versions, deviations, and Government direction. The 22 DCMA elements are organizational guidance, not 22 separate FAR outcomes.</p>`;
    window.print();
  }
  function loadDemo() {
    state = blank(false);
    state.meta = { reference: 'DEMO-PMSA-042', date: '2026-11-15', organization: 'Example Harbor Works', period: 'Fictional review period', cageCodes: 'DEMO1\nDEMO2', contractNumbers: 'DEMO-CONTRACT-001\nDEMO-CONTRACT-002', preparer: 'Demo preparer', notes: 'Fictional information for demonstration only.' };
    for (const n of [1, 2, 4, 7, 9, 18, 22]) state.elements[n].selected = true;
    state.elements[18].na = true; state.elements[18].note = 'No storage area is included in this fictional preparation scope.';
    Object.assign(state.elements[4].sampling, { populationRequested: 'Fictional receiving entries', populationPeriod: 'Illustrative review period', populationSize: 'about 120', populationSuppliedBy: 'Demo receiving team', selectionMethod: 'Illustrative selection across dates', selectionCommunicatedOn: '2026-10-05', sampleSize: '12', samplePerformedBy: 'Demo reviewer', samplePerformedDate: '2026-10', sampleHow: 'Selected fictional entries from several dates for demonstration.', sampleLimitations: 'No actual records were reviewed.' });
    state.documents = [
      { id: 'doc-1', title: 'Fictional Property Procedures', type: 'Document', reference: 'DEMO-PROC-01', revision: 'Rev A', owner: 'Property team', providedBy: 'Auditee', versionStatus: 'New', versionNote: '', requestedOn: '2026-10-01', receivedOn: '2026-10-03', location: 'Demo folder / procedures', contents: 'Synthetic property-management procedures', count: '', notes: 'Invented example.', elementIds: [1, 2] },
      { id: 'doc-2', title: 'Fictional Receiving Records ZIP', type: 'Record set / ZIP', reference: 'DEMO-REC-01', revision: 'Rev B', owner: 'Receiving team', providedBy: 'Auditee', versionStatus: 'Revised version', versionNote: 'Replaces DEMO-REC-00 Rev A', requestedOn: '2026-10-02', receivedOn: '2026-10-08', location: 'Demo folder / intake.zip', contents: 'Synthetic receiving logs and delivery notes', count: 'about 120', notes: 'Invented example.', elementIds: [4] },
      { id: 'doc-3', title: 'Fictional Inventory Backup', type: 'Backup / archive', reference: 'DEMO-INV-01', revision: '2026', owner: 'Property team', providedBy: 'Auditor', versionStatus: 'Replacement', versionNote: 'Replaces DEMO-INV-00', requestedOn: '', receivedOn: '2026-10-09', location: 'Demo folder / counts-backup.zip', contents: 'Synthetic inventory count records', count: 'about 250', notes: 'Invented example.', elementIds: [9] }
    ];
    state.prompts = {
      '1-1': { status: 'Available', note: 'Reference listed for review.' },
      '2-1': { status: 'Pending', note: 'Ask for current review procedure.' },
      '4-1': { status: 'Available', note: '' },
      '7-1': { status: 'Requested', note: 'Request an example accountable record.' },
      '9-1': { status: 'Available', note: '' },
      '22-1': { status: 'Not Applicable', note: 'Closeout is outside this fictional review period.' }
    };
    nextDocumentId = 4;
    $('#document-search').value = '';
    renderMeta(); renderElements(); renderPrompts(); renderDocuments(); renderReview(); clearDocForm(); announce('Fictional example loaded.');
  }

  document.addEventListener('input', event => {
    const t = event.target;
    if (t.dataset.meta) state.meta[t.dataset.meta] = t.value;
    if (t.dataset.elementNote) state.elements[t.dataset.elementNote].note = t.value;
    if (t.dataset.promptNote) promptState(t.dataset.promptNote).note = t.value;
    if (t.id === 'document-search') renderDocuments();
  });
  document.addEventListener('change', event => {
    const t = event.target;
    if (t.dataset.elementSelect) { const e = state.elements[t.dataset.elementSelect]; e.selected = t.checked; if (!e.selected) e.na = false; renderElements(); renderPrompts(); }
    if (t.dataset.elementScope) { state.elements[t.dataset.elementScope].na = t.value === 'na'; renderElements(); renderPrompts(); }
    if (t.dataset.promptStatus) { promptState(t.dataset.promptStatus).status = t.value; const section = t.closest?.('[data-gather-element]'); const summary = section?.querySelector('summary small'); if (summary) { const n = Number(section.dataset.gatherElement); const reviewed = CATALOG.filter(item => item.element === n && promptState(item.id).status !== 'Not Reviewed').length; summary.textContent = `${reviewed} of 2 reviewed`; } }
    if (t.id === 'document-sort') renderDocuments();
    if ((t.id === 'import-gather' || t.id === 'import-documents') && t.files?.[0]) {
      const file = t.files[0]; const gather = t.id === 'import-gather'; const message = gather ? '#gather-csv-message' : '#documents-csv-message';
      if (file.size > 12 * 1024 * 1024) { csvMessage(message, 'CSV exceeds the 12 MB limit.', true); t.value = ''; return; }
      file.text().then(text => {
        if (gather) {
          const { next, count } = parseGatherCsv(text);
          if (!window.confirm(`Update ${count} Gather rows from this CSV? Existing entries for those rows will be replaced.`)) return csvMessage(message, 'Gather CSV import cancelled.');
          state = next; renderPrompts(); renderReview(); csvMessage(message, `${count} Gather rows imported. Scope and documents were preserved.`);
        } else {
          const documents = parseDocumentsCsv(text);
          if (!window.confirm(`Replace ${state.documents.length} current document references with ${documents.length} CSV rows?`)) return csvMessage(message, 'Documents CSV import cancelled.');
          state.documents = documents; nextDocumentId = documents.length + 1; $('#document-search').value = ''; clearDocForm(); renderDocuments(); renderReview(); csvMessage(message, `${documents.length} document references imported. Gather entries were preserved.`);
        }
      }).catch(error => csvMessage(message, `CSV not imported: ${error.message}`, true)).finally(() => { t.value = ''; });
    }
    if (t.id === 'open-session' && t.files?.[0]) {
      const file = t.files[0];
      if (file.size > 12 * 1024 * 1024) { announce('Session file exceeds the 12 MB limit.', true); t.value = ''; return; }
      file.text().then(text => { const parsed = JSON.parse(text); const imported = importSession(parsed); if (hasWorkingEntries() && !window.confirm('Open this session and replace the current unsaved entries?')) return announce('Session import cancelled.'); state = imported; nextDocumentId = Math.max(0, ...state.documents.map(doc => Number(doc.id.slice(4)))) + 1; $('#document-search').value = ''; renderMeta(); renderElements(); renderPrompts(); renderDocuments(); renderReview(); clearDocForm(); announce('Session loaded successfully.'); }).catch(error => announce(`Session not loaded: ${error.message}`, true)).finally(() => { t.value = ''; });
    }
  });
  $('#select-all').addEventListener('click', () => { names.forEach(([n]) => { state.elements[n].selected = true; }); renderElements(); renderPrompts(); });
  $('#select-none').addEventListener('click', () => { names.forEach(([n]) => { state.elements[n].selected = false; state.elements[n].na = false; }); renderElements(); renderPrompts(); });
  $('#element-list').addEventListener('click', event => {
    const select = event.target.closest('[data-select-group]');
    const clear = event.target.closest('[data-clear-group]');
    if (!select && !clear) return;
    const group = elementGroups[Number((select || clear).dataset.selectGroup ?? (select || clear).dataset.clearGroup)];
    if (!group) return;
    group.numbers.forEach(n => { state.elements[n].selected = !!select; if (clear) state.elements[n].na = false; });
    renderElements(); renderPrompts();
  });
  $('#prompts').addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-sampling]');
    if (!trigger) return;
    const n = Number(trigger.dataset.openSampling);
    const sampling = state.elements[n]?.sampling;
    if (!sampling) return;
    $('#sampling-element-id').value = String(n);
    $('#sampling-dialog-title').textContent = `${n}. ${names.find(([id]) => id === n)[1]} — population and sampling notes`;
    for (const key of Object.keys(SAMPLE_LIMITS)) $(`#sample-${key}`).value = sampling[key];
    $('#sampling-legacy').innerHTML = sampling.legacyReferences.length ? `<div class="legacy-sampling"><strong>Imported notes from an earlier session</strong>${sampling.legacyReferences.map(entry => `<p><strong>${escapeHtml(entry.title)}${entry.reference ? ` (${escapeHtml(entry.reference)})` : ''}:</strong> ${escapeHtml(legacySampleDescription(entry))}</p>`).join('')}</div>` : '';
    $('#sampling-dialog').showModal();
  });
  $('#sampling-form').addEventListener('submit', event => {
    event.preventDefault();
    const n = Number($('#sampling-element-id').value);
    const sampling = state.elements[n]?.sampling;
    if (!sampling) return;
    for (const key of Object.keys(SAMPLE_LIMITS)) sampling[key] = $(`#sample-${key}`).value.trim();
    $('#sampling-dialog').close();
    renderPrompts();
  });
  $('#cancel-sampling').addEventListener('click', () => $('#sampling-dialog').close());
  $('#close-sampling').addEventListener('click', () => $('#sampling-dialog').close());
  document.querySelectorAll('[data-document-view]').forEach(tab => {
    tab.addEventListener('click', () => { documentView = tab.dataset.documentView; renderDocuments(); tab.focus(); });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('[data-document-view]')];
      const current = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].click();
    });
  });
  $('#add-document').addEventListener('click', () => { clearDocForm(); $('#document-editor').showModal(); $('#doc-title').focus(); });
  $('#add-doc-element').addEventListener('click', () => {
    const n = Number($('#doc-element-choice').value);
    if (n >= 1 && n <= 22 && !editingElementIds.includes(n)) { editingElementIds.push(n); editingElementIds.sort((a, b) => a - b); renderDocElements(); }
    $('#doc-element-choice').value = '';
  });
  $('#doc-element-tags').addEventListener('click', event => {
    const remove = event.target.closest('[data-remove-doc-element]');
    if (remove) { editingElementIds = editingElementIds.filter(n => n !== Number(remove.dataset.removeDocElement)); renderDocElements(); }
  });
  $('#document-form').addEventListener('submit', event => {
    event.preventDefault();
    const currentId = $('#document-id').value;
    const doc = { id: currentId || `doc-${nextDocumentId++}`, type: $('#doc-type').value, providedBy: $('#doc-providedBy').value, versionStatus: $('#doc-versionStatus').value, elementIds: [...editingElementIds] };
    for (const key of Object.keys(DOC_LIMITS)) doc[key] = $(`#doc-${key}`).value.trim();
    if (!doc.title) return;
    if (currentId) state.documents[state.documents.findIndex(item => item.id === currentId)] = doc; else state.documents.push(doc);
    clearDocForm(); renderDocuments();
  });
  $('#cancel-edit').addEventListener('click', clearDocForm);
  $('#document-list').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-doc]'); const remove = event.target.closest('[data-delete-doc]');
    if (edit) { const doc = state.documents.find(x => x.id === edit.dataset.editDoc); if (!doc) return; clearDocForm(); $('#document-editor-title').textContent = 'Edit evidence reference'; $('#document-id').value = doc.id; $('#doc-type').value = doc.type; $('#doc-providedBy').value = doc.providedBy; $('#doc-versionStatus').value = doc.versionStatus; for (const key of Object.keys(DOC_LIMITS)) $(`#doc-${key}`).value = doc[key]; editingElementIds = [...doc.elementIds]; renderDocElements(); $('#save-document').textContent = 'Save changes'; $('#document-editor').showModal(); $('#doc-title').focus(); }
    if (remove) { const id = remove.dataset.deleteDoc; const doc = state.documents.find(item => item.id === id); if (!doc || !window.confirm(`Remove the reference “${doc.title}”?`)) return; state.documents = state.documents.filter(item => item.id !== id); if ($('#document-id').value === id) clearDocForm(); renderDocuments(); }
  });
  $('#close-document').addEventListener('click', clearDocForm);
  $('#download-index').addEventListener('click', () => download('pmsa-evidence-index.csv', csv(evidenceRows()), 'text/csv;charset=utf-8'));
  $('#download-gather').addEventListener('click', () => download('pmsa-gather-entries.csv', csv(gatherRows()), 'text/csv;charset=utf-8'));
  $('#download-documents').addEventListener('click', () => download('pmsa-evidence-references.csv', csv(documentRows()), 'text/csv;charset=utf-8'));
  $('#download-documents-here').addEventListener('click', () => download('pmsa-evidence-references.csv', csv(documentRows()), 'text/csv;charset=utf-8'));
  $('#download-outstanding').addEventListener('click', () => download('pmsa-outstanding-evidence.csv', csv(outstandingRows()), 'text/csv;charset=utf-8'));
  const saveSession = () => download('pmsa-working-session.json', JSON.stringify(sessionForExport(), null, 2) + '\n', 'application/json;charset=utf-8');
  $('#save-session').addEventListener('click', saveSession);
  $('#save-session-quick').addEventListener('click', saveSession);
  $('#print-summary').addEventListener('click', printReport);
  $('#print-dashboard').addEventListener('click', printDashboard);
  $('#print-dashboard-export').addEventListener('click', printDashboard);
  $('#reset-session').addEventListener('click', () => { if (!window.confirm('Reset the current session? Unsaved entries will be lost.')) return; state = blank(); nextDocumentId = 1; $('#document-search').value = ''; renderMeta(); renderElements(); renderPrompts(); renderDocuments(); renderReview(); clearDocForm(); announce('Session reset.'); });
  $('#load-demo').addEventListener('click', () => { if (hasWorkingEntries() && !window.confirm('Load the fictional example and replace the current unsaved entries?')) return; loadDemo(); });
  window.addEventListener('hashchange', showStep);
  $('#doc-element-choice').innerHTML = '<option value="">Choose an element</option>' + names.map(([n, name]) => `<option value="${n}">${n}. ${escapeHtml(name)}</option>`).join('');
  renderDocElements();
  renderMeta(); renderElements(); showStep();
  window.PMSATest = { getState: () => structuredClone(state), importSession, evidenceRows, documentRows, gatherRows, parseGatherCsv, parseDocumentsCsv, parseCsv, outstandingRows, csv, sessionForExport };
})();
