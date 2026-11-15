/* Browser interface. All working values remain in memory until reset or reload. */
(function () {
  "use strict";
  const core = globalThis.InventoryCore;
  const state = { records: [], selected: new Set(), unexpected: [], skipped: 0, pendingCsv: null, pendingRows: null, pendingOutcome: null, resultsPage: 0 };
  const RESULTS_PAGE_SIZE = 12;
  const $ = function (id) { return document.getElementById(id); };
  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text != null) item.textContent = String(text);
    if (className) item.className = className;
    return item;
  }
  function clear(element) { element.replaceChildren(); }
  function message(target, title, entries) {
    clear(target);
    if (title) target.append(node("strong", title));
    if (entries && entries.length) {
      const list = node("ul");
      entries.slice(0, 30).forEach(function (entry) { list.append(node("li", entry)); });
      target.append(list);
      if (entries.length > 30) target.append(node("p", "Showing the first 30 of " + entries.length + " messages."));
    }
  }
  function showStep() {
    const matched = /^#step-([1-4])$/.exec(location.hash);
    const step = matched ? Number(matched[1]) : 1;
    for (let number = 1; number <= 4; number++) $("step-" + number).hidden = number !== step;
    document.querySelectorAll(".page-nav a").forEach(function (link) {
      if (Number(link.dataset.step) === step) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  }
  function setup() {
    return {
      title: $("inventory-title").value.trim(),
      date: $("inventory-date").value,
      site: $("inventory-site").value.trim(),
      area: $("inventory-area").value.trim(),
      counter: $("inventory-counter").value.trim(),
      notes: $("inventory-notes").value.trim()
    };
  }
  function download(filename, content) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = node("a");
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function printDocument(html) {
    const popup = window.open("", "_blank");
    if (!popup) { alert("Allow this page to open a print preview window, then try again."); return; }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
  }
  function displayPreview(rows) {
    const table = $("import-preview");
    clear(table);
    const head = node("thead"), headRow = node("tr");
    rows[0].forEach(function (value) { headRow.append(node("th", value)); });
    head.append(headRow); table.append(head);
    const body = node("tbody");
    rows.slice(1, 6).forEach(function (row) {
      const line = node("tr");
      row.forEach(function (value) { line.append(node("td", value)); });
      body.append(line);
    });
    table.append(body);
  }
  function displayMapping(headers) {
    const area = $("mapping-fields");
    clear(area);
    const hints = core.suggestedMapping(headers);
    core.FIELDS.forEach(function (field) {
      const label = node("label", field[1] + (["recordId", "description", "recordedQty", "uom"].includes(field[0]) ? " *" : ""));
      const select = node("select");
      select.dataset.field = field[0];
      const none = node("option", "Do not map"); none.value = "-1"; select.append(none);
      headers.forEach(function (header, index) {
        const option = node("option", (index + 1) + ": " + (header || "(blank header)"));
        option.value = String(index); select.append(option);
      });
      select.value = String(hints[field[0]]);
      label.append(select); area.append(label);
    });
  }
  async function chooseFile() {
    const file = $("import-file").files[0];
    $("mapping-area").hidden = true;
    state.pendingCsv = null; state.pendingRows = null; state.pendingOutcome = null;
    if (!file) { clear($("import-feedback")); return; }
    if (file.size > core.MAX_BYTES) { message($("import-feedback"), "CSV exceeds the 2 MB limit."); return; }
    try {
      const text = await file.text();
      const rows = core.parseCsv(text);
      if (rows.length < 2) throw new Error("CSV has no data rows.");
      state.pendingCsv = text; state.pendingRows = rows;
      displayMapping(rows[0]); displayPreview(rows);
      $("mapping-area").hidden = false;
      assessImport();
    } catch (error) { message($("import-feedback"), "Could not read CSV: " + error.message); }
  }
  function currentMapping() {
    const mapping = {};
    $("mapping-fields").querySelectorAll("select").forEach(function (select) { mapping[select.dataset.field] = Number(select.value); });
    return mapping;
  }
  function downloadSkipped(skipped) {
    const rows = skipped.map(function (item) { return [String(item.line), item.reason]; });
    download("inventory-skipped-rows.csv", core.csv(["CSV Row", "Reason"], rows));
  }
  function assessImport() {
    state.pendingOutcome = null;
    $("accept-import").disabled = true;
    if (!state.pendingCsv) return;
    let outcome;
    try { outcome = core.importCsv(state.pendingCsv, currentMapping()); }
    catch (error) { message($("import-feedback"), "Map the columns to preview the import: " + error.message); return; }
    state.pendingOutcome = outcome;
    $("accept-import").disabled = !outcome.accepted.length;
    $("accept-import").textContent = "Use " + outcome.accepted.length + " valid rows" +
      (outcome.skipped.length ? " (skip " + outcome.skipped.length + ")" : "");
    message($("import-feedback"), "Preview: " + outcome.accepted.length + " valid, " + outcome.skipped.length +
      " skipped, " + outcome.warnings.length + " warning(s). Review skipped rows before accepting.",
      outcome.skipped.map(function (item) { return "Row " + item.line + ": " + item.reason; })
        .concat(outcome.warnings.map(function (item) { return "Row " + item.line + " warning: " + item.reason; })));
    if (outcome.skipped.length) {
      const button = node("button", "Download all skipped-row reasons", "secondary");
      button.id = "download-skipped"; button.type = "button";
      button.addEventListener("click", function () { downloadSkipped(outcome.skipped); });
      $("import-feedback").append(button);
    }
  }
  function acceptImport() {
    const outcome = state.pendingOutcome;
    if (!outcome || !outcome.accepted.length) return;
    const details = outcome.skipped.length + " row(s) will be skipped. " + outcome.accepted.length + " valid row(s) will load.";
    if ((state.records.length || outcome.skipped.length) &&
      !confirm((state.records.length ? "Replace the current " + state.records.length + " working records? " : "Accept this partial import? ") + details)) return;
    state.records = outcome.accepted.map(core.makeWorking);
    state.selected = new Set(state.records.map(function (record) { return record.recordId; }));
    state.unexpected = [];
    state.skipped = outcome.skipped.length;
    state.resultsPage = 0;
    message($("import-feedback"), "Loaded " + outcome.accepted.length + " valid rows. Skipped " + outcome.skipped.length + ". Review omissions before using the count sheets.",
      outcome.skipped.map(function (item) { return "Row " + item.line + ": " + item.reason; }).concat(outcome.warnings.map(function (item) { return "Row " + item.line + " warning: " + item.reason; })));
    const existing = $("download-skipped");
    if (existing) existing.remove();
    if (outcome.skipped.length) {
      const button = node("button", "Download all skipped-row reasons", "secondary");
      button.id = "download-skipped"; button.type = "button";
      button.addEventListener("click", function () { downloadSkipped(outcome.skipped); });
      $("import-feedback").append(button);
    }
    renderAll();
  }
  function addManual(event) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = core.validateRecord(raw);
    if (result.record.recordId && state.records.some(function (record) { return record.recordId.toLowerCase() === result.record.recordId.toLowerCase(); })) result.errors.push("Record ID already exists.");
    if (result.errors.length) { message($("manual-feedback"), "Record not added.", result.errors); return; }
    const possibleDuplicate = result.record.assetId && state.records.some(function (record) { return record.assetId && record.assetId.toLowerCase() === result.record.assetId.toLowerCase(); });
    state.records.push(core.makeWorking(result.record));
    state.selected.add(result.record.recordId);
    event.currentTarget.reset();
    message($("manual-feedback"), "Record added.", result.warnings.concat(possibleDuplicate ? ["Potential duplicate Asset Identifier; review before counting."] : []));
    renderAll();
  }
  function renderRecords() {
    $("record-count").textContent = String(state.records.length);
    const omissions = $("import-omissions");
    omissions.hidden = !state.skipped;
    omissions.textContent = state.skipped ? state.skipped + " CSV row(s) were skipped. The working inventory may be incomplete." : "";
    const target = $("records-list"); clear(target);
    if (!state.records.length) { target.append(node("p", "No working records yet.", "record-line")); return; }
    state.records.slice(0, 30).forEach(function (record) {
      const line = node("div", null, "record-line");
      line.append(node("strong", record.recordId + " · " + record.description));
      line.append(node("small", " · " + (record.assetId || "No asset ID") + " · " + (record.location || "Unspecified location") + " · " + record.recordedQty + " " + record.uom));
      target.append(line);
    });
    if (state.records.length > 30) target.append(node("p", "Showing the first 30 of " + state.records.length + " records. All records are available in the next step.", "record-line"));
  }
  function refreshLocationOptions() {
    const select = $("filter-location");
    const current = select.value; clear(select);
    const all = node("option", "All locations"); all.value = ""; select.append(all);
    const values = Array.from(new Set(state.records.map(function (record) { return record.location || "Unspecified location"; }))).sort();
    values.forEach(function (value) { const option = node("option", value); option.value = value; select.append(option); });
    select.value = values.includes(current) ? current : "";
  }
  function visibleRecords(searchInput, locationFilter) {
    const term = searchInput.value.trim().toLowerCase();
    const location = locationFilter ? locationFilter.value : "";
    const sort = $("sort-records").value;
    return state.records.filter(function (record) {
      return (!location || (record.location || "Unspecified location") === location) &&
        (!term || [record.recordId, record.assetId, record.description, record.partNumber, record.serialNumber].some(function (value) { return value.toLowerCase().includes(term); }));
    }).sort(function (a, b) {
      const first = sort === "location" ? (a.location || "") : a[sort];
      const second = sort === "location" ? (b.location || "") : b[sort];
      return first.localeCompare(second) || a.recordId.localeCompare(b.recordId);
    });
  }
  function renderSelection() {
    const target = $("selection-list"); clear(target);
    const visible = visibleRecords($("find-record"), $("filter-location"));
    if (!visible.length) target.append(node("p", "No matching records.", "selection-line"));
    let lastLocation = null;
    visible.forEach(function (record) {
      const location = record.location || "Unspecified location";
      if ($("sort-records").value === "location" && location !== lastLocation) {
        target.append(node("h4", location, "group-title"));
        lastLocation = location;
      }
      const line = node("div", null, "selection-line");
      const label = node("label");
      const checkbox = node("input"); checkbox.type = "checkbox"; checkbox.checked = state.selected.has(record.recordId);
      checkbox.dataset.recordId = record.recordId;
      label.append(checkbox, node("strong", record.recordId + " · " + record.description),
        node("small", " · " + (record.location || "Unspecified location") + " · " + (record.assetId || record.partNumber || "No other ID")));
      line.append(label); target.append(line);
    });
    $("selection-count").textContent = state.selected.size + " of " + state.records.length + " selected";
    const warning = $("selection-warning");
    warning.hidden = !(state.skipped || state.selected.size !== state.records.length);
    warning.textContent = "Working scope: " + state.selected.size + " of " + state.records.length + " loaded records selected" +
      (state.skipped ? "; " + state.skipped + " imported row(s) skipped" : "") + ". Selection does not establish complete inventory coverage.";
    $("print-standard").disabled = !state.selected.size;
    $("print-blind").disabled = !state.selected.size;
  }
  function selectedRecords() {
    return state.records.filter(function (record) { return state.selected.has(record.recordId); });
  }
  function renderStats() {
    const stats = core.summary(state.records, state.selected, state.unexpected, state.skipped);
    const entries = [
      ["Selected", stats.selected], ["Counted", stats.counted], ["Not counted", stats.uncounted],
      ["Matching quantity", stats.matching], ["Quantity differences", stats.quantityDiscrepancies],
      ["Location differences", stats.locationDiscrepancies], ["ID differences", stats.identificationDiscrepancies],
      ["Unexpected", stats.unexpected]
    ];
    const target = $("summary-cards"); clear(target);
    entries.forEach(function (entry) {
      const card = node("div", null, "stat");
      card.append(node("strong", entry[1]), node("span", entry[0])); target.append(card);
    });
    const invalid = selectedRecords().some(function (record) { return record.observedQty.trim() && !core.quantity(record.observedQty); });
    const warning = $("results-warning");
    warning.hidden = !(state.skipped || state.selected.size !== state.records.length || invalid);
    const pieces = [];
    if (state.skipped) pieces.push(state.skipped + " imported row(s) were skipped");
    if (state.selected.size !== state.records.length) pieces.push("only " + state.selected.size + " of " + state.records.length + " loaded records are selected");
    if (invalid) pieces.push("correct invalid observed quantities before export");
    warning.textContent = pieces.join("; ") + ".";
    ["download-results", "download-issues", "print-summary"].forEach(function (id) { $(id).disabled = !state.selected.size || invalid; });
  }
  function observationInput(record, name, label, multiline) {
    const container = node("label", label);
    const input = node(multiline ? "textarea" : "input");
    if (multiline) input.rows = 2;
    else input.type = "text";
    input.value = record[name] || "";
    input.dataset.recordId = record.recordId;
    input.dataset.field = name;
    if (name === "observedQty") { input.inputMode = "decimal"; input.placeholder = "Blank = not counted"; }
    container.append(input);
    return container;
  }
  function renderResults() {
    const target = $("results-list"); clear(target);
    const term = $("find-result").value.trim().toLowerCase();
    const visible = selectedRecords().filter(function (record) {
      return !term || [record.recordId, record.assetId, record.description, record.partNumber].some(function (value) { return value.toLowerCase().includes(term); });
    });
    if (!visible.length) target.append(node("p", state.selected.size ? "No matching selected records." : "Select records in step 3 first.", "record-line"));
    const pages = Math.max(1, Math.ceil(visible.length / RESULTS_PAGE_SIZE));
    state.resultsPage = Math.min(state.resultsPage, pages - 1);
    visible.slice(state.resultsPage * RESULTS_PAGE_SIZE, (state.resultsPage + 1) * RESULTS_PAGE_SIZE).forEach(function (record) {
      const card = node("div", null, "result-card");
      card.append(node("h3", record.recordId + " · " + record.description));
      card.append(node("p", "Recorded: " + record.recordedQty + " " + record.uom + " · " + (record.location || "Unspecified location") + " · " + (record.assetId || record.partNumber || "No other ID")));
      const fields = node("div", null, "result-fields");
      [
        ["observedQty", "Observed quantity"],
        ["observedLocation", "Observed location"],
        ["observedAssetId", "Observed asset identifier"],
        ["observedSerial", "Observed serial number"],
        ["condition", "Condition"],
        ["notes", "Discrepancy / condition notes"]
      ].forEach(function (entry) { fields.append(observationInput(record, entry[0], entry[1], entry[0] === "notes")); });
      card.append(fields);
      const flag = node("p", "", "result-flag");
      flag.dataset.flagId = record.recordId;
      updateRecordFlag(record, flag);
      card.append(flag); target.append(card);
    });
    $("results-page-label").textContent = visible.length ? "Page " + (state.resultsPage + 1) + " of " + pages + " · " + visible.length + " matching selected records" : "No matching records";
    $("results-prev").disabled = state.resultsPage === 0;
    $("results-next").disabled = state.resultsPage >= pages - 1;
    renderStats();
  }
  function updateRecordFlag(record, element) {
    const types = core.discrepancyTypes(record);
    element.textContent = types.length ? types.join(" · ") + " — review required" : "Quantity counted; no entered differences detected. Location and identifiers are not verified unless observed values are entered.";
  }
  function changeObservation(event) {
    const input = event.target.closest("[data-record-id][data-field]");
    if (!input) return;
    const record = state.records.find(function (item) { return item.recordId === input.dataset.recordId; });
    if (!record) return;
    record[input.dataset.field] = input.value;
    if (input.dataset.field === "observedQty") {
      input.setCustomValidity(input.value.trim() && !core.quantity(input.value) ? "Enter a nonnegative decimal, or leave blank for not counted." : "");
    }
    const flag = Array.from($("results-list").querySelectorAll("[data-flag-id]")).find(function (item) { return item.dataset.flagId === record.recordId; });
    if (flag) updateRecordFlag(record, flag);
    renderStats();
  }
  function addUnexpected(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!values.description.trim() || !values.uom.trim() || !core.quantity(values.observedQty)) {
      message($("unexpected-feedback"), "Enter a description, unit of measure, and nonnegative observed quantity."); return;
    }
    state.unexpected.push(Object.fromEntries(Object.entries(values).map(function (entry) { return [entry[0], entry[1].trim()]; })));
    event.currentTarget.reset();
    message($("unexpected-feedback"), "Unexpected property added for review.");
    renderUnexpected(); renderStats();
  }
  function renderUnexpected() {
    const target = $("unexpected-list"); clear(target);
    state.unexpected.forEach(function (item, index) {
      const line = node("div", null, "record-line");
      line.append(node("strong", item.description + " · " + item.observedQty + " " + item.uom));
      line.append(node("small", " · " + (item.location || "Location not entered")));
      const remove = node("button", "Remove", "secondary");
      remove.type = "button"; remove.dataset.unexpectedIndex = String(index);
      line.append(remove); target.append(line);
    });
  }
  function renderAll() {
    renderRecords(); refreshLocationOptions(); renderSelection(); renderResults(); renderUnexpected();
  }
  function init() {
    window.addEventListener("hashchange", showStep); showStep();
    $("import-file").addEventListener("change", chooseFile);
    $("mapping-fields").addEventListener("change", assessImport);
    $("accept-import").addEventListener("click", acceptImport);
    $("manual-form").addEventListener("submit", addManual);
    ["sort-records", "filter-location", "find-record"].forEach(function (id) { $(id).addEventListener(id === "find-record" ? "input" : "change", renderSelection); });
    $("selection-list").addEventListener("change", function (event) {
      const input = event.target.closest("[data-record-id]");
      if (!input) return;
      if (input.checked) state.selected.add(input.dataset.recordId);
      else state.selected.delete(input.dataset.recordId);
      renderSelection(); renderResults();
    });
    $("select-all").addEventListener("click", function () {
      visibleRecords($("find-record"), $("filter-location")).forEach(function (record) { state.selected.add(record.recordId); });
      renderSelection(); renderResults();
    });
    $("select-none").addEventListener("click", function () {
      visibleRecords($("find-record"), $("filter-location")).forEach(function (record) { state.selected.delete(record.recordId); });
      renderSelection(); renderResults();
    });
    ["standard", "blind"].forEach(function (kind) {
      $("print-" + kind).addEventListener("click", function () {
        const chosen = selectedRecords();
        if (chosen.length) printDocument(core.countSheetHtml(chosen, setup(), { blind: kind === "blind" }));
      });
    });
    $("find-result").addEventListener("input", function () { state.resultsPage = 0; renderResults(); });
    $("results-prev").addEventListener("click", function () { state.resultsPage--; renderResults(); });
    $("results-next").addEventListener("click", function () { state.resultsPage++; renderResults(); });
    $("results-list").addEventListener("input", changeObservation);
    $("unexpected-form").addEventListener("submit", addUnexpected);
    $("unexpected-list").addEventListener("click", function (event) {
      const button = event.target.closest("[data-unexpected-index]");
      if (!button) return;
      state.unexpected.splice(Number(button.dataset.unexpectedIndex), 1);
      renderUnexpected(); renderStats();
    });
    $("download-results").addEventListener("click", function () {
      download("inventory-results.csv", core.csv(core.RESULT_HEADERS, core.resultRows(state.records, state.selected, state.unexpected), [5, 6, 7]));
    });
    $("download-issues").addEventListener("click", function () {
      download("inventory-discrepancies.csv", core.csv(core.ISSUE_HEADERS, core.issueRows(state.records, state.selected, state.unexpected)));
    });
    $("print-summary").addEventListener("click", function () {
      printDocument(core.summaryHtml(core.summary(state.records, state.selected, state.unexpected, state.skipped), setup(), state.records.length));
    });
    $("reset-all").addEventListener("click", function () {
      if ((state.records.length || state.unexpected.length) && !confirm("Clear all working records and observations from this browser session?")) return;
      state.records = []; state.selected = new Set(); state.unexpected = []; state.skipped = 0;
      state.pendingCsv = null; state.pendingRows = null; state.pendingOutcome = null;
      state.resultsPage = 0;
      document.querySelectorAll("input,textarea").forEach(function (input) { if (input.type !== "button") input.value = ""; });
      clear($("import-feedback")); clear($("manual-feedback")); clear($("unexpected-feedback"));
      $("mapping-area").hidden = true;
      const downloadButton = $("download-skipped"); if (downloadButton) downloadButton.remove();
      $("filter-location").value = ""; $("sort-records").value = "location";
      renderAll(); location.hash = "#step-1";
    });
    renderAll();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
