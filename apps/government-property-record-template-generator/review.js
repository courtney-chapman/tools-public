/* Local CSV checks only. Results are review prompts, never a compliance verdict. */
(() => {
  "use strict";
  const MAX_BYTES = 2 * 1024 * 1024;
  const MAX_ROWS = 10000;
  const MAX_DISPLAY = 80;
  const fieldCatalog = () => globalThis.GPTemplateCore.FIELDS;
  const issue = (where, message) => ({ where, message });
  const normalized = value => String(value ?? "").trim();
  const key = value => normalized(value).toLowerCase();

  function parseCsv(text) {
    const input = String(text).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], cell = "", quoted = false, closed = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (quoted) {
        if (ch === '"' && input[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') { quoted = false; closed = true; }
        else cell += ch;
      } else if (ch === '"' && cell === "" && !closed) quoted = true;
      else if (ch === "," || ch === "\r" || ch === "\n") {
        row.push(cell); cell = ""; closed = false;
        if (ch !== ",") {
          if (row.some(value => normalized(value) !== "")) rows.push(row);
          row = [];
          if (ch === "\r" && input[i + 1] === "\n") i++;
        }
      } else if (ch === '"' || closed) throw new Error(`Invalid CSV quoting near character ${i + 1}.`);
      else cell += ch;
    }
    if (quoted) throw new Error("The CSV has an unclosed quoted value.");
    if (cell !== "" || row.length) {
      row.push(cell);
      if (row.some(value => normalized(value) !== "")) rows.push(row);
    }
    if (!rows.length) throw new Error("The CSV is empty or has no header row.");
    return rows;
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
  }
  const validNumber = value => /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value));

  function reviewCsv(text, kind, regime) {
    if (!["snapshot", "transaction"].includes(kind)) throw new Error("Choose a supported CSV type.");
    if (!["far", "dfars"].includes(regime)) throw new Error("Choose a supported source set.");
    const rows = parseCsv(text);
    if (rows.length - 1 > MAX_ROWS) throw new Error(`This check accepts at most ${MAX_ROWS.toLocaleString()} data rows per file.`);
    const headers = rows[0].map(normalized);
    const positions = new Map();
    const issues = [];
    headers.forEach((name, index) => {
      if (!name) issues.push(issue("Header", `Column ${index + 1} has no name.`));
      else if (positions.has(key(name))) issues.push(issue("Header", `Duplicate column: ${name}.`));
      else positions.set(key(name), index);
    });
    const catalog = fieldCatalog().filter(f => f.file === kind);
    const field = id => catalog.find(f => f.id === id);
    const has = id => positions.has(key(field(id).name));
    const value = (row, id) => has(id) ? normalized(row[positions.get(key(field(id).name))]) : "";
    for (const f of catalog.filter(f => f.classification === "regulatory")) {
      if (!has(f.id)) issues.push(issue("Header", `Expected template column missing: ${f.name}. See the field dictionary for its FAR citation.`));
    }
    if (regime === "dfars" && kind === "snapshot") {
      for (const id of ["contractCage", "receivedDate", "shippedDate", "serial", "condition"]) {
        if (!has(id)) issues.push(issue("Header", `Expected DFARS template column missing: ${field(id).name}. Its value may be conditional for a particular item or event.`));
      }
      if (!has("nsn") && !has("model") && !(has("mfrCage") && has("mfrPart"))) {
        issues.push(issue("Header", "No DFARS identification alternative is represented: use National Stock Number, Model Number, or both Manufacturer CAGE Code and Manufacturer Part Number."));
      }
    }
    const numberIds = kind === "snapshot" ? ["qtyReceived", "qtyIssued", "balance", "unitCost"] : ["txnReceived", "txnIssued"];
    const dateIds = kind === "snapshot" ? ["serviceDate", "receivedDate", "shippedDate"] : ["transactionDate", "postingEntryDate"];
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      const where = `Data row ${index}`;
      if (row.length !== headers.length) issues.push(issue(where, `Column count is ${row.length}; header has ${headers.length}.`));
      const needed = kind === "snapshot" ? ["name", "part", "description", "balance", "unitCost", "uom", "contract", "location"] : ["postingRef", "transactionDate"];
      for (const id of needed) if (has(id) && !value(row, id)) issues.push(issue(where, `${field(id).name} is blank; review whether the applicable record or supporting documents supply it.`));
      if (kind === "snapshot" && regime === "dfars") {
        if (has("contractCage") && !value(row, "contractCage")) issues.push(issue(where, "Accountable Contract CAGE Code is blank under the selected DFARS source set."));
        if (!value(row, "nsn") && !value(row, "model") && !(value(row, "mfrCage") && value(row, "mfrPart"))) {
          issues.push(issue(where, "No NSN or DFARS alternative identifier is populated; review this item's identification."));
        }
      }
      if (kind === "transaction" && has("transactionType")) {
        const type = value(row, "transactionType").toLowerCase();
        if (["receipt", "fabrication"].includes(type) && has("txnReceived") && !value(row, "txnReceived")) issues.push(issue(where, "Quantity Received or Fabricated is blank for a receipt/fabrication row."));
        if (type === "issue" && has("txnIssued") && !value(row, "txnIssued")) issues.push(issue(where, "Quantity Issued is blank for an issue row."));
      }
      for (const id of numberIds) if (has(id) && value(row, id) && !validNumber(value(row, id))) issues.push(issue(where, `${field(id).name} should be a nonnegative number without commas or currency symbols.`));
      for (const id of dateIds) if (has(id) && value(row, id) && !validDate(value(row, id))) issues.push(issue(where, `${field(id).name} should be a real date in YYYY-MM-DD format.`));
    }
    return { dataRows: rows.length - 1, issues };
  }

  function addText(parent, tag, content) {
    const element = document.createElement(tag);
    element.textContent = content;
    parent.append(element);
    return element;
  }
  async function reviewSelectedFiles() {
    const target = document.getElementById("review-results");
    target.replaceChildren();
    const files = [
      ["snapshot", document.getElementById("snapshot-upload").files[0]],
      ["transaction", document.getElementById("transaction-upload").files[0]]
    ].filter(([, file]) => !!file);
    if (!files.length) { addText(target, "p", "Choose at least one CSV file to check."); return; }
    const regime = globalThis.GPTemplateCore.current.regime;
    addText(target, "p", `Checking ${files.length} local file${files.length === 1 ? "" : "s"} against the selected ${regime === "dfars" ? "FAR + DFARS" : "FAR"} template fields. No compliance verdict is produced.`);
    for (const [kind, file] of files) {
      const title = kind === "snapshot" ? "Property snapshot" : "Transaction history";
      addText(target, "h3", title);
      if (file.size > MAX_BYTES) { addText(target, "p", "File is larger than the 2 MB review limit. No rows were checked."); continue; }
      try {
        const result = reviewCsv(await file.text(), kind, regime);
        addText(target, "p", `${result.dataRows} data row${result.dataRows === 1 ? "" : "s"} read; ${result.issues.length} issue${result.issues.length === 1 ? "" : "s"} to review. This is not a compliance finding.`);
        if (result.issues.length) {
          const list = document.createElement("ul");
          result.issues.slice(0, MAX_DISPLAY).forEach(entry => addText(list, "li", `${entry.where}: ${entry.message}`));
          target.append(list);
          if (result.issues.length > MAX_DISPLAY) addText(target, "p", `Showing the first ${MAX_DISPLAY} issues. Review a smaller file for the remaining rows.`);
        } else addText(target, "p", "No issues found by these limited checks. Contract applicability, conditional fields, accuracy, and complete transaction support still need review.");
      } catch (error) { addText(target, "p", `Could not check this CSV: ${error.message}`); }
    }
  }
  function init() {
    document.getElementById("review-files").addEventListener("click", reviewSelectedFiles);
    document.getElementById("clear-review").addEventListener("click", () => {
      document.getElementById("snapshot-upload").value = "";
      document.getElementById("transaction-upload").value = "";
      document.getElementById("review-results").replaceChildren();
    });
    document.getElementById("regime").addEventListener("change", () => document.getElementById("review-results").replaceChildren());
  }
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
  if (typeof globalThis !== "undefined") globalThis.GPReviewCore = { parseCsv, validDate, validNumber, reviewCsv, MAX_BYTES, MAX_ROWS };
})();
