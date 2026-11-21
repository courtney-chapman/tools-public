const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bundle = fs.readFileSync(path.join(__dirname, '../../apps/weighted-guidelines-calculator/app.bundle.js'), 'utf8');
const engine = bundle.split('// Source: js/app.mjs')[0];
assert.match(bundle, /const D = Decimal;/);
assert.equal(vm.runInNewContext(`${engine}\nD.parse('4.25').fixed(2)`), '4.25');
const sample = {
  framework: 'dod-2026-O0048-rev1', frameworkConfirmed: true,
  negotiated: 'yes', certifiedData: 'yes', organization: 'for-profit', approach: 'standard',
  contractType: 'ffp-none', b20: '1000000', costBasis: 'Fictional verified cost base.',
  technicalWeight: '60', managementWeight: '40', technicalMode: 'standard',
  technicalValue: '5', managementValue: '4', performanceRationale: 'Fictional selected value.',
  incurredCost: '0', costToComplete: '1000000', riskIncurred: '5', riskToComplete: '5',
  capitalStatus: 'provided', capitalBasis: 'Fictional capital allocation.',
  landCapital: '0', buildingCapital: '0', equipmentCapital: '100000',
  buildingCapitalAdjustment: '0', equipmentCapitalAdjustment: '0', equipmentValue: '17.5',
  efficiencyStatus: 'assessed', efficiencyValue: '1', efficiencyRationale: 'Fictional cost reduction.'
};
const result = vm.runInNewContext(`${engine}\ncalculate(input)`, { input: sample, structuredClone });
assert.equal(result.status, 'complete', JSON.stringify(result.errors));
assert.equal(result.blocks['30'].wholeDollars, '123500');
console.log('Weighted Guidelines Calculator bundle test passed.');
