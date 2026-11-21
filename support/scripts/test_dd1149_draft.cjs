const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../apps/dd1149-generator/app.js'), 'utf8');
const setup = source.slice(0, source.indexOf('const propertyRows')) +
  source.slice(source.indexOf('const escapeHtml'), source.indexOf('function authorityPurposeText()'));
const load = source.slice(source.indexOf('function loadDraft(file) {'), source.indexOf('document.getElementById("addProperty")'));
assert.ok(setup.includes('createDefaultState') && load.includes('function loadDraft'));

const notices = [];
let allowReplace = false;
class FileReader {
  readAsText(file) { this.result = file.contents; this.onload(); }
}
const context = vm.createContext({
  FileReader,
  window: { confirm: () => allowReplace },
  showNotice: (message, error = false) => notices.push({ message, error }),
  syncStateInputs() {}, renderPropertyRows() {}, renderPreview() {},
});
vm.runInContext(setup + load, context, { filename: 'dd1149-draft.js' });
const getState = () => vm.runInContext('JSON.parse(JSON.stringify(state))', context);
const importDraft = (data, size) => {
  context.file = { size, contents: JSON.stringify(data) };
  vm.runInContext('loadDraft(file)', context);
};
const draft = { shipment: { from: 'Example shipper' }, property: [{ description: 'Sample item', quantity: '2', uom: 'EA' }] };

vm.runInContext('state.shipment.from = "Existing entry"', context);
importDraft(draft, 200);
assert.equal(getState().shipment.from, 'Existing entry', 'cancel must preserve entered work');
assert.match(notices.at(-1).message, /canceled/i);

allowReplace = true;
importDraft(draft, 2_000_001);
assert.equal(getState().shipment.from, 'Existing entry', 'oversized file must be rejected');
assert.equal(notices.at(-1).error, true);

importDraft({ ...draft, property: Array(501).fill({}) }, 20_000);
assert.equal(getState().shipment.from, 'Existing entry', 'excessive item count must be rejected');

importDraft({ ...draft, shipment: { from: 'x'.repeat(20_001) } }, 21_000);
assert.equal(getState().shipment.from, 'Existing entry', 'oversized fields must be rejected');

importDraft(draft, 200);
assert.equal(getState().shipment.from, 'Example shipper');
assert.equal(getState().property[0].description, 'Sample item');
console.log('DD1149 draft import limits and replacement confirmation passed');
