(function (root) {
  'use strict';
  const cadences = { Monthly: 1, Quarterly: 3, Semiannual: 6, Annual: 12 };
  const blank = () => ({ schema: 1, customers: [], engagements: [], opportunities: [] });
  function iso(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : '';
  }
  const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };
  function addMonths(date, months) {
    if (!iso(date)) return '';
    const [year, month, day] = date.split('-').map(Number);
    const target = new Date(year, month - 1 + months, 1, 12);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, last));
    return [target.getFullYear(), String(target.getMonth() + 1).padStart(2, '0'), String(target.getDate()).padStart(2, '0')].join('-');
  }
  const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
  function customerFacts(data, customer, on = today()) {
    const history = data.engagements.filter(e => e.customerId === customer.id).sort(byDate);
    const completed = history.filter(e => e.status === 'Completed' && iso(e.date));
    const latest = history.filter(e => e.status !== 'Planned').at(-1);
    const last = completed.at(-1)?.date || '';
    const cadenceDue = cadences[customer.cadence] && last ? addMonths(last, cadences[customer.cadence]) : '';
    const cadenceOverdue = !!cadenceDue && cadenceDue < on;
    const planned = history.filter(e => e.status === 'Planned' && iso(e.date));
    const upcoming = planned.filter(e => e.date >= on).sort(byDate);
    const pastPlanned = planned.filter(e => e.date < on);
    const latestFollowUp = latest?.nextDate && iso(latest.nextDate) ? latest.nextDate : '';
    const followUpOverdue = pastPlanned.length > 0 || (!!latestFollowUp && latestFollowUp < on);
    const next = [upcoming[0]?.date, latestFollowUp && latestFollowUp >= on ? latestFollowUp : ''].filter(Boolean).sort()[0] || '';
    return { history, last, cadenceDue, cadenceOverdue, followUpOverdue, next, needsAttention: cadenceOverdue || followUpOverdue || !next };
  }
  function summary(data, on = today(), from = '', to = '') {
    const within = date => !!iso(date) && (!from || date >= from) && (!to || date <= to);
    const facts = data.customers.map(c => ({ customer: c, ...customerFacts(data, c, on) }));
    const completed = data.engagements.filter(e => e.status === 'Completed' && within(e.date));
    const upcoming = data.engagements.filter(e => e.status === 'Planned' && e.date >= on && within(e.date));
    const overdue = facts.filter(f => f.followUpOverdue);
    const opportunities = data.opportunities.filter(o => o.status !== 'Declined');
    return { facts, totalCustomers: data.customers.length, completed: completed.length, upcoming: upcoming.length, overdue: overdue.length, opportunities: opportunities.length };
  }
  function reportOpportunities(data, from = '', to = '') {
    return data.opportunities.filter(opportunity => {
      const date = opportunity.status === 'Completed' && opportunity.completedDate ? opportunity.completedDate : opportunity.targetDate;
      return opportunity.status !== 'Declined' && (!from || !date || date >= from) && (!to || !date || date <= to);
    });
  }
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', quoted = false;
    text = String(text).replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); if (row.some(v => v !== '')) rows.push(row);
        row = []; cell = '';
      } else cell += ch;
    }
    if (quoted) throw Error('CSV has an unclosed quoted field.');
    row.push(cell); if (row.some(v => v !== '')) rows.push(row);
    if (!rows.length) throw Error('CSV is empty.');
    const headers = rows.shift().map(v => v.trim());
    if (new Set(headers).size !== headers.length) throw Error('CSV has duplicate columns.');
    return rows.map((values, index) => {
      if (values.length !== headers.length) throw Error(`CSV row ${index + 2} has the wrong number of columns.`);
      return Object.fromEntries(headers.map((key, i) => [key, values[i].trim()]));
    });
  }
  function csv(rows, headers) {
    // A leading tab keeps spreadsheet programs from evaluating user-entered formulas.
    // parseCsv trims that tab when a planner CSV is imported again.
    const quote = value => { const raw = String(value ?? ''); const safe = /^[\s]*[=+@-]/.test(raw) ? '\t' + raw : raw; return '"' + safe.replaceAll('"', '""') + '"'; };
    return [headers.map(quote).join(','), ...rows.map(row => headers.map(key => quote(row[key])).join(','))].join('\r\n') + '\r\n';
  }
  function validate(data) {
    if (!data || data.schema !== 1 || !Array.isArray(data.customers) || !Array.isArray(data.engagements) || !Array.isArray(data.opportunities)) throw Error('Unsupported planner backup.');
    if (data.customers.length > 10000 || data.engagements.length > 50000 || data.opportunities.length > 10000) throw Error('Backup exceeds record limits.');
    const ids = new Set();
    for (const [type, records] of [['customer', data.customers], ['engagement', data.engagements], ['opportunity', data.opportunities]]) {
      for (const row of records) {
        if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw Error(`Invalid or duplicate ${type} ID.`);
        ids.add(row.id);
        for (const value of Object.values(row)) if (typeof value !== 'string') throw Error(`Invalid ${type} field.`);
      }
    }
    const customers = new Set(data.customers.map(c => c.id));
    const allowed = (value, options) => !value || options.includes(value);
    if (data.customers.some(c => !allowed(c.cadence, ['Monthly', 'Quarterly', 'Semiannual', 'Annual', 'As Needed']) || !allowed(c.contactLevel, ['CO/CS', 'COR', 'Program Management', 'Agency Leadership', 'Other']))) throw Error('Invalid customer cadence or contact level in backup.');
    if (data.engagements.some(e => !allowed(e.type, ['Meeting', 'Call', 'Email', 'Site Visit', 'Other']) || !allowed(e.purpose, ['Relationship Building', 'Contract Review', 'Strategic Discussion', 'Issue Resolution', 'Other']) || !allowed(e.status, ['Planned', 'Completed', 'Follow-Up Needed']))) throw Error('Invalid engagement type, purpose, or status in backup.');
    if (data.opportunities.some(o => !allowed(o.representative, ['Director', 'VP', 'Executive', 'Other']) || !allowed(o.priority, ['High', 'Medium', 'Low']) || !allowed(o.status, ['Identified', 'Proposed', 'Requested', 'Scheduled', 'Completed', 'Declined']))) throw Error('Invalid leadership opportunity choice in backup.');
    if (data.engagements.some(e => !customers.has(e.customerId))) throw Error('An engagement refers to a missing customer.');
    if (data.opportunities.some(o => o.customerId && !customers.has(o.customerId))) throw Error('A leadership opportunity refers to a missing customer.');
    for (const row of [...data.engagements, ...data.opportunities]) for (const key of ['date', 'nextDate', 'targetDate', 'completedDate']) if (row[key] && !iso(row[key])) throw Error(`Invalid ${key} in backup.`);
    const linked = new Set();
    for (const opportunity of data.opportunities) if (opportunity.linkedEngagementId) {
      const engagement = data.engagements.find(e => e.id === opportunity.linkedEngagementId);
      if (!engagement || engagement.customerId !== opportunity.customerId || linked.has(engagement.id)) throw Error('Invalid or duplicate leadership history link.');
      linked.add(engagement.id);
    }
    return structuredClone(data);
  }
  const api = { blank, today, iso, addMonths, customerFacts, summary, reportOpportunities, parseCsv, csv, validate };
  root.PlannerModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
