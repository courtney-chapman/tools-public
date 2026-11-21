const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../../apps/consent-to-subcontract/index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0].replace(/init\(\);\s*$/, '');
const cases = String.raw`
function filled() {
  record = blank();
  Object.assign(record.primeContract, {
    primeName: 'Example Prime', contractNumber: 'X-1', agency: 'Example Agency',
    primeType: 'fixed', actionPricing: 'unpriced', purchasingSystem: 'approved',
    acquisitionContext: 'other', clauseName: 'FAR 52.244-2',
    clauseReference: 'Section I', contractingOfficer: 'Example CO'
  });
  Object.assign(record.consentApplicability, {
    assessment: 'required', designated: 'yes', clauseCondition: 'yes',
    paragraphJ: 'no', advanceNotice: 'no', rationale: 'Incorporated clause designation'
  });
  Object.assign(record.subcontract, {
    supplierName: 'Example Supplier', scope: 'Supply widgets', type: 'ffp', value: 'USD 100'
  });
  Object.assign(record.supplierSelection, { basis: 'competitive', rationale: 'Best evaluated offer' });
  Object.assign(record.pricing, {
    proposedPrice: 'USD 100', analysisMethod: 'price', analysisSummary: 'Comparable offers',
    certifiedData: 'notRequired', cas: 'notRequired'
  });
  for (const doc of DOCUMENTS) {
    if (['Required', 'Conditional'].includes(classify(doc))) {
      const row = record.supportingDocuments.find(item => item.id === doc.id);
      row.status = 'available'; row.reference = 'REF-' + doc.id;
    }
  }
}

filled();
assert.equal(checks().status, 'submission');
record.primeContract.agency = '';
assert.equal(checks().status, 'draft');
filled(); record.primeContract.actionPricing = '';
assert.equal(checks().status, 'procurement');
filled(); record.subcontract.value = 'USD 200';
assert.match(checks().review.join(' '), /Reconcile proposed subcontract value/);
filled(); record.primeContract.acquisitionContext = 'part12';
assert.equal(checks().status, 'procurement');
filled(); record.consentApplicability.paragraphJ = 'yes';
assert.equal(checks().status, 'procurement');

filled(); record.supplierSelection.basis = 'noncompetitive';
const justification = DOCUMENTS.find(doc => doc.id === 'noncompetitive');
assert.equal(classify(justification), 'Requires review');
assert.match(checks().review.join(' '), /written noncompetitive justification/);
record.supplierSelection.justificationApplicability = 'required';
assert.equal(classify(justification), 'Conditional');
record.supplierSelection.justificationApplicability = 'notRequired';
assert.equal(classify(justification), 'Recommended');

filled(); record.primeContract.contractProvisions = 'Section I special condition';
const contractItem = DOCUMENTS.find(doc => doc.id === 'contractSpecific');
assert.equal(classify(contractItem), 'Requires review');
assert.match(checks().review.join(' '), /additional supporting item/);
record.primeContract.additionalSupportingItem = 'yes';
assert.equal(classify(contractItem), 'Conditional');
assert.match(checks().support.join(' '), /Contract-specific supporting item/);
record.primeContract.additionalSupportingItem = 'no';
assert.equal(classify(contractItem), 'Not applicable');
assert.doesNotMatch(checks().support.join(' '), /Contract-specific supporting item/);
assert.equal(showWhen('hasProvisions'), true);
record.primeContract.contractProvisions = '';
assert.equal(showWhen('hasProvisions'), false);

filled();
const memo = DOCUMENTS.find(doc => doc.id === 'negotiationMemo');
const memoRow = record.supportingDocuments.find(item => item.id === memo.id);
assert.equal(needsDocumentAttention(memo), false);
memoRow.reference = '';
assert.equal(needsDocumentAttention(memo), true);
memoRow.status = 'pending';
assert.equal(needsDocumentAttention(memo), true);

const fakeRows = DOCUMENTS.map(doc => ({ dataset: { docRow: doc.id }, hidden: false }));
const filterNodes = {
  'doc-filter': { textContent: '', setAttribute(name, value) { this[name] = value; } },
  'doc-filter-count': { textContent: '' },
  'doc-header': { hidden: false },
  'doc-empty': { hidden: true },
  'doc-table': { querySelectorAll: () => fakeRows }
};
document.getElementById = id => filterNodes[id];
documentFilter = 'attention'; updateDocumentFilter();
assert.equal(fakeRows.filter(row => !row.hidden).length, 1);
assert.match(filterNodes['doc-filter-count'].textContent, /^1 need attention/);
documentFilter = 'all'; updateDocumentFilter();
assert.equal(fakeRows.filter(row => !row.hidden).length, DOCUMENTS.length);

function element(tagName) {
  return {
    tagName: tagName.toUpperCase(), children: [], dataset: {}, style: {}, hidden: false,
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = [...items]; },
    setAttribute(name, value) { this[name] = value; },
    querySelectorAll(selector) {
      const descendants = this.children.flatMap(child => [child, ...(child.querySelectorAll?.('*') || [])]);
      return selector === '[data-doc-row]' ? descendants.filter(child => child.dataset?.docRow) : descendants;
    }
  };
}
const tableRoot = element('div');
document.createElement = element;
document.getElementById = id => {
  if (id === 'doc-table') return tableRoot;
  if (filterNodes[id] && id !== 'doc-header' && id !== 'doc-empty') return filterNodes[id];
  return tableRoot.querySelectorAll('*').find(child => child.id === id);
};
filled(); documentFilter = 'attention'; renderDocuments();
const table = tableRoot.children[0];
assert.equal(table.tagName, 'TABLE');
assert.equal(table.children[1].tagName, 'THEAD');
assert.equal(table.children[2].tagName, 'TBODY');
assert.equal(table.children[2].children.length, DOCUMENTS.length);
assert.equal(table.children[2].children[0].children[0].scope, 'row');
assert.equal(table.children[2].children[0].children[2].children[0].tagName, 'SELECT');
assert.equal(tableRoot.querySelectorAll('[data-doc-row]').filter(row => !row.hidden).length, 0);

record = blank();
const packageChecklist = checklist();
const documentSection = packageChecklist.sections.find(section => section.heading === 'Supporting documents');
assert.equal(documentSection.table.headers.length, 4);
assert.equal(documentSection.table.bases.length, documentSection.table.rows.length);
const missingSection = packageChecklist.sections.find(section => section.heading === 'Missing required information');
assert.ok(missingSection.items.length > 0);
assert.equal(missingSection.paragraphs.length, 0);
assert.match(documentText(packageChecklist), /• Prime contractor name/);
assert.match(documentText(packageChecklist), /Noncompetitive justification — DFARS/);
const outputRoot = element('div');
document.getElementById = id => id === 'output-preview' ? outputRoot : undefined;
renderDocument(packageChecklist);
assert.equal(outputRoot.className, 'paper checklist-paper');
const checklistTable = outputRoot.children.find(child => child.className === 'checklist-table');
assert.equal(checklistTable.children[1].children[0].children.length, 4);
assert.equal(checklistTable.children[1].children[0].children[1].children[0]['aria-label'], 'Requires review');
assert.ok(outputRoot.children.some(child => child.className === 'issue-list missing-list'));

const copyButton = { textContent: '' };
document.getElementById = id => id === 'copy-current' ? copyButton : undefined;
output = 'record'; updateCopyLabel();
assert.equal(copyButton.textContent, 'Copy Applicability Record');
output = 'request'; updateCopyLabel();
assert.equal(copyButton.textContent, 'Copy Consent Request');

const outputChoices = element('div');
const requestUnavailable = element('div');
const requestUnavailableText = element('span');
document.createTextNode = text => ({ textContent: text });
document.getElementById = id => ({
  'copy-current': copyButton, 'output-choices': outputChoices,
  'request-unavailable': requestUnavailable,
  'request-unavailable-text': requestUnavailableText
})[id];
renderDocument = () => {};
filled(); record.consentApplicability.assessment = 'review'; output = 'request'; renderOutputs();
assert.equal(output, 'record');
assert.equal(outputChoices.children[0].children[0].disabled, true);
assert.equal(requestUnavailable.hidden, false);
assert.match(requestUnavailableText.textContent, /requires review/);
record.consentApplicability.assessment = 'required'; renderOutputs();
assert.equal(outputChoices.children[0].children[0].disabled, false);
assert.equal(requestUnavailable.hidden, true);
record.consentApplicability.assessment = 'notRequired'; renderOutputs();
assert.match(requestUnavailableText.textContent, /Consent not required/);

filled(); record.consentApplicability.assessment = 'notRequired'; output = 'request';
assert.equal(currentDocument().title, 'Consent Applicability Record');
record.consentApplicability.assessment = 'review';
assert.equal(currentDocument().title, 'Consent Applicability Review Worksheet');
const worksheet = applicabilityRecord();
assert.equal(worksheet.sections[0].table.rows[0][1], 'Applicability requires review');
assert.equal(worksheet.sections[1].table.rows[0][1], 'Example Prime');
assert.equal(worksheet.sections[2].table.rows[2][1], 'Firm-fixed-price');
assert.equal(worksheet.sections[3].table.rows[0][1], 'Yes');
assert.equal(worksheet.sections[1].table.rows[5][1], '—');
assert.ok(worksheet.sections.some(section => section.heading === 'Items for Procurement review' && section.items.length));
assert.match(documentText(worksheet), /Field \| Recorded value/);

const routeNodes = { steps: { querySelector: () => ({ setAttribute() {}, removeAttribute() {} }) } };
for (const [name] of STEPS) {
  routeNodes[name + '-step'] = { hidden: true };
  routeNodes[name + '-heading'] = { focus() {} };
}
for (const name of ['readiness', 'documents', 'output']) {
  routeNodes['package-' + name + '-view'] = { hidden: true };
  routeNodes['package-' + name + '-heading'] = { focus() {} };
}
document.getElementById = id => routeNodes[id];
document.querySelector = () => ({ setAttribute() {}, removeAttribute() {} });
renderPackage = () => {};
navigate('package/documents', false);
assert.equal(location.hash, '#package/documents');
assert.equal(routeNodes['package-documents-view'].hidden, false);
assert.equal(routeNodes['package-output-view'].hidden, true);
navigate('package/output', false);
assert.equal(location.hash, '#package/output');
assert.equal(routeNodes['package-output-view'].hidden, false);
location.hash = '#package';
navigate('package', false);
assert.equal(location.hash, '#package/readiness');
assert.equal(routeNodes['package-readiness-view'].hidden, false);
routeNodes['prime-contract-section'] = { open: true };
routeNodes['applicability-section'] = {
  open: false, querySelector: () => ({ focus() {}, scrollIntoView() {} })
};
showAssessment();
assert.equal(location.hash, '#prime');
assert.equal(routeNodes['prime-contract-section'].open, false);
assert.equal(routeNodes['applicability-section'].open, true);

filled();
const current = JSON.parse(JSON.stringify(record));
assert.deepEqual(validateImport(current), current);
const old = JSON.parse(JSON.stringify(current));
delete old.supplierSelection.justificationApplicability;
delete old.primeContract.additionalSupportingItem;
old.schemaVersion = '1.0';
const migrated = validateImport(old);
assert.equal(migrated.schemaVersion, '1.2');
assert.equal(migrated.supplierSelection.justificationApplicability, 'unknown');
assert.equal(migrated.primeContract.additionalSupportingItem, 'unknown');
assert.equal(migrated.primeContract.contractNumber, 'X-1');
const previous = JSON.parse(JSON.stringify(current));
delete previous.primeContract.additionalSupportingItem;
previous.schemaVersion = '1.1';
assert.equal(validateImport(previous).primeContract.additionalSupportingItem, 'unknown');
assert.throws(() => validateImport({ ...current, unexpected: 'x' }));
console.log('Consent builder regression checks passed');
`;

const location = { hash: '' };
const history = {
  pushState(_state, _title, hash) { location.hash = hash; },
  replaceState(_state, _title, hash) { location.hash = hash; }
};
vm.runInNewContext(script + '\n' + cases, {
  assert, console, document: { getElementById: () => undefined }, location, history,
  window: { scrollTo() {} }
});
