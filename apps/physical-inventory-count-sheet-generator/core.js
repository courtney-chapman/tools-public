/* Pure, offline inventory helpers. No browser storage or network calls. */
(function (root) {
  "use strict";
  const FIELDS = [
    ["recordId", "Record ID"],
    ["assetId", "Asset Identifier"],
    ["description", "Description"],
    ["partNumber", "Part Number"],
    ["serialNumber", "Serial Number"],
    ["location", "Location"],
    ["recordedQty", "Quantity on Hand"],
    ["uom", "Unit of Measure"],
    ["category", "Property Category"]
  ];
  const KEYS = FIELDS.map(function (field) { return field[0]; });
  const HEADERS = FIELDS.map(function (field) { return field[1]; });
  const RESULT_HEADERS = ["Record ID", "Asset Identifier", "Description", "Recorded Location", "Observed Location", "Recorded Quantity", "Observed Quantity", "Variance", "Count Status", "Condition", "Notes", "Recorded Serial Number", "Observed Asset Identifier", "Observed Serial Number", "Unit of Measure"];
  const ISSUE_HEADERS = ["Record ID", "Asset Identifier", "Description", "Discrepancy Type", "Recorded Information", "Observed Information", "Notes", "Review Status"];
  const MAX_BYTES = 2 * 1024 * 1024;
  const MAX_ROWS = 10000;
  const HEADER_HINTS = {
    recordId: ["record id", "record identifier"],
    assetId: ["asset identifier", "asset id", "asset tag", "unique item identifier or equivalent"],
    description: ["description", "property description", "property name"],
    partNumber: ["part number"],
    serialNumber: ["serial number"],
    location: ["location", "recorded location"],
    recordedQty: ["quantity on hand", "balance on hand", "recorded quantity"],
    uom: ["unit of measure", "uom"],
    category: ["property category", "category"]
  };
  function norm(value) { return String(value == null ? "" : value).trim(); }
  function key(value) { return norm(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function idKey(value) { return norm(value).toLowerCase(); }
  function quantity(value) { return /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(norm(value)); }
  function decimalPlaces(value) {
    const point = norm(value).indexOf(".");
    return point < 0 ? 0 : norm(value).length - point - 1;
  }
  function scaled(value, places) {
    const parts = norm(value).split(".");
    return BigInt(parts[0] + (parts[1] || "").padEnd(places, "0"));
  }
  function variance(observed, recorded) {
    if (!quantity(observed) || !quantity(recorded)) throw new Error("Both quantities must be nonnegative decimals.");
    const places = Math.max(decimalPlaces(observed), decimalPlaces(recorded));
    const difference = scaled(observed, places) - scaled(recorded, places);
    const negative = difference < 0n;
    const digits = (negative ? -difference : difference).toString().padStart(places + 1, "0");
    const whole = places ? digits.slice(0, -places) : digits;
    const fraction = places ? "." + digits.slice(-places) : "";
    return (negative ? "-" : difference > 0n ? "+" : "") + whole + fraction;
  }
  function compareQuantities(a, b) {
    const places = Math.max(decimalPlaces(a), decimalPlaces(b));
    const x = scaled(a, places);
    const y = scaled(b, places);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  function parseCsv(input) {
    let text = String(input == null ? "" : input).replace(/^\uFEFF/, "");
    if (!text) throw new Error("The CSV file is empty.");
    const rows = [];
    let row = [], cell = "", quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (char === '"') { quoted = false; closed = true; }
        else cell += char;
      } else if (char === '"') {
        if (cell || closed) throw new Error("Invalid quote near character " + (i + 1) + ".");
        quoted = true;
      } else if (char === ",") {
        row.push(cell); cell = ""; closed = false;
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = ""; closed = false;
        if (rows.length > MAX_ROWS + 1) throw new Error("CSV exceeds the 10,000-row limit.");
      } else {
        if (closed && char !== " " && char !== "\t") throw new Error("Unexpected text after a closing quote.");
        cell += char;
      }
    }
    if (quoted) throw new Error("CSV has an unclosed quoted value.");
    if (cell || row.length || closed || !rows.length) { row.push(cell); rows.push(row); }
    if (rows.length && rows[rows.length - 1].every(function (value) { return value === ""; })) rows.pop();
    if (!rows.length || !rows[0].length || rows[0].every(function (value) { return !norm(value); })) throw new Error("CSV has no header row.");
    return rows;
  }
  function suggestedMapping(headers) {
    const used = new Set();
    const mapping = {};
    KEYS.forEach(function (name) {
      let match = -1;
      for (const hint of HEADER_HINTS[name]) {
        match = headers.findIndex(function (header, index) { return !used.has(index) && key(header) === hint; });
        if (match >= 0) break;
      }
      mapping[name] = match;
      if (match >= 0) used.add(match);
    });
    return mapping;
  }
  function validateRecord(input) {
    const record = {};
    KEYS.forEach(function (name) { record[name] = norm(input[name]); });
    const errors = [];
    const warnings = [];
    if (!record.recordId) errors.push("Record ID is missing.");
    if (!record.description) errors.push("Description is missing.");
    if (!record.uom) errors.push("Unit of Measure is missing.");
    if (!quantity(record.recordedQty)) errors.push("Quantity on Hand must be a nonnegative decimal.");
    if (!record.location) warnings.push("Location is blank.");
    if (!record.assetId) warnings.push("Asset Identifier is blank; use the available Record ID, part number, and description to identify the item.");
    return { record: record, errors: errors, warnings: warnings };
  }
  function importCsv(input, mapping) {
    if (new Blob([input]).size > MAX_BYTES) throw new Error("CSV exceeds the 2 MB limit.");
    const rows = parseCsv(input);
    if (rows.length < 2) throw new Error("CSV has no data rows.");
    const headers = rows[0];
    const required = ["recordId", "description", "recordedQty", "uom"];
    const missing = required.filter(function (name) { return !Number.isInteger(mapping[name]) || mapping[name] < 0 || mapping[name] >= headers.length; });
    if (missing.length) throw new Error("Map required columns: " + missing.map(function (name) { return HEADERS[KEYS.indexOf(name)]; }).join(", ") + ".");
    const chosen = Object.values(mapping).filter(function (index) { return Number.isInteger(index) && index >= 0; });
    if (new Set(chosen).size !== chosen.length) throw new Error("A CSV column cannot be mapped to more than one field.");
    const accepted = [], skipped = [], warnings = [];
    const ids = new Set(), assetIds = new Map();
    rows.slice(1).forEach(function (row, offset) {
      const line = offset + 2;
      if (row.every(function (value) { return !norm(value); })) return;
      if (row.length !== headers.length) { skipped.push({ line: line, reason: "Column count differs from the header." }); return; }
      const raw = {};
      KEYS.forEach(function (name) { raw[name] = mapping[name] >= 0 ? row[mapping[name]] : ""; });
      const result = validateRecord(raw);
      if (result.record.recordId && ids.has(idKey(result.record.recordId))) result.errors.push("Duplicate Record ID; the first occurrence was kept.");
      if (result.errors.length) { skipped.push({ line: line, reason: result.errors.join(" ") }); return; }
      ids.add(idKey(result.record.recordId));
      if (result.record.assetId) {
        const assetKey = idKey(result.record.assetId);
        if (assetIds.has(assetKey)) result.warnings.push("Potential duplicate Asset Identifier (also row " + assetIds.get(assetKey) + ").");
        else assetIds.set(assetKey, line);
      }
      result.warnings.forEach(function (message) { warnings.push({ line: line, reason: message }); });
      accepted.push(result.record);
    });
    return { accepted: accepted, skipped: skipped, warnings: warnings, sourceRows: rows.length - 1 };
  }
  function emptyObservation() {
    return { observedQty: "", observedLocation: "", observedAssetId: "", observedSerial: "", condition: "", notes: "" };
  }
  function makeWorking(record) { return { ...record, ...emptyObservation() }; }
  function discrepancyTypes(record) {
    const types = [];
    if (!norm(record.observedQty)) { types.push("Uncounted"); return types; }
    if (!quantity(record.observedQty)) { types.push("Invalid observed quantity"); return types; }
    const comparison = compareQuantities(record.observedQty, record.recordedQty);
    if (comparison < 0) types.push("Quantity shortage");
    if (comparison > 0) types.push("Quantity overage");
    if (norm(record.observedLocation) && idKey(record.observedLocation) !== idKey(record.location)) types.push("Location discrepancy");
    if (norm(record.observedAssetId) && idKey(record.observedAssetId) !== idKey(record.assetId)) types.push("Asset identifier discrepancy");
    if (norm(record.observedSerial) && idKey(record.observedSerial) !== idKey(record.serialNumber)) types.push("Serial number discrepancy");
    return types;
  }
  function summary(records, selected, unexpected, skipped) {
    const chosen = records.filter(function (record) { return selected.has(record.recordId); });
    const counted = chosen.filter(function (record) { return norm(record.observedQty) && quantity(record.observedQty); });
    return {
      selected: chosen.length,
      counted: counted.length,
      uncounted: chosen.length - counted.length,
      matching: counted.filter(function (record) { return compareQuantities(record.observedQty, record.recordedQty) === 0; }).length,
      quantityDiscrepancies: counted.filter(function (record) { return compareQuantities(record.observedQty, record.recordedQty) !== 0; }).length,
      locationDiscrepancies: counted.filter(function (record) { return discrepancyTypes(record).includes("Location discrepancy"); }).length,
      identificationDiscrepancies: counted.filter(function (record) { return discrepancyTypes(record).some(function (type) { return type.includes("identifier") || type.includes("Serial"); }); }).length,
      unexpected: unexpected.length,
      skipped: skipped
    };
  }
  function safeCell(value, trustedNumber) {
    let text = String(value == null ? "" : value);
    if (!trustedNumber && /^[\u0000-\u0020]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csv(headers, rows, numericColumns) {
    const numbers = new Set(numericColumns || []);
    return "\uFEFF" + [headers].concat(rows).map(function (row, rowIndex) {
      return row.map(function (value, index) { return safeCell(value, rowIndex > 0 && numbers.has(index)); }).join(",");
    }).join("\r\n") + "\r\n";
  }
  function resultRows(records, selected, unexpected) {
    const rows = records.filter(function (record) { return selected.has(record.recordId); }).map(function (record) {
      const counted = quantity(record.observedQty);
      return [record.recordId, record.assetId, record.description, record.location, record.observedLocation, record.recordedQty, counted ? record.observedQty : "", counted ? variance(record.observedQty, record.recordedQty) : "", counted ? "Counted" : "Not yet counted", record.condition, record.notes, record.serialNumber, record.observedAssetId, record.observedSerial, record.uom];
    });
    unexpected.forEach(function (item) {
      rows.push(["", item.assetId, item.description, "", item.location, "", item.observedQty, "", "Unexpected property", item.condition, item.notes, "", item.assetId, item.serialNumber, item.uom]);
    });
    return rows;
  }
  function issueRows(records, selected, unexpected) {
    const rows = [];
    records.filter(function (record) { return selected.has(record.recordId); }).forEach(function (record) {
      discrepancyTypes(record).forEach(function (type) {
        rows.push([record.recordId, record.assetId, record.description, type,
          "Quantity: " + record.recordedQty + " " + record.uom + "; location: " + record.location + "; serial: " + record.serialNumber,
          "Quantity: " + record.observedQty + " " + record.uom + "; location: " + record.observedLocation + "; asset ID: " + record.observedAssetId + "; serial: " + record.observedSerial,
          record.notes, "Requires Review"]);
      });
    });
    unexpected.forEach(function (item) {
      rows.push(["", item.assetId, item.description, "Unexpected property", "No imported record", "Quantity: " + item.observedQty + " " + item.uom + "; location: " + item.location + "; serial: " + item.serialNumber, item.notes, "Requires Review"]);
    });
    return rows;
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function printShell(title, content) {
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + escapeHtml(title) +
      '</title><style>@page{size:letter portrait;margin:.55in}body{font:12px system-ui,Arial,sans-serif;color:#172b39}h1{font-size:18px;margin:0 0 8px}h2{font-size:14px;margin:14px 0 6px}.meta{margin:0 0 10px}.note{font-size:11px}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #8897a0;padding:5px;vertical-align:top;overflow-wrap:anywhere}th{background:#eef3f3}thead{display:table-header-group}tr{break-inside:avoid}.group{break-before:page}.group:first-of-type{break-before:auto}.inventory-item{border:1px solid #8897a0;border-radius:5px;padding:8px;margin:9px 0;break-inside:avoid}.inventory-item h3{font-size:13px;margin:0 0 6px}.item-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}.item-grid p{margin:2px 0;min-height:22px}.item-grid .full{grid-column:1/-1}.write-line{display:block;min-height:24px;border-bottom:1px solid #8897a0}.label{font-weight:bold}@media screen{body{max-width:1000px;margin:24px auto;padding:0 20px}}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print or save as PDF</button>' +
      content + '</body></html>';
  }
  function countSheetHtml(records, setup, options) {
    const blind = !!options.blind;
    const groups = new Map();
    records.forEach(function (record) {
      const location = norm(record.location) || "Unspecified location";
      if (!groups.has(location)) groups.set(location, []);
      groups.get(location).push(record);
    });
    const ordered = Array.from(groups.keys()).sort(function (a, b) { return a.localeCompare(b); });
    const heading = blind ? "Blind physical inventory count sheet" : "Physical inventory count sheet";
    const meta = "<p class=meta>Inventory: " + escapeHtml(setup.title) + " · Date: " + escapeHtml(setup.date) +
      " · Site: " + escapeHtml(setup.site) + " · Area: " + escapeHtml(setup.area) +
      " · Counter: " + escapeHtml(setup.counter) + "</p>";
    const sections = [];
    ordered.forEach(function (location) {
      const items = groups.get(location);
      for (let index = 0; index < items.length; index += 2) {
        const cards = items.slice(index, index + 2).map(function (record) {
          const pair = function (label, value, full) {
            return '<p' + (full ? ' class="full"' : "") + '><span class="label">' + label + ":</span> " + escapeHtml(value) + "</p>";
          };
          let details = pair("Record ID", record.recordId) + pair("Asset ID", record.assetId) +
            pair("Description", record.description, true) + pair("Part number", record.partNumber) +
            pair("Serial number", record.serialNumber) + pair("Unit", record.uom);
          if (!blind) details += pair("Recorded quantity", record.recordedQty);
          details += '<p><span class="label">Observed quantity:</span><span class="write-line"></span></p>' +
            '<p><span class="label">Condition:</span><span class="write-line"></span></p>' +
            '<p><span class="label">Observed ID / serial:</span><span class="write-line"></span></p>' +
            '<p><span class="label">Counter:</span><span class="write-line"></span></p>' +
            '<p><span class="label">Date counted:</span><span class="write-line"></span></p>' +
            '<p class="full"><span class="label">Notes / discrepancies:</span><span class="write-line"></span></p>';
          return '<article class="inventory-item"><div class="item-grid">' + details + "</div></article>";
        }).join("");
        sections.push('<section class="group"><h1>' + heading + "</h1>" + meta +
          "<h2>Location: " + escapeHtml(location) + "</h2>" + cards +
          '<p class="note">Working count sheet. Selection and results require review under the applicable contract and procedures.</p></section>');
      }
    });
    return printShell(heading, sections.join(""));
  }
  function summaryHtml(stats, setup, importedCount) {
    const rows = [
      ["Imported working records", importedCount],
      ["Selected records", stats.selected],
      ["Counted", stats.counted],
      ["Not yet counted", stats.uncounted],
      ["Matching quantities", stats.matching],
      ["Quantity discrepancies", stats.quantityDiscrepancies],
      ["Location discrepancies", stats.locationDiscrepancies],
      ["Identification discrepancies", stats.identificationDiscrepancies],
      ["Unexpected property entries", stats.unexpected],
      ["Skipped import rows", stats.skipped]
    ];
    const table = rows.map(function (row) { return "<tr><th>" + escapeHtml(row[0]) + "</th><td>" + escapeHtml(row[1]) + "</td></tr>"; }).join("");
    const content = "<h1>Physical inventory working summary</h1><p>Inventory: " + escapeHtml(setup.title) +
      " · Date: " + escapeHtml(setup.date) + " · Site: " + escapeHtml(setup.site) +
      "</p><table><tbody>" + table + '</tbody></table><p class="note">This is a working summary, not an inventory certification or compliance finding. Selection and skipped import rows may limit coverage. Promptly investigate shortages, review unexpected items under record-establishment procedures, and follow applicable reporting and loss procedures. This printout does not submit inventory results.</p>';
    return printShell("Physical inventory working summary", content);
  }
  root.InventoryCore = {
    FIELDS: FIELDS, HEADERS: HEADERS, KEYS: KEYS, RESULT_HEADERS: RESULT_HEADERS, ISSUE_HEADERS: ISSUE_HEADERS,
    MAX_BYTES: MAX_BYTES, MAX_ROWS: MAX_ROWS, parseCsv: parseCsv, suggestedMapping: suggestedMapping,
    validateRecord: validateRecord, importCsv: importCsv, quantity: quantity, variance: variance,
    compareQuantities: compareQuantities, makeWorking: makeWorking, discrepancyTypes: discrepancyTypes,
    summary: summary, csv: csv, resultRows: resultRows, issueRows: issueRows,
    countSheetHtml: countSheetHtml, summaryHtml: summaryHtml, escapeHtml: escapeHtml
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
