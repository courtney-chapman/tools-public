/* Browser-only preparation workspace. No network, persistence, or disposition decisions. */
(() => {
  "use strict";
  const C = globalThis.DispositionCore;
  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const formIds = ["prep-reference", "prep-date", "prep-site", "prep-preparer", "prep-contract", "prep-location", "prep-reason", "prep-determination-date", "prep-dod", "prep-special", "prep-subcontractor", "prep-contact", "prep-remarks", "doc-record", "doc-acquisition", "doc-inventory", "doc-contract", "doc-correspondence", "doc-instructions", "doc-questions"];
  const labels = Object.fromEntries(C.FIELDS);
  const checklist = [
    { section: "Property identification", items: [
      ["description", "Property descriptions and identifiers reviewed", "Preparation check"],
      ["quantity", "Quantities and units reviewed", "Preparation check"],
      ["location", "Current locations identified", "Preparation check"],
      ["contract", "Accountable contract references identified", "Preparation check"]
    ]},
    { section: "Property status", items: [
      ["reason", "Reason property is no longer needed documented", "Clause-linked review · FAR 52.245-1(f)(1)(viii)(A) when applicable"],
      ["origin", "GFP, CAP, or unknown origin noted for review", "Preparation check"],
      ["category", "Property category and condition considered", "Preparation check"],
      ["special", "If special handling may apply, the question is referred for review", "Conditional review · FAR 52.245-1(j)(2)"],
      ["closeout", "If completing or terminating, separate inventory and closeout duties considered", "Conditional review · FAR 52.245-1(f)(1)(iv), (x)"]
    ]},
    { section: "Supporting documentation", items: [
      ["record", "Relevant property record identified", "Preparation check"],
      ["receipt", "Acquisition or receipt support identified, if relevant", "Preparation check"],
      ["inventory", "Available inventory information identified", "Preparation check"],
      ["contractDocs", "Relevant contract or modification identified", "Preparation check"],
      ["correspondence", "Prior disposition correspondence identified, if any", "Preparation check"]
    ]},
    { section: "Government coordination and review", items: [
      ["contact", "Applicable Government point of contact identified or question noted", "Preparation check"],
      ["direction", "Need for Government instructions flagged; any existing direction referenced", "Government authority boundary · FAR 52.245-1(j)"],
      ["dod", "If DFARS 252.245-7005 applies, GFP Module requirements referred for review", "Conditional review · DFARS 252.245-7005(b), (e)"],
      ["subcontractor", "If property is at a subcontractor, coordination and reporting referred for review", "Conditional review · FAR 52.245-1(j)(9)"],
      ["missing", "Preparation exceptions and unresolved questions reviewed", "Preparation check"],
      ["internal", "Working package ready for internal review", "Optional preparation practice"]
    ]},
    { section: "Optional public assessment prompts", audit: true, items: [
      ["auditExcess", "Review available evidence used to identify property excess to contract needs", "Audit guidance · DCMA Job Aid Rev. 4, Element 15"],
      ["auditDisposition", "Review available evidence of prior disposition actions, if any", "Audit guidance · DCMA Job Aid Rev. 4, Element 21"]
    ]}
  ];
  let items = [], nextUid = 1, importRows = null, importResult = null, previewMode = "summary";
  const checklistState = {};

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = String(content);
    return node;
  }
  function addText(parent, tag, content, className) { const node = element(tag, className, content); parent.append(node); return node; }
  function showStep() {
    const match = /^#step-([1-4])$/.exec(location.hash);
    const active = match ? match[1] : "1";
    document.querySelectorAll(".step-panel").forEach(panel => { panel.hidden = panel.dataset.step !== active; });
    document.querySelectorAll("[data-step-link]").forEach(link => {
      if (link.dataset.stepLink === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    if (active === "4") renderReview();
  }
  function context() {
    return { reference: value("prep-reference"), date: value("prep-date"), site: value("prep-site"),
      preparer: value("prep-preparer"), contract: value("prep-contract"), location: value("prep-location"),
      reason: value("prep-reason"), determinationDate: value("prep-determination-date"),
      dod: value("prep-dod"), special: value("prep-special"), subcontractor: value("prep-subcontractor"),
      contact: value("prep-contact"), remarks: value("prep-remarks") };
  }
  function documentation() {
    return { record: value("doc-record"), acquisition: value("doc-acquisition"),
      inventory: value("doc-inventory"), contract: value("doc-contract"),
      correspondence: value("doc-correspondence"), instructions: value("doc-instructions"),
      questions: value("doc-questions") };
  }
  function allChecklistItems() { return checklist.flatMap(group => group.audit && !byId("show-audit").checked ? [] : group.items); }
  function itemTitle(item, index) { return `${item.description || "Untitled item"} · ${item.recordId || `row ${index + 1}`}`; }
  function sortedItems() {
    const field = value("sort-items"), groupBy = value("group-items");
    const result = items.slice();
    result.sort((a, b) => {
      const groupOrder = groupBy === "none" ? 0 : a.data[groupBy].localeCompare(b.data[groupBy], undefined, { sensitivity: "base", numeric: true });
      const fieldOrder = field === "entry" ? 0 : a.data[field].localeCompare(b.data[field], undefined, { sensitivity: "base", numeric: true });
      return groupOrder || fieldOrder || a.uid - b.uid;
    });
    return result;
  }
  function appendField(parent, entry, key) {
    const label = element("label");
    label.textContent = labels[key];
    let control;
    if (key === "origin" || key === "category") {
      control = element("select");
      const options = key === "origin" ? ["", "GFP", "CAP", "Unknown"] : ["", "Material", "Equipment", "Other"];
      options.forEach(option => { const opt = element("option", "", option || "Not entered"); opt.value = option; control.append(opt); });
    } else if (key === "remarks") {
      control = element("textarea"); control.rows = 2;
    } else {
      control = element("input"); control.type = "text";
      if (key === "quantity" || key === "unitCost") control.inputMode = "decimal";
    }
    control.dataset.key = key;
    control.maxLength = key === "remarks" ? 1000 : key === "description" ? 400 : 160;
    control.value = entry.data[key] || "";
    label.append(control); parent.append(label);
  }
  function renderItems(openUid) {
    const list = byId("item-list"); list.replaceChildren();
    byId("item-count").textContent = String(items.length);
    const groupBy = value("group-items");
    let lastGroup = null;
    sortedItems().forEach(entry => {
      if (groupBy !== "none") {
        const group = entry.data[groupBy] || "Not entered";
        if (group !== lastGroup) { addText(list, "h4", `${groupBy === "contract" ? "Contract" : "Location"}: ${group}`, "group-heading"); lastGroup = group; }
      }
      const card = element("details", "item-card"); card.dataset.uid = String(entry.uid);
      if (entry.uid === openUid) card.open = true;
      addText(card, "summary", itemTitle(entry.data, items.indexOf(entry)), "item-summary");
      const fields = element("div", "item-fields");
      C.KEYS.forEach(key => appendField(fields, entry, key));
      card.append(fields);
      const actions = element("div", "actions"); const remove = addText(actions, "button", "Remove item", "quiet");
      remove.type = "button"; remove.dataset.remove = String(entry.uid); card.append(actions); list.append(card);
    });
    if (!items.length) addText(list, "p", "No property items yet. Add one or import a CSV.", "helper");
  }
  function addItem(data = {}) {
    const entry = { uid: nextUid++, data: C.normalizeItem(data) };
    items.push(entry); renderItems(entry.uid); return entry;
  }
  function renderChecklist() {
    const host = byId("checklist-sections"); host.replaceChildren();
    checklist.forEach(group => {
      if (group.audit && !byId("show-audit").checked) return;
      const section = element("section", "check-group"); addText(section, "h3", group.section);
      if (group.audit) addText(section, "p", "Optional assessment guidance; all statuses begin unset.", "helper");
      group.items.forEach(([id, title, classification]) => {
        const row = element("div", "check-row");
        const heading = element("div"); addText(heading, "strong", title); addText(heading, "small", classification, "classification");
        row.append(heading);
        const statusLabel = element("label"); statusLabel.textContent = "Status";
        const select = element("select"); select.dataset.checkId = id;
        ["", "Complete", "Incomplete", "Not Applicable", "Requires Review"].forEach(option => {
          const node = element("option", "", option || "Not marked"); node.value = option; select.append(node);
        });
        select.value = checklistState[id]?.status || ""; statusLabel.append(select); row.append(statusLabel);
        const noteLabel = element("label", "note-label"); noteLabel.textContent = "Optional note";
        const note = element("input"); note.type = "text"; note.maxLength = 500; note.dataset.noteId = id;
        note.value = checklistState[id]?.note || ""; noteLabel.append(note); row.append(noteLabel);
        section.append(row);
      });
      host.append(section);
    });
  }
  function renderList(parent, values, empty) {
    parent.replaceChildren();
    if (!values.length) { addText(parent, "li", empty); return; }
    values.forEach(entry => addText(parent, "li", entry));
  }
  function reviewData() {
    const records = items.map(entry => entry.data);
    const ctx = context(), docs = documentation();
    const prep = C.preparationExceptions(records, ctx);
    const reviews = prep.warnings.slice();
    if (ctx.dod !== "no") reviews.push("Check the actual contract for DFARS 252.245-7005 and any GFP Module requirements.");
    if (ctx.special !== "no") reviews.push("Check whether special handling or a separate schedule is needed.");
    if (ctx.subcontractor !== "no") reviews.push("Check any subcontractor-held property and coordination requirements.");
    if (ctx.reason === "Contract completion" || ctx.reason === "Contract termination") reviews.push("Review separate final inventory, termination, and closeout requirements.");
    if (!ctx.contact) reviews.push("Government point of contact has not been identified.");
    if (!docs.instructions) reviews.push("Existing Government disposition instructions have not been identified here; seek direction as applicable.");
    const requiringStatus = allChecklistItems().filter(([id]) => ["Incomplete", "Requires Review"].includes(checklistState[id]?.status));
    requiringStatus.forEach(([, title]) => reviews.push(`Checklist marked for review: ${title}.`));
    const categories = [...new Set(records.map(item => item.category).filter(Boolean))];
    const identifiedDocs = Object.entries(docs).filter(([key, val]) => key !== "questions" && val).map(([key, val]) => [key, val]);
    return { records, ctx, docs, prep, reviews, categories, identifiedDocs };
  }
  function stat(parent, number, caption) {
    const box = element("div", "stat"); addText(box, "strong", number); addText(box, "span", caption); parent.append(box);
  }
  function renderReview() {
    const data = reviewData();
    const stats = byId("review-stats"); stats.replaceChildren();
    stat(stats, data.records.length, "Property items"); stat(stats, data.prep.issues.length, "Preparation exceptions");
    stat(stats, data.reviews.length, "Review prompts"); stat(stats, data.categories.length, "Categories entered");
    renderList(byId("exceptions-list"), data.prep.issues, "No preparation exceptions currently detected.");
    renderList(byId("review-list"), data.reviews, "No additional review prompts currently detected.");
    renderPrint(previewMode, data);
  }
  function definition(parent, label, content) {
    const row = element("p", "print-field"); addText(row, "strong", `${label}: `); row.append(document.createTextNode(content || "Not entered")); parent.append(row);
  }
  function printList(parent, values, empty) {
    const list = element("ul");
    (values.length ? values : [empty]).forEach(value => addText(list, "li", value));
    parent.append(list);
  }
  function renderPrint(mode, data = reviewData()) {
    const sheet = byId("print-sheet"); sheet.replaceChildren();
    addText(sheet, "p", "Government Property · Working preparation document · Revision 1", "print-kicker");
    addText(sheet, "h2", mode === "checklist" ? "Disposition preparation checklist" : "Disposition preparation summary");
    const meta = element("div", "print-meta");
    definition(meta, "Preparation reference", data.ctx.reference); definition(meta, "Preparation date", data.ctx.date);
    definition(meta, "Accountable contract reference", data.ctx.contract); definition(meta, "Organization or site", data.ctx.site);
    sheet.append(meta);
    if (mode === "checklist") {
      checklist.forEach(group => {
        if (group.audit && !byId("show-audit").checked) return;
        addText(sheet, "h3", group.section);
        const table = element("table", "print-table");
        const header = element("tr"); ["Preparation item", "Status", "Note"].forEach(text => addText(header, "th", text)); table.append(header);
        group.items.forEach(([id, title, classification]) => {
          const row = element("tr");
          const titleCell = element("td"); addText(titleCell, "strong", title); addText(titleCell, "small", classification, "classification"); row.append(titleCell);
          addText(row, "td", checklistState[id]?.status || "Not marked"); addText(row, "td", checklistState[id]?.note || "");
          table.append(row);
        }); sheet.append(table);
      });
      addText(sheet, "h3", "Preparation exceptions"); printList(sheet, data.prep.issues, "None currently detected.");
      addText(sheet, "h3", "Unresolved questions"); definition(sheet, "Questions", data.docs.questions);
    } else {
      definition(sheet, "Reason being considered", data.ctx.reason);
      definition(sheet, "Date determined no longer needed", data.ctx.determinationDate);
      definition(sheet, "Preparer", data.ctx.preparer);
      definition(sheet, "General location", data.ctx.location);
      addText(sheet, "h3", "Working totals");
      definition(sheet, "Property items", String(data.records.length));
      definition(sheet, "Categories represented", data.categories.join(", ") || "Not entered");
      definition(sheet, "Preparation exceptions", String(data.prep.issues.length));
      definition(sheet, "Review prompts", String(data.reviews.length));
      addText(sheet, "h3", "Supporting documents identified");
      printList(sheet, data.identifiedDocs.map(([key, val]) => `${({record:"Property record",acquisition:"Acquisition or receipt",inventory:"Inventory information",contract:"Contract/modification",correspondence:"Prior correspondence",instructions:"Existing instructions"})[key]}: ${val}`), "None entered.");
      addText(sheet, "h3", "Government coordination and open questions");
      definition(sheet, "Point of contact", data.ctx.contact);
      definition(sheet, "Unresolved questions", data.docs.questions);
      printList(sheet, data.reviews, "No additional review prompts currently detected.");
      addText(sheet, "h3", "Preparation exceptions"); printList(sheet, data.prep.issues, "None currently detected.");
    }
    addText(sheet, "p", "Working preparation document only. This does not determine disposition authority, provide Government instructions, authorize disposal, or establish regulatory compliance. Follow applicable contracts, procedures, and Government direction.", "print-limit");
  }
  function displayImport(result) {
    const host = byId("import-preview"); host.replaceChildren();
    addText(host, "p", `${result.accepted.length} valid rows ready; ${result.errors.length} rows skipped; ${result.warnings.length} warnings.`);
    const messages = result.errors.concat(result.warnings);
    if (messages.length) printList(host, messages.slice(0, 30), "");
    if (messages.length > 30) addText(host, "p", `${messages.length - 30} more messages. Review or simplify the source CSV before importing.`);
    const table = element("table", "preview-table");
    const head = element("tr"); ["Record ID", "Description", "Quantity", "Unit", "Contract"].forEach(label => addText(head, "th", label)); table.append(head);
    result.accepted.slice(0, 5).forEach(item => { const row = element("tr"); [item.recordId, item.description, item.quantity, item.unit, item.contract].forEach(val => addText(row, "td", val)); table.append(row); });
    if (result.accepted.length) host.append(table);
    byId("accept-import").hidden = !result.accepted.length;
  }
  function previewImport() {
    try {
      const mapping = {};
      byId("mapping-fields").querySelectorAll("select[data-map]").forEach(select => { mapping[select.dataset.map] = Number(select.value); });
      const result = C.inspectImport(importRows, mapping);
      const existing = new Set(items.map(entry => entry.data.recordId.trim().toLowerCase()).filter(Boolean));
      const filtered = [];
      result.accepted.forEach((item, index) => {
        const id = item.recordId.trim().toLowerCase();
        if (id && existing.has(id)) result.errors.push(`Mapped item ${index + 1}: Record ID already exists in the working list.`);
        else { filtered.push(item); if (id) existing.add(id); }
      });
      result.accepted = filtered;
      importResult = result;
      displayImport(result);
      byId("import-feedback").textContent = "Review the preview and errors before confirming.";
    } catch (error) {
      importResult = null; byId("accept-import").hidden = true;
      byId("import-preview").replaceChildren(); byId("import-feedback").textContent = error.message;
    }
  }
  function mappingUi(rows) {
    const host = byId("mapping-fields"); host.replaceChildren();
    const headers = rows[0], suggested = C.suggestedMapping(headers);
    C.FIELDS.forEach(([key, labelText]) => {
      const label = element("label"); label.textContent = `${labelText}${["description", "quantity", "unit"].includes(key) ? " *" : ""}`;
      const select = element("select"); select.dataset.map = key;
      const unmapped = element("option", "", "Not mapped"); unmapped.value = "-1"; select.append(unmapped);
      headers.forEach((header, index) => { const option = element("option", "", header); option.value = String(index); select.append(option); });
      select.value = String(suggested[key]); label.append(select); host.append(label);
    });
    byId("import-workspace").hidden = false;
    byId("import-preview").replaceChildren(); byId("accept-import").hidden = true;
  }
  async function loadFile() {
    importRows = null; importResult = null; byId("import-workspace").hidden = true;
    const file = byId("import-file").files[0]; if (!file) return;
    try {
      if (file.size > C.MAX_BYTES) throw new Error("CSV exceeds the 2 MB limit.");
      importRows = C.parseCsv(await file.text());
      if (importRows.length < 2) throw new Error("CSV has no data rows.");
      mappingUi(importRows);
      byId("import-feedback").textContent = `${importRows.length - 1} source rows found. Review the column mapping.`;
    } catch (error) { byId("import-feedback").textContent = error.message; }
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = element("a"); anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function loadSample() {
    if (items.length || formIds.some(id => value(id) && !["unknown"].includes(value(id))) || Object.keys(checklistState).length) {
      if (!confirm("Replace current entries with the fictional sample?")) return;
    }
    clearAll(false);
    const values = { "prep-reference":"DEMO-PREP-001", "prep-date":"2026-11-15", "prep-site":"North Harbor Demo Works", "prep-preparer":"Mara Finch", "prep-contract":"DEMO-CONTRACT-01", "prep-location":"Sample Room A", "prep-reason":"No longer required for current contract performance", "prep-determination-date":"2026-11-10", "prep-dod":"unknown", "prep-special":"no", "prep-subcontractor":"no", "prep-contact":"Property Administrator (fictional)", "doc-record":"Demo property list GP-01", "doc-acquisition":"Fictional receipt R-01", "doc-inventory":"Sample count noted for review", "doc-contract":"DEMO-CONTRACT-01", "doc-questions":"Confirm applicable contract instructions before any disposition action." };
    Object.entries(values).forEach(([id, val]) => { byId(id).value = val; });
    addItem({recordId:"DEMO-001",assetId:"DEMO-ASSET-01",description:"Portable measurement unit",partNumber:"DEMO-PN-11",serialNumber:"DEMO-SN-01",quantity:"1",unit:"EA",location:"Sample Room A",origin:"GFP",category:"Equipment",condition:"Serviceable",contract:"DEMO-CONTRACT-01",remarks:"Fictional item"});
    addItem({recordId:"DEMO-002",description:"Sample calibration material",partNumber:"DEMO-PN-22",quantity:"2.5",unit:"KG",location:"Sample Room A",origin:"CAP",category:"Material",condition:"Not assessed",contract:"DEMO-CONTRACT-01",remarks:"Fictional material lot"});
    renderReview();
  }
  function clearAll(ask = true) {
    if (ask && !confirm("Discard all entered preparation information?")) return;
    formIds.forEach(id => { const field = byId(id); field.value = field.querySelector?.("option")?.value || ""; });
    byId("show-audit").checked = false; byId("import-file").value = "";
    items = []; nextUid = 1; importRows = null; importResult = null; previewMode = "summary";
    Object.keys(checklistState).forEach(key => delete checklistState[key]);
    byId("import-workspace").hidden = true; byId("import-feedback").textContent = "";
    byId("export-feedback").textContent = "";
    renderItems(); renderChecklist(); renderReview();
    if (ask) { location.hash = "#step-1"; showStep(); }
  }

  byId("item-list").addEventListener("input", event => {
    const control = event.target.closest("[data-key]"); if (!control) return;
    const entry = items.find(item => item.uid === Number(control.closest("[data-uid]").dataset.uid));
    if (entry) entry.data[control.dataset.key] = control.value;
  });
  byId("item-list").addEventListener("change", event => {
    const control = event.target.closest("[data-key]"); if (!control) return;
    const card = control.closest("details");
    const entry = items.find(item => item.uid === Number(card.dataset.uid));
    if (entry) card.querySelector("summary").textContent = itemTitle(entry.data, items.indexOf(entry));
  });
  byId("item-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-remove]"); if (!button) return;
    items = items.filter(item => item.uid !== Number(button.dataset.remove)); renderItems();
  });
  byId("checklist-sections").addEventListener("input", event => {
    const id = event.target.dataset.checkId || event.target.dataset.noteId; if (!id) return;
    checklistState[id] ||= {status:"",note:""};
    if (event.target.dataset.checkId) checklistState[id].status = event.target.value;
    else checklistState[id].note = event.target.value;
  });
  byId("mapping-fields").addEventListener("change", () => { importResult = null; byId("accept-import").hidden = true; byId("import-preview").textContent = "Mapping changed. Review mapped rows again."; });
  byId("add-item").addEventListener("click", () => addItem());
  byId("sort-items").addEventListener("change", () => renderItems());
  byId("group-items").addEventListener("change", () => renderItems());
  byId("show-audit").addEventListener("change", renderChecklist);
  byId("import-file").addEventListener("change", loadFile);
  byId("preview-import").addEventListener("click", previewImport);
  byId("accept-import").addEventListener("click", () => {
    if (!importResult?.accepted.length) return;
    const count = importResult.accepted.length;
    if (!confirm(`Add ${count} valid CSV row${count === 1 ? "" : "s"} to this working list? Invalid rows will remain out of the list.`)) return;
    importResult.accepted.forEach(data => items.push({uid:nextUid++,data}));
    renderItems(); byId("import-file").value = ""; byId("import-workspace").hidden = true;
    byId("import-feedback").textContent = `Added ${count} rows. ${importResult.errors.length} rows were skipped; review the source file if needed.`;
    importRows = null; importResult = null;
  });
  byId("sample").addEventListener("click", loadSample);
  byId("reset").addEventListener("click", () => clearAll(true));
  byId("export-csv").addEventListener("click", () => {
    if (!items.length) { byId("export-feedback").textContent = "Add a property item before downloading a listing."; return; }
    download("disposition-preparation-property-list.csv", C.listingCsv(items.map(item => item.data), value("prep-reference")), "text/csv;charset=utf-8");
    byId("export-feedback").textContent = "Working property listing downloaded. Blank fields are identified in the final column.";
  });
  byId("preview-checklist").addEventListener("click", () => { previewMode = "checklist"; renderReview(); });
  byId("preview-summary").addEventListener("click", () => { previewMode = "summary"; renderReview(); });
  byId("print-output").addEventListener("click", () => { renderReview(); window.print(); });
  document.querySelectorAll("input,select,textarea").forEach(field => {
    if (!field.closest("#item-list,#mapping-fields,#checklist-sections")) field.addEventListener("input", () => { if (!byId("step-4").hidden) renderReview(); });
  });
  window.addEventListener("hashchange", showStep);
  renderItems(); renderChecklist(); showStep();
})();
