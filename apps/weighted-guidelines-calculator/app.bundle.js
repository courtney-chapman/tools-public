'use strict';

// Source: config/regulatory-framework.mjs
const FRAMEWORK = Object.freeze({
  id: 'dod-2026-O0048-rev1',
  title: 'DoD Class Deviation 2026-O0048, Revision 1',
  effective: '2026-07-22',
  verified: '2026-11-20',
  dfars: 'https://www.acq.osd.mil/dpap/dars/classdev/DFARS_RFO/Part-215/2026-O0048_Rev_1_TAB_A1_DFARS_215.docx',
  pgi: 'https://www.acq.osd.mil/dpap/dars/classdev/DFARS_RFO/Part-215/2026-O0048_Rev_1_TAB_A2_PGI_215.docx',
  treasury: 'https://fiscal.treasury.gov/payments-from-government/prompt-payment/rates'
});

const CONTRACT_TYPES = Object.freeze({
  'ffp-none': { label: 'Firm-fixed-price · no financing', normal: '5', min: '4', max: '6' },
  'ffp-pbp': { label: 'Firm-fixed-price · performance-based payments', normal: '4', min: '2.5', max: '5.5' },
  'ffp-progress': { label: 'Firm-fixed-price · progress payments', normal: '3', min: '2', max: '4', progress: true },
  'fpi-none': { label: 'Fixed-price incentive · no financing', normal: '3', min: '2', max: '4' },
  'fpi-pbp': { label: 'Fixed-price incentive · performance-based payments', normal: '2', min: '0.5', max: '3.5' },
  'fpi-progress': { label: 'Fixed-price incentive · progress payments', normal: '1', min: '0', max: '2', progress: true },
  'cpif': { label: 'Cost-plus-incentive-fee', normal: '1', min: '0', max: '2' },
  'cpff': { label: 'Cost-plus-fixed-fee', normal: '0.5', min: '0', max: '1' },
  'tm': { label: 'Time-and-materials', normal: '0.5', min: '0', max: '1' },
  'labor-hour': { label: 'Labor-hour', normal: '0.5', min: '0', max: '1' },
  'ffp-loe': { label: 'Firm-fixed-price level-of-effort', normal: '0.5', min: '0', max: '1' }
});

const LENGTH_FACTORS = Object.freeze([
  [21, '0.40'], [27, '0.65'], [33, '0.90'], [39, '1.15'], [45, '1.40'],
  [51, '1.65'], [57, '1.90'], [63, '2.15'], [69, '2.40'], [75, '2.65'], [Infinity, '2.90']
]);


// Source: js/decimal.mjs
// Exact rational arithmetic for finite decimal inputs. No runtime dependency.
const abs = n => n < 0n ? -n : n;
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a || 1n; }

class Decimal {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('Division by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(abs(n), d);
    this.n = n / g; this.d = d / g;
  }
  static parse(value, label = 'Value', maxScale = 6) {
    const s = String(value ?? '').trim();
    const match = /^(-?)(\d{1,15})(?:\.(\d+))?$/.exec(s);
    if (!match || (match[3]?.length || 0) > maxScale) throw new Error(`${label} must be a decimal with at most ${maxScale} places.`);
    const scale = match[3]?.length || 0;
    const digits = BigInt(match[2] + (match[3] || ''));
    return new Decimal(match[1] ? -digits : digits, 10n ** BigInt(scale));
  }
  add(b) { return new Decimal(this.n * b.d + b.n * this.d, this.d * b.d); }
  sub(b) { return new Decimal(this.n * b.d - b.n * this.d, this.d * b.d); }
  mul(b) { return new Decimal(this.n * b.n, this.d * b.d); }
  div(b) { return new Decimal(this.n * b.d, this.d * b.n); }
  cmp(b) { const v = this.n * b.d - b.n * this.d; return v < 0n ? -1 : v > 0n ? 1 : 0; }
  fixed(places = 2) {
    const scale = 10n ** BigInt(places);
    const scaled = abs(this.n) * scale;
    let q = scaled / this.d;
    if ((scaled % this.d) * 2n >= this.d) q++;
    const sign = this.n < 0n ? '-' : '';
    if (!places) return sign + q;
    return sign + (q / scale) + '.' + String(q % scale).padStart(places, '0');
  }
  exact() { return { numerator: String(this.n), denominator: String(this.d) }; }
}

const zero = new Decimal(0n);
const one = new Decimal(1n);
const pct = value => Decimal.parse(value, 'Percentage', 3).div(new Decimal(100n));


// Source: js/engine.mjs

const number = (v, name, places = 2) => D.parse(v, name, places);
const between = (v, lo, hi) => v.cmp(lo) >= 0 && v.cmp(hi) <= 0;
const percent = (v, name) => D.parse(v, name, 3);
const money = (v, name) => { const x = number(v, name); if (x.cmp(zero) < 0) throw new Error(`${name} cannot be negative.`); return x; };
const report = value => ({ raw: value.fixed(6), exact: value.exact(), wholeDollars: value.fixed(0) });
const issue = (field, message) => ({ field, message });

function normalizeFormInput(input) {
  const data = { ...input };
  if (data.capitalStatus === 'zero') {
    for (const name of ['landCapital', 'buildingCapital', 'equipmentCapital', 'buildingCapitalAdjustment', 'equipmentCapitalAdjustment']) data[name] = '0';
    for (const name of ['equipmentValue', 'capitalAdjustmentRationale', 'capitalRationale']) data[name] = '';
  }
  return data;
}

function lengthFactor(months) {
  const text = String(months ?? '').trim();
  const value = Number(text);
  if (!/^\d{1,3}$/.test(text) || value < 1 || value > 600) throw new Error('Substantive performance months must be a whole number from 1 to 600.');
  return D.parse(LENGTH_FACTORS.find(([max]) => value <= max)[1], 'Length factor', 2);
}

function calculatePerformance(input, b20, nonprofit = false) {
  if (!['standard', 'technology'].includes(input.technicalMode)) throw new Error('Select the standard or technology-incentive technical range.');
  const wt = percent(input.technicalWeight, 'Technical weight');
  const wm = percent(input.managementWeight, 'Management weight');
  if (!between(wt, zero, D.parse('100')) || !between(wm, zero, D.parse('100')) || wt.add(wm).cmp(D.parse('100')) !== 0) throw new Error('Technical and management weights must each be 0–100% and total 100%.');
  const tech = percent(input.technicalValue, 'Technical value');
  const management = percent(input.managementValue, 'Management value');
  const technology = input.technicalMode === 'technology';
  if (technology && nonprofit) throw new Error('The technology incentive range is unavailable for the modified nonprofit method.');
  if (technology && input.technologyEligible !== true) throw new Error('Confirm technology incentive eligibility and provide a rationale.');
  if (technology && !String(input.technologyRationale || '').trim()) throw new Error('Technology incentive rationale is required.');
  const minTech = D.parse(technology ? '7' : '3');
  const maxTech = D.parse(technology ? '11' : '7');
  if (!between(tech, minTech, maxTech) || !between(management, D.parse('3'), D.parse('7'))) throw new Error('Performance values are outside the selected permitted ranges.');
  if ((tech.cmp(D.parse(technology ? '9' : '5')) || management.cmp(D.parse('5'))) && !String(input.performanceRationale || '').trim()) throw new Error('Explain performance values that differ from normal.');
  if (input.managementSpecial && !String(input.managementSpecialRationale || '').trim()) throw new Error('Explain the qualifying-proposal management special consideration.');
  const t = wt.div(D.parse('100')).mul(tech.div(D.parse('100')));
  const m = wm.div(D.parse('100')).mul(management.div(D.parse('100')));
  const composite = t.add(m);
  const gross = b20.mul(composite);
  const reduction = nonprofit ? b20.mul(pct('1')) : zero;
  return { technicalContributionPct: t.mul(D.parse('100')).fixed(6), managementContributionPct: m.mul(D.parse('100')).fixed(6), compositePct: composite.mul(D.parse('100')).fixed(6), gross: report(gross), nonprofitReduction: report(reduction), block23: gross.sub(reduction), citation: 'PGI 215.404-971(b)(2)–(5); nonprofit: 215.404-972(b)(1),(c)' };
}

function calculateContractRisk(input, b20, nonprofit = false) {
  const category = CONTRACT_TYPES[input.contractType];
  if (!category) throw new Error('Select a supported contract and financing category.');
  const incurred = money(input.incurredCost, 'Incurred-cost base');
  const toComplete = money(input.costToComplete, 'Cost-to-complete base');
  if (incurred.add(toComplete).cmp(b20) !== 0) throw new Error('Incurred cost plus cost to complete must equal Block 20 cost.');
  const sustaining = nonprofit && input.sustainingSupport === true;
  if (sustaining && category.progress) throw new Error('Sustaining-support nonprofit with progress payments requires review before Block 25 can be determined.');
  const lo = D.parse(sustaining ? '-1' : category.min);
  const hi = D.parse(sustaining ? '0' : category.max);
  const normal = sustaining ? null : D.parse(category.normal);
  const riskA = percent(input.riskIncurred, 'Incurred-cost risk value');
  const riskB = percent(input.riskToComplete, 'Cost-to-complete risk value');
  const allowed = value => between(value, lo, hi) || (input.ucaZeroException === true && value.cmp(zero) === 0 && !sustaining);
  if (!allowed(riskA) || !allowed(riskB)) throw new Error('Contract risk value is outside the permitted range; a zero UCA exception requires explicit support.');
  if (input.ucaZeroException && !String(input.ucaRationale || '').trim()) throw new Error('Explain the substantial incurred-cost UCA exception.');
  if ((sustaining || riskA.cmp(normal) || riskB.cmp(normal) || incurred.cmp(zero) > 0) && !String(input.contractRiskRationale || '').trim()) throw new Error('Contract risk and incurred-cost rationale is required.');
  const a = incurred.mul(riskA.div(D.parse('100')));
  const b = toComplete.mul(riskB.div(D.parse('100')));
  return { category: category.label, incurredBase: report(incurred), completionBase: report(toComplete), block24a: report(a), block24b: report(b), block24: a.add(b), sustaining, citation: sustaining ? 'PGI 215.404-972(b)(2)' : 'PGI 215.404-971(c)(2)–(4)' };
}

function calculateWorkingCapital(input, b20) {
  if (!CONTRACT_TYPES[input.contractType]?.progress) return { applicable: false, block25: zero, citation: 'PGI 215.404-971(c)(3)' };
  const base = money(input.financedBase, 'Costs-financed base');
  if (base.cmp(b20) > 0) throw new Error('Costs-financed base cannot exceed Block 20 cost.');
  if (base.cmp(b20) < 0 && !String(input.financingReductionRationale || '').trim()) throw new Error('Explain the reduction from Block 20 for the costs-financed base.');
  const share = percent(input.financedShare, 'Contractor-financed share');
  if (!between(share, zero, D.parse('100'))) throw new Error('Contractor-financed share must be 0–100%.');
  const rate = percent(input.treasuryRate, 'Treasury rate');
  if (!between(rate, zero, D.parse('100'))) throw new Error('Treasury rate must be 0–100%.');
  if (!String(input.treasuryPeriod || '').trim() || input.treasuryVerified !== true) throw new Error('Select and verify the official Treasury rate period.');
  const factor = lengthFactor(input.performanceMonths);
  const costs = base.mul(share.div(D.parse('100')));
  const raw = costs.mul(factor).mul(rate.div(D.parse('100')));
  const cap = b20.mul(pct('4'));
  return { applicable: true, costsFinanced: report(costs), lengthFactor: factor.fixed(2), treasuryRatePct: rate.fixed(3), treasuryPeriod: input.treasuryPeriod, raw: report(raw), cap: report(cap), capped: raw.cmp(cap) > 0, block25: raw.cmp(cap) > 0 ? cap : raw, citation: 'PGI 215.404-971(c)(2),(5)–(6)' };
}

function calculateCapital(input) {
  if (!['provided', 'zero'].includes(input.capitalStatus)) throw new Error('Confirm DD Form 1861-derived capital amounts or an evidenced zero.');
  if (!String(input.capitalBasis || '').trim()) throw new Error('Describe the DD Form 1861 basis or evidence for zero capital.');
  if (input.capitalStatus === 'zero') {
    const amountNames = ['landCapital', 'buildingCapital', 'equipmentCapital', 'buildingCapitalAdjustment', 'equipmentCapitalAdjustment'];
    if (amountNames.some(name => money(input[name] || '0', name).cmp(zero) !== 0)) throw new Error('Zero-capital status conflicts with nonzero capital amounts.');
    return { land: report(zero), buildings: report(zero), equipment: report(zero), buildingAdjustment: report(zero), equipmentAdjustment: report(zero), adjustedBuildings: report(zero), adjustedEquipment: report(zero), equipmentFactorPct: null, block26: zero, block27: zero, block28: zero, citation: 'PGI 215.404-971(d)(2)–(7)' };
  }
  const land = money(input.landCapital, 'Land capital');
  const buildings = money(input.buildingCapital, 'Buildings capital');
  const equipment = money(input.equipmentCapital, 'Equipment capital');
  const buildingAdjustment = money(input.buildingCapitalAdjustment, 'Building capital adjustment');
  const equipmentAdjustment = money(input.equipmentCapitalAdjustment, 'Equipment capital adjustment');
  if ((buildingAdjustment.cmp(zero) > 0 || equipmentAdjustment.cmp(zero) > 0) && !String(input.capitalAdjustmentRationale || '').trim()) throw new Error('Explain the formal-plan or intracompany-transfer capital adjustment.');
  const adjustedBuildings = buildings.add(buildingAdjustment);
  const adjustedEquipment = equipment.add(equipmentAdjustment);
  const factor = percent(input.equipmentValue, 'Equipment factor');
  if (!between(factor, D.parse('10'), D.parse('25'))) throw new Error('Equipment factor must be 10–25%.');
  if (factor.cmp(D.parse('17.5')) !== 0 && !String(input.capitalRationale || '').trim()) throw new Error('Explain the nonnormal equipment factor.');
  return { land: report(land), buildings: report(buildings), equipment: report(equipment), buildingAdjustment: report(buildingAdjustment), equipmentAdjustment: report(equipmentAdjustment), adjustedBuildings: report(adjustedBuildings), adjustedEquipment: report(adjustedEquipment), equipmentFactorPct: factor.fixed(3), block26: zero, block27: zero, block28: adjustedEquipment.mul(factor.div(D.parse('100'))), citation: 'PGI 215.404-971(d)(2)–(7)' };
}

function calculateEfficiency(input, b20) {
  if (input.efficiencyStatus !== 'assessed') throw new Error('Assess cost efficiency explicitly, including an assessed zero.');
  const factor = percent(input.efficiencyValue, 'Cost efficiency factor');
  if (!between(factor, zero, D.parse('4'))) throw new Error('Cost efficiency factor must be 0–4%.');
  if (factor.cmp(zero) > 0 && !String(input.efficiencyRationale || '').trim()) throw new Error('Explain demonstrated cost reduction benefiting this action.');
  return { factorPct: factor.fixed(3), block29: b20.mul(factor.div(D.parse('100'))), citation: 'PGI 215.404-971(e)(1)–(3)' };
}

function calculate(input) {
  const errors = [];
  const fail = (field, message) => errors.push(issue(field, message));
  if (input.framework !== FRAMEWORK.id || input.frameworkConfirmed !== true) fail('framework', 'Confirm that the action is governed by the listed Revision 1 framework.');
  if (input.negotiated === 'no') fail('negotiated', 'This is not a negotiated action under the modeled trigger; review the applicable method.');
  else if (input.negotiated !== 'yes') fail('negotiated', 'Confirm whether this is a negotiated action.');
  if (input.certifiedData === 'no') fail('certifiedData', 'Certified cost or pricing data was not obtained; review whether another method applies.');
  else if (input.certifiedData !== 'yes') fail('certifiedData', 'Confirm whether certified cost or pricing data was obtained.');
  if (input.organization === 'ffrdc' || input.contractType === 'cpaf' || input.approach === 'alternate') fail('applicability', 'This scenario requires a different method; no standard weighted-guidelines total is available.');
  if (!['standard', 'alternate'].includes(input.approach)) fail('approach', 'Select the applicable structured approach.');
  if (!['for-profit', 'nonprofit'].includes(input.organization)) fail('organization', 'Select for-profit or nonprofit other than FFRDC.');
  if (input.organization === 'nonprofit' && !['yes', 'no'].includes(input.sustainingSupportAnswer)) fail('sustainingSupportAnswer', 'Confirm whether the nonprofit receives the specified sustaining support.');
  if (errors.length) return { status: 'needs-review', framework: FRAMEWORK, errors, blocks: null };
  try {
    const b20 = money(input.b20, 'Block 20 cost');
    if (!String(input.costBasis || '').trim()) throw new Error('Describe the verified Block 20 cost base and its source.');
    const nonprofit = input.organization === 'nonprofit';
    const normalized = { ...input, sustainingSupport: input.sustainingSupportAnswer === 'yes' };
    const performance = calculatePerformance(normalized, b20, nonprofit);
    const contract = calculateContractRisk(normalized, b20, nonprofit);
    const workingCapital = calculateWorkingCapital(normalized, b20);
    const capital = calculateCapital(normalized);
    const efficiency = calculateEfficiency(normalized, b20);
    const rawTotal = performance.block23.add(contract.block24).add(workingCapital.block25).add(capital.block27).add(capital.block28).add(efficiency.block29);
    const blocks = { '20': report(b20), '23': report(performance.block23), '24': report(contract.block24), '25': report(workingCapital.block25), '26': report(capital.block26), '27': report(capital.block27), '28': report(capital.block28), '29': report(efficiency.block29) };
    const formTotal = ['23', '24', '25', '27', '28', '29'].reduce((sum, key) => sum + BigInt(blocks[key].wholeDollars), 0n);
    blocks['30'] = { raw: rawTotal.fixed(6), exact: rawTotal.exact(), wholeDollars: String(formTotal), rawRoundedWholeDollars: rawTotal.fixed(0), roundingReconciliation: String(formTotal - BigInt(rawTotal.fixed(0))) };
    return { status: 'complete', framework: FRAMEWORK, method: nonprofit ? 'modified-nonprofit' : 'standard', blocks, performance: { ...performance, block23: report(performance.block23) }, contract: { ...contract, block24: report(contract.block24) }, workingCapital: { ...workingCapital, block25: report(workingCapital.block25) }, capital: { ...capital, block26: report(capital.block26), block27: report(capital.block27), block28: report(capital.block28) }, efficiency: { ...efficiency, block29: report(efficiency.block29) }, input: structuredClone(input) };
  } catch (error) { fail('calculation', error.message); return { status: 'needs-information', framework: FRAMEWORK, errors, blocks: null }; }
}


// Source: js/role-guidance.mjs
// Guidance changes the explanation only. It never sets or validates a factor.
const byRole = {
  contracts: {
    context: 'Confirm the governing framework, negotiation method, certified-data status, and Government cost base from the acquisition record.',
    performance: 'Collect the technical and management assessments; the contracting officer selects the weights and values.',
    contract: 'Check contract type, payment terms, qualifying-proposal date, and the incurred/remaining cost split.',
    capital: 'Confirm finance supplied the DD Form 1861 allocation or support for zero capital before accepting a total.',
    review: 'Check applicability, source version, rationale, and whether every selected value has an action-specific basis.',
    export: 'Keep the export with the prenegotiation working record; it is not an approved DD Form 1547.'
  },
  program: {
    context: 'Bring the work scope, schedule, and technical requirements; contracts establishes applicability and the cost base.',
    performance: 'Describe technical uncertainty and the effort to manage schedule, people, and cost. Supply facts for the contracting officer’s selections.',
    contract: 'Check whether delivery timing and work already performed match the proposed incurred/remaining split.',
    capital: 'Identify equipment used for the work and any supported action-specific savings; finance validates the amounts.',
    review: 'Compare the selected risk narrative with the actual work, schedule, and technical evidence.',
    export: 'Review the assumptions that describe performance; the export remains a working objective.'
  },
  subcontracts: {
    context: 'Supply proposal and subcontract support, but do not substitute a proposed price for the Government Block 20 objective cost.',
    performance: 'Describe supplier technical and management risks; values entered here are hypothetical unless the Government selects them.',
    contract: 'Supply the subcontract terms and supported costs incurred at the qualifying proposal date, if applicable.',
    capital: 'Request supported capital and savings records from the appropriate source; a proposal total cannot create DD Form 1861 amounts.',
    review: 'Check which entries are proposal facts and which are Government assumptions before sharing a scenario.',
    export: 'Label any shared output as a modeled scenario, not the Government’s conclusion or a proposed price.'
  },
  finance: {
    context: 'Check the objective cost basis and its source; keep proposed price and facilities capital cost of money separate.',
    performance: 'Review the cost-control facts behind the management assessment; the contracting officer selects the value.',
    contract: 'Support the incurred/remaining amounts and, for progress payments, the financed share, duration, and Treasury rate period.',
    capital: 'Supply DD Form 1861-derived allocations or documented zero capital, then support any capital addition or savings claim.',
    review: 'Reconcile Block 20, incurred plus remaining cost, capital inputs, rate period, and reported versus raw amounts.',
    export: 'Inspect the trace and saved files for cost, capital, rate, and rounding support before filing.'
  }
};

const byExperience = {
  beginner: {
    context: 'Start with the source records; choose Not sure when a required fact has not been established.',
    performance: 'A weight is a share of this assessment; a value is a selected profit percentage. They are different numbers.',
    contract: 'Costs already incurred plus costs still to complete must equal the Block 20 objective cost.',
    capital: 'Choose Provided, evidenced zero, or unavailable. Unavailable is not the same as zero.',
    review: 'A Needs more information result means the tool has not produced a profit objective.',
    export: 'Calculate a complete result in Review before saving or printing.'
  },
  advanced: {
    context: 'Record the action-specific source and date for the framework and Block 20 basis.',
    performance: 'Document nonnormal values and any technology-incentive or qualifying-proposal consideration.',
    contract: 'Inspect separate risk values, any UCA exception, and the financing calculation when progress payments apply.',
    capital: 'Trace allocations, formal additions, equipment factor, and cost-efficiency support separately.',
    review: 'Open the advanced trace to inspect formulas, source citations, raw values, and rounding reconciliation.',
    export: 'Verify the PDF, CSV, or JSON against the acquisition record; these files do not confer approval.'
  }
};

function guidanceFor(role, experience, step) {
  const roleText = byRole[role]?.[step];
  const experienceText = byExperience[experience]?.[step];
  if (!roleText || !experienceText) throw new Error('Unknown role, experience, or step.');
  return `${roleText} ${experienceText}`;
}


// Source: js/form-input.mjs
function readNamedElements(elements) {
  const values = {};
  for (const element of elements) {
    if (!element.name || element.dataset?.choiceProxy) continue;
    values[element.name] = element.type === 'checkbox' ? element.checked : element.value.trim();
  }
  return values;
}


// Source: js/app.mjs

const form = document.querySelector('#calculator-form');
const steps = ['context', 'performance', 'contract', 'capital', 'review', 'export'];
const field = name => form.elements.namedItem(name);
const set = (name, value) => { const node = field(name); if (node.type === 'checkbox') node.checked = Boolean(value); else node.value = value; };
const val = name => { const node = field(name); return node.type === 'checkbox' ? node.checked : node.value.trim(); };
const formatMoney = value => { const amount = BigInt(value); return `${amount < 0n ? '-' : ''}$${(amount < 0n ? -amount : amount).toLocaleString('en-US')}`; };
const show = (node, visible) => { node.hidden = !visible; };
const node = (tag, value, cls) => { const e = document.createElement(tag); if (value != null) e.textContent = value; if (cls) e.className = cls; return e; };
const addRow = (parent, cells, tag = 'td') => { const tr = node('tr'); for (const value of cells) tr.append(node(tag, value)); parent.append(tr); return tr; };
let currentResult = null;
const scenarios = [];
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

for (const [key, row] of Object.entries(CONTRACT_TYPES)) {
  const option = node('option', row.label);
  option.value = key;
  field('contractType').append(option);
}
field('contractType').append(field('contractType').querySelector('option[value="cpaf"]'));

function enhanceChoices() {
  for (const select of document.querySelectorAll('select')) {
    if (select.id === 'contract-type') continue;
    const label = select.closest('label');
    if (!label) continue;
    const inMatrix = Boolean(label.closest('.choice-matrix'));
    const title = [...label.childNodes].filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent.trim()).filter(Boolean).join(' ');
    const box = node('fieldset', null, 'choice-field');
    if (!inMatrix && label.id) box.id = label.id;
    if (!inMatrix && label.hidden) box.hidden = true;
    const legend = node('legend', title, inMatrix ? 'sr-only' : undefined);
    const choices = node('div', null, 'choice-buttons');
    const radios = [];
    const hasUnknown = [...select.options].some(option => ['unknown', 'not-assessed'].includes(option.value));
    for (const option of select.options) {
      if (!option.value && (!select.name || hasUnknown)) continue;
      const tile = node('label', null, 'choice-button');
      const radio = node('input');
      radio.type = 'radio';
      radio.name = `visual-${select.name || select.id}`;
      radio.value = option.value;
      radio.dataset.choiceProxy = 'true';
      radio.addEventListener('change', () => {
        select.value = option.value;
        sync();
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      tile.append(radio, node('span', option.value ? option.textContent : 'Not sure yet'));
      choices.append(tile);
      radios.push([radio, tile, option.value]);
    }
    const sync = () => { for (const [radio, tile, value] of radios) { radio.checked = select.value === value; tile.classList.toggle('is-selected', radio.checked); } };
    select.hidden = true;
    box.append(legend, choices, select);
    const hint = label.querySelector('small');
    if (hint) {
      if (!hint.id) hint.id = `choice-help-${select.name || select.id}`;
      box.setAttribute('aria-describedby', hint.id);
    }
    if (inMatrix) {
      const row = node('div', null, 'choice-row');
      if (label.id) row.id = label.id;
      if (label.hidden) row.hidden = true;
      row.append(node('div', title, 'choice-topic'), box);
      if (hint) row.append(hint);
      label.replaceWith(row);
    } else {
      if (hint) box.append(hint);
      label.replaceWith(box);
    }
    select.syncChoices = sync;
    sync();
  }
}

enhanceChoices();

function readInput() {
  const data = readNamedElements(form.elements);
  data.framework = FRAMEWORK.id;
  return normalizeFormInput(data);
}

function refreshConditional() {
  show(document.querySelector('#sustaining-field'), val('organization') === 'nonprofit');
  show(document.querySelector('#technology-fields'), val('technicalMode') === 'technology');
  show(document.querySelector('#working-capital-fields'), Boolean(CONTRACT_TYPES[val('contractType')]?.progress));
  show(document.querySelector('#capital-amounts'), val('capitalStatus') === 'provided');
  show(document.querySelector('#capital-extra'), val('capitalStatus') === 'provided');
  show(document.querySelector('#capital-basis-field'), ['provided', 'zero'].includes(val('capitalStatus')));
  show(document.querySelector('#zero-capital-note'), val('capitalStatus') === 'zero');
  show(document.querySelector('#unknown-capital-note'), val('capitalStatus') === 'unknown');
  const row = CONTRACT_TYPES[val('contractType')];
  document.querySelector('#risk-range').textContent = row ? `Normal ${row.normal}%; range ${row.min}–${row.max}%. ${val('organization') === 'nonprofit' && val('sustainingSupportAnswer') === 'yes' ? 'Sustaining support: −1% to 0% instead.' : ''}` : '';
}

function renderRoleGuidance(step) {
  const role = document.querySelector('#role-select').value;
  document.querySelector('#role-guidance').textContent = role ? guidanceFor(role, document.querySelector('#experience-select').value, step) : 'Choose your role for guidance on this step. Your selection does not change the calculation.';
}

function navigate() {
  const name = location.hash.slice(1);
  const active = steps.includes(name) ? name : 'context';
  for (const step of steps) {
    show(document.getElementById(step), step === active);
    const link = document.querySelector(`[data-step-link="${step}"]`);
    if (step === active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
  }
  show(document.querySelector('#print-summary'), active === 'export' && currentResult?.status === 'complete');
  renderRoleGuidance(active);
  const heading = document.getElementById(active).querySelector('h1');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
}

function message(text, kind = 'info') {
  const area = document.querySelector('#global-message');
  area.textContent = text;
  area.className = `message ${kind}`;
  show(area, true);
}

function renderErrors(result) {
  const box = document.querySelector('#review-errors');
  box.replaceChildren(node('strong', result.status === 'needs-review' ? 'Needs action-specific review' : 'Needs more information'));
  const list = node('ul');
  for (const error of result.errors) list.append(node('li', error.message));
  box.append(list);
  show(box, true);
  show(document.querySelector('#results'), false);
  box.focus?.();
}

const labels = {
  '23': '23 · Performance risk', '24': '24 · Contract type risk', '25': '25 · Working capital',
  '26': '26 · Land (no profit amount)', '27': '27 · Buildings', '28': '28 · Equipment',
  '29': '29 · Cost efficiency', '30': '30 · Reported profit objective'
};

function renderResults(result) {
  show(document.querySelector('#review-errors'), false);
  show(document.querySelector('#results'), true);
  document.querySelector('#result-status').textContent = `${result.method === 'standard' ? 'Standard' : 'Modified nonprofit'} method · reported objective ${formatMoney(result.blocks['30'].wholeDollars)}. This is an analytical aid, not a Government determination.`;
  const rows = document.querySelector('#result-rows'); rows.replaceChildren();
  for (const key of Object.keys(labels)) addRow(rows, [labels[key], formatMoney(result.blocks[key].wholeDollars)]);
  const trace = document.querySelector('#trace'); trace.replaceChildren();
  trace.append(node('h3', 'Factor math'));
  const dl = node('dl');
  const pairs = [
    ['Framework', result.framework.title], ['Block 20 base', formatMoney(result.blocks['20'].wholeDollars)],
    ['Technical selection', `${result.input.technicalWeight}% weight × ${result.input.technicalValue}% value`],
    ['Management selection', `${result.input.managementWeight}% weight × ${result.input.managementValue}% value`],
    ['Performance composite', `${result.performance.compositePct}%`],
    ['Technical contribution', `${result.performance.technicalContributionPct}%`],
    ['Management contribution', `${result.performance.managementContributionPct}%`],
    ['Performance formula', `(${result.performance.technicalContributionPct}% + ${result.performance.managementContributionPct}%) × ${result.blocks['20'].raw}`],
    ['Performance gross', result.performance.gross.raw],
    ['Nonprofit reduction', formatMoney(result.performance.nonprofitReduction.wholeDollars)],
    ['Contract category', result.contract.category],
    ['Incurred-cost formula', `${result.contract.incurredBase.raw} × ${result.input.riskIncurred}% = ${result.contract.block24a.raw}`],
    ['Cost-to-complete formula', `${result.contract.completionBase.raw} × ${result.input.riskToComplete}% = ${result.contract.block24b.raw}`],
    ['Costs financed', result.workingCapital.applicable ? result.workingCapital.costsFinanced.raw : 'Not applicable'],
    ['Length factor', result.workingCapital.applicable ? result.workingCapital.lengthFactor : 'Not applicable'],
    ['Treasury rate', result.workingCapital.applicable ? `${result.workingCapital.treasuryRatePct}%` : 'Not applicable'],
    ['Working capital uncapped', result.workingCapital.applicable ? result.workingCapital.raw.raw : 'Not applicable'],
    ['Working capital cap', result.workingCapital.applicable ? result.workingCapital.cap.raw : 'Not applicable'],
    ['Treasury rate period', result.workingCapital.applicable ? result.workingCapital.treasuryPeriod : 'Not applicable'],
    ['Equipment capital, original', result.capital.equipment.raw],
    ['Equipment capital addition', result.capital.equipmentAdjustment.raw],
    ['Equipment capital, adjusted', result.capital.adjustedEquipment.raw],
    ['Building capital, original / adjusted', `${result.capital.buildings.raw} / ${result.capital.adjustedBuildings.raw}`],
    ['Equipment assigned value', result.capital.equipmentFactorPct == null ? 'Not applicable: evidenced zero capital' : `${result.capital.equipmentFactorPct}%`],
    ['Cost efficiency factor', `${result.efficiency.factorPct}%`],
    ['Unrounded analytical total', result.blocks['30'].raw],
    ['Form rounding reconciliation', result.blocks['30'].roundingReconciliation],
    ['Performance source', result.performance.citation], ['Contract source', result.contract.citation],
    ['Working capital source', result.workingCapital.citation], ['Capital source', result.capital.citation],
    ['Cost efficiency source', result.efficiency.citation], ['Form total source', 'PGI 253.215-70(c)(15)']
  ];
  for (const [term, definition] of pairs) { dl.append(node('dt', term), node('dd', definition)); }
  trace.append(dl);
  trace.append(node('h3', 'Recorded inputs and rationales'));
  const inputs = node('dl');
  for (const [key, value] of Object.entries(result.input)) {
    if (value === '' || value === false || value == null) continue;
    inputs.append(node('dt', key.replace(/([A-Z])/g, ' $1').toLowerCase()), node('dd', String(value)));
  }
  trace.append(inputs);
  buildPrint(result);
  show(document.querySelector('#export-unavailable'), false);
  show(document.querySelector('#export-ready'), true);
}

function buildPrint(result) {
  const paper = document.querySelector('#print-summary'); paper.replaceChildren();
  paper.append(node('h1', 'Weighted guidelines calculation summary'));
  paper.append(node('p', `Calculated ${new Date().toLocaleDateString('en-US')} · ${result.framework.title} · ${result.method === 'standard' ? 'Standard' : 'Modified nonprofit'} method`));
  paper.append(node('p', 'Working analytical objective only. This is not a completed DD Form 1547, an approved fee, or a negotiated price.', 'paper-note'));
  const summaryTitle = node('h2', 'Factor summary'); paper.append(summaryTitle);
  const summary = node('table'); const head = node('thead'); addRow(head, ['Factor', 'Reported amount'], 'th'); summary.append(head);
  const body = node('tbody');
  for (const key of Object.keys(labels)) addRow(body, [labels[key], formatMoney(result.blocks[key].wholeDollars)]);
  summary.append(body); paper.append(summary);
  paper.append(node('h2', 'Selections, inputs, and assumptions'));
  const selections = node('dl');
  const excluded = new Set(['frameworkConfirmed', 'treasuryVerified']);
  for (const [key, value] of Object.entries(result.input)) {
    if (excluded.has(key) || value === '' || value == null || value === false) continue;
    selections.append(node('dt', key.replace(/([A-Z])/g, ' $1').toLowerCase()), node('dd', String(value)));
  }
  paper.append(selections);
  paper.append(node('h2', 'Calculation trace and limits'));
  for (const [term, definition] of [
    ['Performance composite', `${result.performance.compositePct}% × Block 20`],
    ['Contract risk', `${result.contract.block24a.raw} + ${result.contract.block24b.raw}`],
    ['Working capital', result.workingCapital.applicable ? `${result.workingCapital.raw.raw} capped at ${result.workingCapital.cap.raw}` : 'Not applicable'],
    ['Capital', result.capital.equipmentFactorPct == null ? 'Evidenced zero capital; no equipment value selected' : `${result.capital.adjustedEquipment.raw} × ${result.capital.equipmentFactorPct}%`],
    ['Cost efficiency', `${result.efficiency.factorPct}% × Block 20`],
    ['Unrounded analytical total', result.blocks['30'].raw],
    ['Rounding reconciliation', result.blocks['30'].roundingReconciliation],
    ['Rate selection', result.workingCapital.applicable ? result.workingCapital.treasuryPeriod : 'Not applicable']
  ]) paper.append(node('p', `${term}: ${definition}`));
  paper.append(node('p', 'Applicable source: DoD Class Deviation 2026-O0048 Revision 1, DFARS 215.404-970 and PGI 215.404-971/972; DD Form 1547 reporting: PGI 253.215-70. Confirm framework applicability, source revision, action-specific direction, selected values, and verified rate before use.'));
  paper.append(node('small', `Source URLs: ${result.framework.dfars} · ${result.framework.pgi} · ${result.framework.treasury}`));
}

function compareAssumptions(first, next) {
  const changed = Object.keys(next).filter(key => String(first[key] ?? '') !== String(next[key] ?? ''));
  return changed.length ? changed.map(key => key.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ') : 'None';
}

function renderScenarios() {
  const area = document.querySelector('#scenario-area'); show(area, scenarios.length > 0);
  const rows = document.querySelector('#scenario-rows'); rows.replaceChildren();
  const base = scenarios[0];
  for (const item of scenarios) {
    const delta = BigInt(item.result.blocks['30'].wholeDollars) - BigInt(base.result.blocks['30'].wholeDollars);
    const baseAmount = BigInt(base.result.blocks['30'].wholeDollars);
    const percentage = baseAmount === 0n ? 'Not defined' : `${delta >= 0n ? '+' : ''}${new D(delta).div(new D(baseAmount)).mul(new D(100n)).fixed(2)}%`;
    addRow(rows, [item.name, formatMoney(item.result.blocks['30'].wholeDollars), (delta < 0n ? '-' : '+') + formatMoney(String(delta < 0n ? -delta : delta)), percentage, compareAssumptions(base.result.input, item.result.input)]);
  }
}

function csvSafe(value) {
  let s = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(s) && !/^-?\d+(?:\.\d+)?$/.test(s.trim())) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
function download(name, type, data) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function invalidateCalculation() {
  currentResult = null;
  show(document.querySelector('#results'), false);
  show(document.querySelector('#review-errors'), false);
  show(document.querySelector('#export-unavailable'), true);
  show(document.querySelector('#export-ready'), false);
  show(document.querySelector('#print-summary'), false);
  show(document.querySelector('#global-message'), false);
}
form.addEventListener('input', event => { if (!event.target.name || event.target.dataset.choiceProxy) return; invalidateCalculation(); refreshConditional(); });
form.addEventListener('change', event => { if (!event.target.dataset.choiceProxy) refreshConditional(); });
for (const id of ['role-select', 'experience-select']) document.getElementById(id).addEventListener('change', () => renderRoleGuidance(steps.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'context'));
function goToStep(step) {
  try {
    history.pushState(null, '', `#${step}`);
    navigate();
  } catch {
    location.hash = step;
  }
}
document.querySelectorAll('[data-step-link]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  goToStep(link.getAttribute('href').slice(1));
}));
document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => goToStep(button.dataset.next)));
window.addEventListener('hashchange', navigate);
window.addEventListener('popstate', navigate);
window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });
window.addEventListener('pageshow', () => window.scrollTo(0, 0));
document.querySelector('#calculate-button').addEventListener('click', () => {
  show(document.querySelector('#global-message'), false);
  const result = calculate(readInput()); currentResult = result;
  if (result.status === 'complete') renderResults(result); else renderErrors(result);
});
document.querySelector('#save-scenario').addEventListener('click', () => {
  if (currentResult?.status !== 'complete') return;
  if (scenarios.length && currentResult.input.b20 !== scenarios[0].result.input.b20) {
    message('Scenario comparison uses one Block 20 cost base. Restore the first scenario’s cost base or start a new browser session.', 'warning');
    return;
  }
  const name = document.querySelector('#scenario-name').value.trim() || `Scenario ${scenarios.length + 1}`;
  scenarios.push({ name, result: structuredClone(currentResult) });
  renderScenarios(); message(`Saved ${name} in this browser session.`, 'success');
});
document.querySelector('#print-button').addEventListener('click', () => { if (currentResult?.status === 'complete') window.print(); });
document.querySelector('#json-button').addEventListener('click', () => {
  if (currentResult?.status === 'complete') download('weighted-guidelines-calculation.json', 'application/json', JSON.stringify({ generatedAt: new Date().toISOString(), result: currentResult, scenarios }, null, 2));
});
document.querySelector('#csv-button').addEventListener('click', () => {
  if (currentResult?.status !== 'complete') return;
  const rows = [['Section', 'Field', 'Value', 'Source']];
  rows.push(['Calculation', 'Date', new Date().toISOString().slice(0, 10), 'Local browser date']);
  for (const [key, value] of Object.entries(currentResult.blocks)) rows.push(['Factor', `Block ${key}`, value.wholeDollars, 'PGI 215.404-971/972; PGI 253.215-70']);
  rows.push(['Trace', 'Technical contribution percentage', currentResult.performance.technicalContributionPct, currentResult.performance.citation]);
  rows.push(['Trace', 'Management contribution percentage', currentResult.performance.managementContributionPct, currentResult.performance.citation]);
  rows.push(['Trace', 'Performance composite percentage', currentResult.performance.compositePct, currentResult.performance.citation]);
  rows.push(['Trace', 'Performance gross dollars', currentResult.performance.gross.raw, currentResult.performance.citation]);
  rows.push(['Trace', 'Incurred-cost risk dollars', currentResult.contract.block24a.raw, currentResult.contract.citation]);
  rows.push(['Trace', 'Cost-to-complete risk dollars', currentResult.contract.block24b.raw, currentResult.contract.citation]);
  if (currentResult.workingCapital.applicable) {
    rows.push(['Trace', 'Costs financed dollars', currentResult.workingCapital.costsFinanced.raw, currentResult.workingCapital.citation]);
    rows.push(['Trace', 'Working capital uncapped dollars', currentResult.workingCapital.raw.raw, currentResult.workingCapital.citation]);
    rows.push(['Trace', 'Working capital cap dollars', currentResult.workingCapital.cap.raw, currentResult.workingCapital.citation]);
  }
  rows.push(['Trace', 'Adjusted equipment capital dollars', currentResult.capital.adjustedEquipment.raw, currentResult.capital.citation]);
  rows.push(['Trace', 'Unrounded objective dollars', currentResult.blocks['30'].raw, 'PGI 253.215-70']);
  rows.push(['Trace', 'Rounding reconciliation dollars', currentResult.blocks['30'].roundingReconciliation, 'PGI 253.215-70']);
  for (const [key, value] of Object.entries(currentResult.input)) rows.push(['Input', key, value, 'User-entered']);
  rows.push(['Framework', 'Version', FRAMEWORK.id, FRAMEWORK.pgi]);
  rows.push(['Limit', 'Status', 'Working objective; no Government approval', '']);
  download('weighted-guidelines-calculation.csv', 'text/csv;charset=utf-8', rows.map(row => row.map(csvSafe).join(',')).join('\r\n'));
});
document.querySelector('#load-example').addEventListener('click', () => {
  const example = {
    frameworkConfirmed: true, negotiated: 'yes', certifiedData: 'yes', organization: 'for-profit', approach: 'standard',
    b20: '1000000', costBasis: 'Fictional verified Block 20 cost base; excludes facilities capital cost of money.',
    technicalWeight: '60', managementWeight: '40', technicalMode: 'standard', technicalValue: '5', managementValue: '4', performanceRationale: 'Fictional selected management value.',
    contractType: 'ffp-none', incurredCost: '0', costToComplete: '1000000', riskIncurred: '5', riskToComplete: '5',
    capitalStatus: 'provided', landCapital: '0', buildingCapital: '0', equipmentCapital: '100000', buildingCapitalAdjustment: '0', equipmentCapitalAdjustment: '0', equipmentValue: '17.5', capitalBasis: 'Fictional DD Form 1861-derived amount.',
    efficiencyStatus: 'assessed', efficiencyValue: '1', efficiencyRationale: 'Fictional demonstrated cost reduction.'
  };
  for (const [key, value] of Object.entries(example)) set(key, value);
  for (const select of document.querySelectorAll('select')) select.syncChoices?.();
  invalidateCalculation(); refreshConditional(); message('Loaded fictional example. Review every selection before calculating.', 'info');
});

refreshConditional(); navigate();
