const assert = require('node:assert/strict');
const M = require('../../apps/government-customer-engagement-planner/model.js');

assert.equal(M.addMonths('2026-01-31', 1), '2026-02-28');
assert.equal(M.addMonths('2024-01-31', 1), '2024-02-29');
assert.equal(M.addMonths('2026-11-10', 3), '2027-02-10');
assert.equal(M.iso('2026-02-30'), '');
const data = M.blank();
data.customers.push({ id: 'a', agency: 'Agency A', cadence: 'Monthly' }, { id: 'b', agency: 'Agency B', cadence: 'As Needed' });
data.engagements.push(
  { id: 'one', customerId: 'a', date: '2026-10-10', status: 'Completed', nextDate: '2026-11-20' },
  { id: 'two', customerId: 'a', date: '2026-12-10', status: 'Planned', nextDate: '' },
  { id: 'three', customerId: 'b', date: '2026-11-10', status: 'Completed', nextDate: '' }
);
const facts = M.customerFacts(data, data.customers[0], '2026-11-21');
assert.equal(facts.last, '2026-10-10');
assert.equal(facts.cadenceDue, '2026-11-10');
assert.equal(facts.cadenceOverdue, true);
assert.equal(facts.next, '2026-12-10');
assert.equal(M.customerFacts(data, data.customers[1], '2026-11-21').cadenceOverdue, false);
const summary = M.summary(data, '2026-11-21');
assert.equal(summary.totalCustomers, 2);
assert.equal(summary.completed, 2);
assert.equal(summary.upcoming, 1);
assert.equal(summary.overdue, 1);
assert.equal(M.summary(data, '2026-11-21', '2026-11-01', '2026-11-30').completed, 1);
const reportData = { opportunities: [
  { id: 'completed', status: 'Completed', targetDate: '2026-12-15', completedDate: '2026-11-15' },
  { id: 'proposed', status: 'Proposed', targetDate: '2026-12-15' },
  { id: 'undated', status: 'Identified', targetDate: '' },
  { id: 'declined', status: 'Declined', targetDate: '2026-11-15' }
] };
assert.deepEqual(M.reportOpportunities(reportData, '2026-11-10', '2026-11-30').map(o => o.id), ['completed', 'undated']);
const rows = [{ agency: 'Agency, A', notes: 'Line one\n"quoted"' }];
assert.deepEqual(M.parseCsv(M.csv(rows, ['agency', 'notes'])), rows);
const formula = [{ agency: '=HYPERLINK("https://example.invalid")', notes: '  +1+1' }];
const safeCsv = M.csv(formula, ['agency', 'notes']);
assert.match(safeCsv, /"\t=HYPERLINK/);
assert.match(safeCsv, /"\t  \+1\+1"/);
assert.deepEqual(M.parseCsv(safeCsv), [{ agency: formula[0].agency, notes: '+1+1' }]);
assert.throws(() => M.parseCsv('a,b\n"broken,b'), /unclosed/);
assert.throws(() => M.validate({ ...data, engagements: [{ id: 'x', customerId: 'missing' }] }), /missing customer/);
assert.throws(() => M.validate({ ...data, opportunities: [{ id: 'bad-link', customerId: 'a', linkedEngagementId: 'missing' }] }), /history link/);
assert.throws(() => M.validate({ ...data, engagements: [{ id: 'bad-date', customerId: 'a', date: '2026-02-30' }] }), /Invalid date/);
assert.throws(() => M.validate({ ...data, engagements: [{ id: 'bad-status', customerId: 'a', status: 'Approved' }] }), /Invalid engagement/);
assert.deepEqual(M.validate(data), data);
console.log('Planner model checks passed.');
