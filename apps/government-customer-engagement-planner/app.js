(function () {
  'use strict';
  const M = window.PlannerModel;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const uid = () => (globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  let data = M.blank(), selected = '', editing = null, returnFocus = null, fileMode = '';
  let saveQueue = Promise.resolve();
  const DB = 'government-customer-engagement-planner-v1';
  function openDb() { return new Promise((resolve, reject) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('records'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
  async function load() { const db = await openDb(); return new Promise((resolve, reject) => { const tx = db.transaction('records', 'readonly'); const r = tx.objectStore('records').get('planner'); r.onsuccess = () => resolve(r.result || M.blank()); r.onerror = () => reject(r.error); tx.oncomplete = () => db.close(); }); }
  async function save(snapshot) { const db = await openDb(); return new Promise((resolve, reject) => { const tx = db.transaction('records', 'readwrite'); tx.objectStore('records').put(snapshot, 'planner'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; }); }
  function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
  function changed(text = 'Saved locally in this browser.') { saveQueue = saveQueue.then(() => save(structuredClone(data))).then(() => message(text)).catch(() => message('Could not save in IndexedDB. Export a JSON backup now.', true)); render(); }
  function tab() { const key = ['dashboard', 'leadership', 'reports'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard'; for (const id of ['dashboard', 'leadership', 'reports']) { $(id).classList.toggle('hidden', id !== key); const link = document.querySelector(`[data-tab="${id}"]`); if (id === key) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); } }
  function button(label, action, id = '', extra = '') { return `<button type="button" data-action="${action}" data-id="${escape(id)}" ${extra}>${escape(label)}</button>`; }
  const pill = (text, kind = '') => `<span class="status ${kind}">${escape(text)}</span>`;
  function renderMetrics(s) { $('metrics').innerHTML = [['Total customers', s.totalCustomers], ['Completed engagements', s.completed], ['Upcoming engagements', s.upcoming], ['Overdue follow-ups', s.overdue], ['Leadership opportunities', s.opportunities]].map(([label, count]) => `<div class="card"><div class="small muted">${label}</div><div class="metric">${count}</div></div>`).join(''); }
  function customerStatus(f) { if (f.followUpOverdue) return pill('Follow-up overdue', 'danger'); if (f.cadenceOverdue) return pill('Cadence overdue', 'warning'); const latest = f.history.at(-1); if (latest) return pill(latest.status, latest.status === 'Completed' ? 'success' : ''); return pill('No history'); }
  function renderCustomers(s) {
    const q = $('search').value.toLowerCase(), agency = $('filter-agency').value.toLowerCase(), rep = $('filter-rep').value.toLowerCase(), status = $('filter-status').value, from = $('filter-from').value, to = $('filter-to').value;
    const shown = s.facts.filter(f => { const c = f.customer, latest = f.history.at(-1); return (!q || [c.agency, c.program, c.contact].some(v => (v || '').toLowerCase().includes(q))) && (!agency || c.agency.toLowerCase().includes(agency)) && (!rep || (c.representative || '').toLowerCase().includes(rep)) && (!status || (status === 'Needs attention' ? f.needsAttention : latest?.status === status)) && ((!from && !to) || f.history.some(e => (!from || e.date >= from) && (!to || e.date <= to))); });
    $('getting-started').classList.toggle('hidden', data.customers.length > 0);
    $('result-count').textContent = `${shown.length} of ${s.totalCustomers} ${s.totalCustomers === 1 ? 'customer' : 'customers'} shown`;
    $('customer-list').innerHTML = shown.length ? `<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Last completed</th><th>Next planned</th><th>Status</th><th>Follow-up</th><th>Open</th></tr></thead><tbody>${shown.map(f => `<tr class="${f.customer.id === selected ? 'selected' : ''}"><td data-label="Customer"><strong>${escape(f.customer.agency)}</strong><br>${escape(f.customer.program)}</td><td data-label="Last completed">${escape(f.last || '—')}</td><td data-label="Next planned">${escape(f.next || '—')}</td><td data-label="Status">${customerStatus(f)}</td><td data-label="Follow-up">${f.followUpOverdue ? 'Yes' : f.cadenceOverdue ? 'Cadence due' : f.next ? 'Planned' : 'No next date'}</td><td data-label="Open">${button('View history', 'select-customer', f.customer.id)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">${s.totalCustomers ? 'No customers match these filters. Change a filter to see more.' : 'No customers yet. Add your first customer to begin.'}</p>`;
  }
  function renderDetail(s) {
    const c = data.customers.find(row => row.id === selected); if (!c) { $('customer-detail').innerHTML = '<h3>Customer history</h3><p class="muted">Select a customer to see its engagement history.</p>'; return; }
    const f = s.facts.find(row => row.customer.id === c.id), history = [...f.history].reverse();
    $('customer-detail').innerHTML = `<div class="entry-title"><div><h3>${escape(c.agency)}</h3><p class="muted">${escape(c.program || 'No program entered')} · ${escape(c.cadence || 'As Needed')} cadence</p></div><div class="actions">${button('Edit customer', 'edit-customer', c.id)}${button('Delete customer', 'delete-customer', c.id, 'class="danger"')}</div></div><p><strong>Contact:</strong> ${escape(c.contact || 'Not entered')} ${escape(c.contactTitle || '')} · <strong>Representative:</strong> ${escape(c.representative || 'Not entered')}</p><p><strong>Cadence due:</strong> ${escape(f.cadenceDue || 'Not calculated')} · <strong>Next planned:</strong> ${escape(f.next || 'None')}</p>${c.notes ? `<p>${escape(c.notes)}</p>` : ''}<div class="actions">${button('Add engagement', 'add-engagement', c.id, 'class="primary"')}${button('Flag leadership opportunity', 'add-opportunity', c.id)}</div><h3>Engagement history</h3>${history.length ? history.map(e => `<div class="entry"><div class="entry-title"><div><strong>${escape(e.date || 'No date')} · ${escape(e.type)}</strong> ${pill(e.status, e.status === 'Completed' ? 'success' : e.status === 'Follow-Up Needed' ? 'warning' : '')}<p class="small">${escape(e.purpose)}${e.nextDate ? ` · Next: ${escape(e.nextDate)}` : ''}</p>${e.notes ? `<p>${escape(e.notes)}</p>` : ''}</div><div class="actions">${button('Edit', 'edit-engagement', e.id)}${button('Delete', 'delete-engagement', e.id, 'class="danger"')}</div></div></div>`).join('') : '<p class="muted">No engagements yet.</p>'}`;
  }
  function renderOpportunities() {
    $('opportunity-list').innerHTML = data.opportunities.length ? data.opportunities.map(o => `<div class="entry"><div class="entry-title"><div><h3>${escape(o.agency || data.customers.find(c => c.id === o.customerId)?.agency || 'Customer not entered')}</h3><p>${escape(o.position)} · ${escape(o.representative || 'Representative not specified')} · ${escape(o.purpose)}</p><p>${pill(o.status, o.status === 'Completed' ? 'success' : o.status === 'Declined' ? 'warning' : '')} ${o.priority ? pill(o.priority + ' priority') : pill('Priority not set')} ${o.targetDate ? `Target: ${escape(o.targetDate)}` : 'No target date'}</p>${o.notes ? `<p>${escape(o.notes)}</p>` : ''}</div><div class="actions">${button('Edit', 'edit-opportunity', o.id)}${o.status === 'Completed' && !o.linkedEngagementId ? button('Record in history', 'record-opportunity', o.id) : ''}${o.linkedEngagementId ? pill('Recorded in history', 'success') : ''}${button('Delete', 'delete-opportunity', o.id, 'class="danger"')}</div></div></div>`).join('') : '<p class="muted">No leadership opportunities yet.</p>';
  }
  function report() {
    const from = $('report-from').value, to = $('report-to').value, s = M.summary(data, M.today(), from, to);
    if (from && to && from > to) { $('report-paper').innerHTML = '<p class="report-empty">The report start date must be on or before the end date.</p>'; return; }
    const active = M.reportOpportunities(data, from, to);
    const attention = s.facts.filter(f => f.needsAttention);
    const reasons = [
      ['Follow-up overdue', attention.filter(f => f.followUpOverdue).length, 'danger'],
      ['Cadence overdue', attention.filter(f => !f.followUpOverdue && f.cadenceOverdue).length, 'warning'],
      ['No planned next engagement', attention.filter(f => !f.followUpOverdue && !f.cadenceOverdue).length, 'info']
    ];
    const pipeline = ['Identified', 'Proposed', 'Requested', 'Scheduled', 'Completed'].map(status => [status, active.filter(o => o.status === status).length, 'primary']);
    const metric = (label, value, detail, tone = '') => `<div class="report-kpi ${tone}"><span class="report-kpi-label">${label}</span><strong>${value}</strong><span class="report-kpi-detail">${detail}</span></div>`;
    const bar = ([label, value, tone], total) => `<div class="report-bar-row"><div class="report-bar-label"><span>${label}</span><strong>${value}</strong></div><div class="report-bar-track" aria-hidden="true"><span class="report-bar-fill ${tone}" style="width:${total ? Math.round(value / total * 100) : 0}%"></span></div></div>`;
    const period = from || to ? `${escape(from || 'Open start')} – ${escape(to || 'Open end')}` : 'All dates';
    $('report-paper').innerHTML = `
      <div class="report-masthead"><div><p class="report-eyebrow">MANAGEMENT BRIEF · CUSTOMER ENGAGEMENT</p><h2>Government Customer Engagement Report</h2><p>Portfolio activity, leadership opportunities, and follow-up priorities.</p></div><div class="report-meta"><span>Prepared ${escape(M.today())}</span><span>${period}</span></div></div>
      <div class="report-body">
        <div class="report-kpis" aria-label="Portfolio snapshot">
          ${metric('Customers', s.totalCustomers, 'Total in planner')}
          ${metric('Completed', s.completed, 'Engagements in period', 'success')}
          ${metric('Upcoming', s.upcoming, 'Planned in period')}
          ${metric('Need attention', attention.length, 'As of today', 'warning')}
        </div>
        <div class="report-insights">
          <section class="report-insight" aria-labelledby="attention-breakdown"><div class="report-section-head"><h3 id="attention-breakdown">Customer attention</h3><span>${attention.length} of ${s.totalCustomers}</span></div><p class="report-caption">Each customer appears in one primary reason, as of today.</p>${s.totalCustomers ? reasons.map(row => bar(row, s.totalCustomers)).join('') : '<p class="report-empty">Add a customer to see attention priorities.</p>'}</section>
          <section class="report-insight" aria-labelledby="pipeline-breakdown"><div class="report-section-head"><h3 id="pipeline-breakdown">Leadership pipeline</h3><span>${active.length} ${active.length === 1 ? 'opportunity' : 'opportunities'}</span></div><p class="report-caption">Current status in the selected period. Completed meetings use the actual date; undated records remain included.</p>${active.length ? pipeline.map(row => bar(row, active.length)).join('') : '<p class="report-empty">No leadership opportunities to summarize.</p>'}</section>
        </div>
        <section class="report-detail" aria-labelledby="opportunity-detail"><div class="report-section-head"><h3 id="opportunity-detail">Leadership opportunities</h3><span>${active.length} in period</span></div>${active.length ? `<div class="report-table-wrap"><p class="report-swipe-hint">Swipe sideways to see all columns.</p><table><thead><tr><th>Agency</th><th>Government leadership position</th><th>Company representative</th><th>Purpose</th><th>Meeting dates</th><th>Status</th></tr></thead><tbody>${active.map(o => `<tr><td>${escape(o.agency || data.customers.find(c => c.id === o.customerId)?.agency || 'Not entered')}</td><td>${escape(o.position)}</td><td>${escape(o.representative || 'Not specified')}</td><td>${escape(o.purpose)}</td><td>Target: ${escape(o.targetDate || '—')}<br>Actual: ${escape(o.completedDate || '—')}</td><td>${escape(o.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="report-empty">No leadership opportunities in this period.</p>'}</section>
        <section class="report-detail" aria-labelledby="attention-detail"><div class="report-section-head"><h3 id="attention-detail">Customers needing attention</h3><span>${attention.length} flagged</span></div>${attention.length ? `<div class="report-table-wrap"><p class="report-swipe-hint">Swipe sideways to see all columns.</p><table><thead><tr><th>Customer</th><th>Primary reason</th><th>Last completed</th><th>Next planned</th></tr></thead><tbody>${attention.map(f => `<tr><td>${escape(f.customer.agency)}</td><td>${f.followUpOverdue ? 'Follow-up overdue' : f.cadenceOverdue ? 'Cadence overdue' : 'No planned next engagement'}</td><td>${escape(f.last || '—')}</td><td>${escape(f.next || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="report-empty">No customers currently flagged.</p>'}</section>
        <p class="report-footnote">Counts for completed and upcoming engagements use the selected period. Attention uses today’s date. Cadence is an internal planning preference; review records before sharing.</p>
      </div>`;
  }
  function render() { const s = M.summary(data); renderMetrics(s); renderCustomers(s); renderDetail(s); renderOpportunities(); report(); tab(); }
  const lists = {
    contactLevel: ['CO/CS', 'COR', 'Program Management', 'Agency Leadership', 'Other'],
    cadence: ['Monthly', 'Quarterly', 'Semiannual', 'Annual', 'As Needed'],
    type: ['Meeting', 'Call', 'Email', 'Site Visit', 'Other'],
    purpose: ['Relationship Building', 'Contract Review', 'Strategic Discussion', 'Issue Resolution', 'Other'],
    engagementStatus: ['Planned', 'Completed', 'Follow-Up Needed'],
    leadershipRep: ['Director', 'VP', 'Executive', 'Other'],
    priority: ['High', 'Medium', 'Low'],
    leadershipStatus: ['Identified', 'Proposed', 'Requested', 'Scheduled', 'Completed', 'Declined']
  };
  const fields = {
    customer: [['agency', 'Agency / Customer', 'text', true], ['program', 'Contract / Program'], ['contact', 'Government Contact'], ['contactTitle', 'Government Contact Title'], ['contactLevel', 'Contact Level', 'contactLevel'], ['representative', 'Company Representative', 'text', true], ['cadence', 'Preferred cadence', 'cadence'], ['notes', 'Notes', 'textarea']],
    engagement: [['customerId', 'Customer', 'customer', true], ['date', 'Engagement date', 'date', true], ['type', 'Engagement type', 'type'], ['purpose', 'Engagement purpose', 'purpose'], ['status', 'Status', 'engagementStatus'], ['nextDate', 'Next planned engagement', 'date'], ['notes', 'Notes', 'textarea']],
    opportunity: [['customerId', 'Existing customer (optional)', 'customer'], ['agency', 'Agency / Customer', 'text', true], ['contact', 'Government Leadership Contact'], ['position', 'Government Title / Position', 'text', true], ['representative', 'Proposed Company Representative', 'leadershipRep'], ['purpose', 'Meeting Purpose', 'text', true], ['priority', 'Priority', 'priority'], ['targetDate', 'Target Meeting Date', 'date'], ['status', 'Status', 'leadershipStatus'], ['completedDate', 'Actual completed date (if completed)', 'date'], ['notes', 'Notes', 'textarea']]
  };
  function fieldHtml([key, label, type = 'text', required], value) {
    let control;
    if (type === 'textarea') control = `<textarea name="${key}" id="field-${key}">${escape(value)}</textarea>`;
    else if (type === 'customer') control = `<select name="${key}" id="field-${key}" ${required ? 'required' : ''}><option value="">${required ? 'Choose a customer' : 'No linked customer'}</option>${data.customers.map(c => `<option value="${escape(c.id)}" ${value === c.id ? 'selected' : ''}>${escape(c.agency)}</option>`).join('')}</select>`;
    else if (lists[type]) control = `<select name="${key}" id="field-${key}" ${required ? 'required' : ''}>${['contactLevel', 'leadershipRep', 'priority', 'type', 'purpose'].includes(type) ? `<option value="">${required ? 'Choose one' : 'Not specified'}</option>` : ''}${lists[type].map(v => `<option value="${escape(v)}" ${value === v ? 'selected' : ''}>${escape(v)}</option>`).join('')}</select>`;
    else control = `<input name="${key}" id="field-${key}" type="${type}" value="${escape(value)}" ${required ? 'required' : ''}>`;
    return `<label class="${type === 'textarea' ? 'span-all' : ''}" for="field-${key}">${escape(label)}${required ? ' *' : ''}${control}</label>`;
  }
  function openEditor(kind, id = '', preset = {}) {
    const collection = { customer: data.customers, engagement: data.engagements, opportunity: data.opportunities }[kind];
    if (kind === 'engagement' && !data.customers.length) { message('Add a customer before adding an engagement.', true); $('add-customer').focus(); return; }
    returnFocus = document.activeElement;
    const record = collection.find(x => x.id === id) || preset;
    editing = { kind, id };
    $('editor-title').textContent = `${id ? 'Edit' : 'Add'} ${kind === 'opportunity' ? 'leadership opportunity' : kind}`;
    $('editor-help').textContent = kind === 'engagement' ? 'Each saved engagement remains a separate history entry.' : kind === 'opportunity' ? 'A completed meeting can be recorded in customer history once its actual date is known.' : 'Cadence is a company planning preference, not a Government requirement.';
    $('editor-fields').innerHTML = fields[kind].map(field => fieldHtml(field, record[field[0]] || (field[0] === 'cadence' ? 'As Needed' : field[0] === 'status' ? kind === 'opportunity' ? 'Identified' : 'Planned' : ''))).join('');
    $('editor-error').textContent = '';
    $('editor').showModal();
    $('editor-fields').querySelector('input,select,textarea')?.focus();
  }
  function closeEditor(restoreFocus = true) { $('editor').close(); editing = null; if (restoreFocus) returnFocus?.focus(); }
  function saveEditor(event) {
    event.preventDefault();
    const { kind, id } = editing, values = Object.fromEntries(new FormData(event.target).entries());
    for (const key of Object.keys(values)) values[key] = String(values[key]).trim().slice(0, key === 'notes' ? 4000 : 300);
    if (kind === 'opportunity' && values.customerId && !values.agency) values.agency = data.customers.find(c => c.id === values.customerId)?.agency || '';
    if (kind === 'opportunity' && values.status === 'Completed' && !values.completedDate) { $('editor-error').textContent = 'Enter the actual completed date before marking this meeting Completed.'; $('field-completedDate').focus(); return; }
    if (kind === 'engagement' && !M.iso(values.date)) { $('editor-error').textContent = 'Enter a valid engagement date.'; $('field-date').focus(); return; }
    for (const key of ['nextDate', 'targetDate', 'completedDate']) if (values[key] && !M.iso(values[key])) { $('editor-error').textContent = `Enter a valid ${key} date.`; $(`field-${key}`).focus(); return; }
    const collection = { customer: data.customers, engagement: data.engagements, opportunity: data.opportunities }[kind];
    const existing = collection.find(x => x.id === id);
    if (existing) Object.assign(existing, values);
    else { const row = { id: uid(), ...values }; collection.push(row); if (kind === 'customer') selected = row.id; }
    closeEditor(false); changed(`${kind === 'opportunity' ? 'Leadership opportunity' : kind[0].toUpperCase() + kind.slice(1)} saved locally.`);
    requestAnimationFrame(() => (returnFocus?.isConnected ? returnFocus : kind === 'opportunity' ? $('add-opportunity') : kind === 'customer' ? $('add-customer') : $('add-engagement'))?.focus());
  }
  function deleteRecord(kind, id) {
    const collection = { customer: data.customers, engagement: data.engagements, opportunity: data.opportunities }[kind];
    const row = collection.find(x => x.id === id); if (!row) return;
    const related = kind === 'customer' ? data.engagements.filter(e => e.customerId === id).length + data.opportunities.filter(o => o.customerId === id).length : 0;
    if (!confirm(`Delete this ${kind}${related ? ` and ${related} linked record(s)` : ''}? This cannot be undone unless you restore a backup.`)) return;
    collection.splice(collection.indexOf(row), 1);
    if (kind === 'customer') { data.engagements = data.engagements.filter(e => e.customerId !== id); data.opportunities = data.opportunities.filter(o => o.customerId !== id); selected = ''; }
    if (kind === 'engagement') for (const o of data.opportunities) if (o.linkedEngagementId === id) o.linkedEngagementId = '';
    changed(`${kind} deleted.`);
  }
  function recordOpportunity(id) {
    const o = data.opportunities.find(row => row.id === id); if (!o || o.linkedEngagementId) return;
    if (!o.customerId || !data.customers.some(c => c.id === o.customerId)) { message('Link this opportunity to an existing customer before recording it in history.', true); return; }
    if (o.status !== 'Completed' || !M.iso(o.completedDate)) { message('Set Completed and enter the actual completed date first.', true); return; }
    const engagement = { id: uid(), customerId: o.customerId, date: o.completedDate, type: 'Meeting', purpose: 'Other', status: 'Completed', nextDate: '', notes: `Leadership meeting purpose: ${o.purpose}` };
    data.engagements.push(engagement); o.linkedEngagementId = engagement.id; selected = o.customerId; changed('Leadership meeting recorded once in customer history.');
  }
  const customerHeaders = ['customer_key', 'agency', 'program', 'contact', 'contact_title', 'contact_level', 'representative', 'cadence', 'notes'];
  const engagementHeaders = ['engagement_key', 'customer_key', 'date', 'type', 'purpose', 'status', 'next_date', 'notes'];
  const opportunityHeaders = ['opportunity_key', 'customer_key', 'agency', 'contact', 'position', 'representative', 'purpose', 'priority', 'target_date', 'completed_date', 'status', 'notes'];
  function download(name, contents, mime) { const blob = new Blob([contents], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportCsv(kind) {
    const rows = kind === 'customers' ? data.customers.map(c => ({ customer_key: c.id, agency: c.agency, program: c.program, contact: c.contact, contact_title: c.contactTitle, contact_level: c.contactLevel, representative: c.representative, cadence: c.cadence, notes: c.notes })) : kind === 'engagements' ? data.engagements.map(e => ({ engagement_key: e.id, customer_key: e.customerId, date: e.date, type: e.type, purpose: e.purpose, status: e.status, next_date: e.nextDate, notes: e.notes })) : data.opportunities.map(o => ({ opportunity_key: o.id, customer_key: o.customerId, agency: o.agency, contact: o.contact, position: o.position, representative: o.representative, purpose: o.purpose, priority: o.priority, target_date: o.targetDate, completed_date: o.completedDate, status: o.status, notes: o.notes }));
    download(`${kind}.csv`, M.csv(rows, kind === 'customers' ? customerHeaders : kind === 'engagements' ? engagementHeaders : opportunityHeaders), 'text/csv;charset=utf-8');
  }
  function importCsv(kind, text) {
    const rows = M.parseCsv(text), headers = kind === 'customers' ? customerHeaders : engagementHeaders;
    const first = rows[0] || {}; if (!headers.every(h => h in first)) throw Error(`CSV must contain: ${headers.join(', ')}.`);
    if (rows.length > 10000) throw Error('CSV exceeds 10,000 rows.');
    const next = structuredClone(data), used = new Set([...next.customers, ...next.engagements, ...next.opportunities].map(x => x.id));
    for (const row of rows) {
      const id = row[kind === 'customers' ? 'customer_key' : 'engagement_key'] || uid();
      if (used.has(id)) throw Error(`Duplicate key: ${id}. Import only new rows.`);
      used.add(id);
      if (kind === 'customers') {
        if (!row.agency || !row.representative || !lists.cadence.includes(row.cadence || 'As Needed') || (row.contact_level && !lists.contactLevel.includes(row.contact_level))) throw Error('Each customer needs an agency, representative, and valid cadence and contact level.');
        next.customers.push({ id, agency: row.agency, program: row.program, contact: row.contact, contactTitle: row.contact_title, contactLevel: row.contact_level, representative: row.representative, cadence: row.cadence || 'As Needed', notes: row.notes });
      } else {
        if (!next.customers.some(c => c.id === row.customer_key)) throw Error(`Unknown customer key: ${row.customer_key}. Import customers first.`);
        if (!M.iso(row.date) || (row.next_date && !M.iso(row.next_date)) || !lists.engagementStatus.includes(row.status) || !lists.type.includes(row.type) || !lists.purpose.includes(row.purpose)) throw Error('Each engagement needs valid dates, type, purpose, and status.');
        next.engagements.push({ id, customerId: row.customer_key, date: row.date, type: row.type, purpose: row.purpose, status: row.status, nextDate: row.next_date, notes: row.notes });
      }
    }
    data = M.validate(next); changed(`${rows.length} ${rows.length === 1 ? kind.slice(0, -1) : kind} imported locally.`);
  }
  function chooseFile(mode) { fileMode = mode; $('import-message').textContent = ''; $('import-message').classList.remove('error'); $('file-input').accept = mode === 'json' ? '.json,application/json' : '.csv,text/csv'; $('file-input').click(); }
  async function readFile(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('File exceeds the 5 MB limit.');
      const text = await file.text();
      if (fileMode === 'json') { const restored = M.validate(JSON.parse(text)); if (!confirm('Replace all current customers, engagements, and opportunities with this backup? Export a backup first if needed.')) return; data = restored; selected = ''; changed('JSON backup restored locally.'); }
      else importCsv(fileMode, text);
      $('import-message').textContent = 'Import completed locally.';
    } catch (error) { $('import-message').textContent = `Import rejected: ${error.message}`; $('import-message').classList.add('error'); $('import-message').focus(); message(`Import rejected: ${error.message}`, true); }
  }
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]'); if (!action) return;
    const id = action.dataset.id, type = action.dataset.action;
    if (type === 'select-customer') { selected = id; render(); $('customer-detail').scrollIntoView({ behavior: 'smooth' }); }
    else if (type.startsWith('edit-')) openEditor(type.slice(5), id);
    else if (type.startsWith('delete-')) deleteRecord(type.slice(7), id);
    else if (type === 'add-engagement') openEditor('engagement', '', { customerId: id });
    else if (type === 'add-opportunity') openEditor('opportunity', '', { customerId: id, agency: data.customers.find(c => c.id === id)?.agency || '' });
    else if (type === 'record-opportunity') recordOpportunity(id);
  });
  for (const id of ['search', 'filter-agency', 'filter-rep', 'filter-status', 'filter-from', 'filter-to', 'report-from', 'report-to']) $(id).addEventListener('input', render);
  $('add-customer').onclick = () => openEditor('customer');
  $('add-engagement').onclick = () => openEditor('engagement');
  $('add-opportunity').onclick = () => openEditor('opportunity');
  $('editor-form').addEventListener('submit', saveEditor);
  $('cancel-editor').onclick = closeEditor;
  $('editor').addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
  $('print-report').onclick = () => { if ($('report-from').value && $('report-to').value && $('report-from').value > $('report-to').value) { message('Report start date must be on or before the end date.', true); $('report-from').focus(); return; } report(); window.print(); };
  $('customer-template').onclick = () => download('customers-template.csv', M.csv([], customerHeaders), 'text/csv;charset=utf-8');
  $('engagement-template').onclick = () => download('engagements-template.csv', M.csv([], engagementHeaders), 'text/csv;charset=utf-8');
  for (const kind of ['customers', 'engagements', 'opportunities']) $(`export-${kind}`).onclick = () => exportCsv(kind);
  $('export-json').onclick = () => download('engagement-planner-backup.json', JSON.stringify(data, null, 2) + '\n', 'application/json');
  $('import-customers').onclick = () => chooseFile('customers');
  $('import-engagements').onclick = () => chooseFile('engagements');
  $('restore-json').onclick = () => chooseFile('json');
  $('file-input').addEventListener('change', readFile);
  window.addEventListener('hashchange', tab);
  load().then(saved => { data = M.validate(saved); render(); message('Local planner ready.'); }).catch(() => { render(); message('IndexedDB is unavailable. Entries will not persist; export a JSON backup.', true); });
})();
