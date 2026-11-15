/* Pure offline helpers. All imported values remain untrusted text. */
(function (root) {
  "use strict";

  const FIELDS = [
    ["recordId", "Record ID"], ["assetId", "Asset Identifier"],
    ["description", "Description"], ["partNumber", "Part Number"],
    ["serialNumber", "Serial Number"], ["quantity", "Quantity"],
    ["unit", "Unit of Measure"], ["location", "Property Location"],
    ["origin", "Property Origin"], ["category", "Property Category"],
    ["condition", "Condition"], ["unitCost", "Unit Acquisition Cost"],
    ["contract", "Accountable Contract"], ["remarks", "Remarks"]
  ];
  const HEADERS = FIELDS.map(field => field[1]);
  const KEYS = FIELDS.map(field => field[0]);
  const MAX_BYTES = 2 * 1024 * 1024;
  const MAX_ROWS = 10000;
  const HINTS = {
    recordId: ["record id", "record identifier"], assetId: ["asset identifier", "asset id", "asset tag"],
    description: ["description", "property description", "property name"],
    partNumber: ["part number"], serialNumber: ["serial number"],
    quantity: ["quantity", "quantity on hand", "balance on hand"],
    unit: ["unit of measure", "uom", "unit"], location: ["property location", "location"],
    origin: ["property origin", "origin"], category: ["property category", "category"],
    condition: ["condition"], unitCost: ["unit acquisition cost", "unit cost"],
    contract: ["accountable contract", "contract number", "accountable contract number or code"],
    remarks: ["remarks", "notes"]
  };
  const val = input => String(input == null ? "" : input).trim();
  const labelKey = input => val(input).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const idKey = input => val(input).toLowerCase();
  const positiveQuantity = input => /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(val(input)) && Number(val(input)) > 0 && Number.isFinite(Number(val(input)));

  function parseCsv(input) {
    const source = String(input == null ? "" : input).replace(/^\uFEFF/, "");
    if (!source) throw new Error("The CSV file is empty.");
    if (new TextEncoder().encode(source).length > MAX_BYTES) throw new Error("CSV exceeds the 2 MB limit.");
    const rows = [];
    let row = [], cell = "", quoted = false, closed = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') { quoted = false; closed = true; }
        else cell += ch;
      } else if (ch === '"') {
        if (cell || closed) throw new Error(`Invalid quote near character ${i + 1}.`);
        quoted = true;
      } else if (ch === "," || ch === "\n" || ch === "\r") {
        row.push(cell); cell = ""; closed = false;
        if (ch !== ",") {
          if (ch === "\r" && source[i + 1] === "\n") i++;
          rows.push(row); row = [];
          if (rows.length > MAX_ROWS + 1) throw new Error("CSV exceeds the 10,000-row limit.");
        }
      } else {
        if (closed && ch !== " " && ch !== "\t") throw new Error("Unexpected text after a closing quote.");
        cell += ch;
      }
    }
    if (quoted) throw new Error("CSV has an unclosed quoted value.");
    if (cell || row.length || closed || !rows.length) { row.push(cell); rows.push(row); }
    while (rows.length && rows.at(-1).every(value => value === "")) rows.pop();
    if (!rows.length || rows[0].every(value => !val(value))) throw new Error("CSV has no header row.");
    if (rows.length - 1 > MAX_ROWS) throw new Error("CSV exceeds the 10,000-row limit.");
    if (rows[0].some(value => !val(value))) throw new Error("CSV has a blank header.");
    return rows;
  }

  function suggestedMapping(headers) {
    const used = new Set(), mapping = {};
    KEYS.forEach(name => {
      let found = -1;
      for (const hint of HINTS[name]) {
        found = headers.findIndex((header, index) => !used.has(index) && labelKey(header) === hint);
        if (found >= 0) break;
      }
      mapping[name] = found;
      if (found >= 0) used.add(found);
    });
    return mapping;
  }

  function blankItem() { return Object.fromEntries(KEYS.map(key => [key, ""])); }
  function normalizeItem(input) {
    const item = blankItem();
    KEYS.forEach(key => { item[key] = String(input[key] == null ? "" : input[key]); });
    return item;
  }
  function itemErrors(item) {
    const errors = [];
    if (!val(item.description)) errors.push("description is missing");
    if (!val(item.quantity)) errors.push("quantity is missing");
    else if (!positiveQuantity(item.quantity)) errors.push("quantity must be a positive decimal");
    if (!val(item.unit)) errors.push("unit of measure is missing");
    return errors;
  }
  function duplicateIssues(items) {
    const recordIds = new Map(), assetIds = new Map(), errors = [], warnings = [];
    items.forEach((item, index) => {
      const label = `Item ${index + 1}`;
      const recordId = idKey(item.recordId), assetId = idKey(item.assetId);
      if (recordId) {
        if (recordIds.has(recordId)) errors.push(`${label}: duplicate Record ID (also item ${recordIds.get(recordId) + 1}).`);
        else recordIds.set(recordId, index);
      }
      if (assetId) {
        if (assetIds.has(assetId)) warnings.push(`${label}: possible duplicate Asset Identifier (also item ${assetIds.get(assetId) + 1}).`);
        else assetIds.set(assetId, index);
      }
    });
    return { errors, warnings };
  }

  function inspectImport(rows, mapping) {
    if (!Array.isArray(rows) || !rows.length) throw new Error("Choose a CSV file first.");
    const headers = rows[0];
    const selected = KEYS.map(key => Number(mapping[key])).filter(index => Number.isInteger(index) && index >= 0);
    if (new Set(selected).size !== selected.length || selected.some(index => index >= headers.length)) throw new Error("Each mapped source column must be unique and within the CSV header.");
    for (const key of ["description", "quantity", "unit"]) {
      if (!Number.isInteger(Number(mapping[key])) || Number(mapping[key]) < 0) throw new Error(`${FIELDS.find(field => field[0] === key)[1]} must be mapped.`);
    }
    const accepted = [], errors = [], warnings = [];
    const ids = new Map(), assets = new Map();
    rows.slice(1).forEach((row, index) => {
      const line = index + 2;
      if (row.length !== headers.length) { errors.push(`CSV row ${line}: column count differs from header.`); return; }
      const raw = {};
      KEYS.forEach(key => { raw[key] = Number(mapping[key]) >= 0 ? row[Number(mapping[key])] : ""; });
      const item = normalizeItem(raw);
      const issues = itemErrors(item);
      const id = idKey(item.recordId), asset = idKey(item.assetId);
      if (id && ids.has(id)) issues.push(`duplicate Record ID (also CSV row ${ids.get(id)})`);
      if (issues.length) { errors.push(`CSV row ${line}: ${issues.join("; ")}.`); return; }
      if (id) ids.set(id, line);
      if (asset) {
        if (assets.has(asset)) warnings.push(`CSV row ${line}: possible duplicate Asset Identifier (also CSV row ${assets.get(asset)}).`);
        else assets.set(asset, line);
      }
      accepted.push(item);
    });
    return { accepted, errors, warnings, sourceRows: rows.length - 1 };
  }

  function preparationExceptions(items, context) {
    const issues = [];
    if (!val(context.reason)) issues.push("Preparation context: reason property is being considered is blank.");
    items.forEach((item, index) => {
      const name = `Item ${index + 1}${val(item.recordId) ? ` (${val(item.recordId)})` : ""}`;
      itemErrors(item).forEach(error => issues.push(`${name}: ${error}.`));
      if (!val(item.contract) && !val(context.contract)) issues.push(`${name}: accountable contract reference is blank.`);
      if (!val(item.location) && !val(context.location)) issues.push(`${name}: property location is blank.`);
      if (!val(item.origin) || val(item.origin).toLowerCase() === "unknown") issues.push(`${name}: property origin needs review.`);
      if (!val(item.category)) issues.push(`${name}: property category is blank.`);
      if (!val(item.condition)) issues.push(`${name}: condition is blank.`);
    });
    if (!items.length) issues.push("No property items entered.");
    const duplicates = duplicateIssues(items);
    return { issues: issues.concat(duplicates.errors), warnings: duplicates.warnings };
  }

  function csvCell(input) {
    let text = String(input == null ? "" : input);
    if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csv(headers, records) {
    return "\uFEFF" + [headers].concat(records).map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  }
  function listingCsv(items, reference) {
    const columns = ["Preparation Reference", ...HEADERS, "Blank Fields"];
    const records = items.map(item => [reference, ...KEYS.map(key => item[key] || ""), KEYS.filter(key => !val(item[key])).map(key => FIELDS.find(field => field[0] === key)[1]).join("; ")]);
    return csv(columns, records);
  }

  root.DispositionCore = { FIELDS, HEADERS, KEYS, MAX_BYTES, MAX_ROWS, parseCsv, suggestedMapping,
    blankItem, normalizeItem, itemErrors, positiveQuantity, duplicateIssues, inspectImport,
    preparationExceptions, csv, listingCsv };
})(typeof globalThis !== "undefined" ? globalThis : this);
