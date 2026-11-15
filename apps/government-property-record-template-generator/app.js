/* Static, local-only demonstration. No data is sent, stored, or reconciled. */
(() => {
  "use strict";

  const FAR_URL = "https://www.acquisition.gov/far/52.245-1";
  const DFARS_URL = "https://www.acquisition.gov/dfars/252.245-7005-management-and-reporting-government-property.";
  const DCMA_URL = "https://www.dcma.mil/Portals/31/Documents/HQ/Contract%20Property%20Job%20Aid%20Rev4%20March%2028%202025.pdf?ver=MBOAef5kaoBwrQFEYeKx3g%3D%3D";
  const V_FAR = "FAR clause SEP 2021; FAC 2026-01 (2026-03-13)";
  const V_DFARS = "DFARS clause JAN 2024; change 2026-05-07";
  const V_DCMA = "DCMA Job Aid Rev. 4 (2025-03-28)";
  const V_DESIGN = "Demonstration design (2026-11-15)";
  const classes = {
    regulatory: "Regulatory requirement",
    conditional: "Conditional requirement",
    audit: "Audit guidance",
    optional: "Optional administrative field"
  };
  const field = (id, file, name, description, classification, applicability, citation, sourceUrl, version, example, options = {}) =>
    ({ id, file, name, description, classification, applicability, citation, sourceUrl, version, example, ...options });

  const FIELDS = [
    field("recordId", "snapshot", "Record ID", "Demonstration key shared with related transaction rows.", "optional", "Included by default to show the relationship between the two CSV files; not a regulatory field.", "—", "", V_DESIGN, "GP-0001", { defaultOn: true }),
    field("name", "snapshot", "Property Name", "Common name of the property.", "regulatory", "Government property accountable to a contract containing FAR 52.245-1, subject to any Property Administrator approval.", "FAR 52.245-1(f)(1)(iii)(A)(1)", FAR_URL, V_FAR, "Bench power supply"),
    field("part", "snapshot", "Part Number", "Item part number; resolve unavailable values under the contract or Property Administrator direction.", "regulatory", "Government property accountable to the contract, subject to any Property Administrator approval.", "FAR 52.245-1(f)(1)(iii)(A)(1)", FAR_URL, V_FAR, "PS-100"),
    field("description", "snapshot", "Description", "Description that helps distinguish the property.", "regulatory", "Government property accountable to the contract, subject to any Property Administrator approval.", "FAR 52.245-1(f)(1)(iii)(A)(1)", FAR_URL, V_FAR, "Programmable 30 V supply"),
    field("nsn", "snapshot", "National Stock Number", "Additional identifier if needed for FAR tracking or disposition. When DFARS 252.245-7005 applies, record the NSN or an allowed alternative if no NSN is available.", "conditional", "FAR: when needed for additional identification or disposition. DFARS: NSN when available, otherwise manufacturer CAGE plus part number or model number.", "FAR 52.245-1(f)(1)(iii)(A)(1)", FAR_URL, V_FAR, "6130-01-234-5678"),
    field("qtyReceived", "snapshot", "Quantity Received or Fabricated", "Quantity received or fabricated for the current property record.", "regulatory", "Applicable receipt or fabrication activity; related transaction details belong in the history or supporting records.", "FAR 52.245-1(f)(1)(iii)(A)(2)", FAR_URL, V_FAR, "2"),
    field("qtyIssued", "snapshot", "Quantity Issued", "Quantity issued for the current property record.", "regulatory", "Applicable issue activity; related transaction details belong in the history or supporting records.", "FAR 52.245-1(f)(1)(iii)(A)(2)", FAR_URL, V_FAR, "1"),
    field("balance", "snapshot", "Balance on Hand", "Current accountable quantity.", "regulatory", "Government property accountable to the contract.", "FAR 52.245-1(f)(1)(iii)(A)(2)", FAR_URL, V_FAR, "1"),
    field("unitCost", "snapshot", "Unit Acquisition Cost", "Cost per unit under the FAR clause definition.", "regulatory", "Government property accountable to the contract; determine the value using the clause and contract.", "FAR 52.245-1(f)(1)(iii)(A)(3); (a)", FAR_URL, V_FAR, "1250.00"),
    field("uii", "snapshot", "Unique Item Identifier or Equivalent", "Identifier for individual-item tracking.", "conditional", "If available and necessary for individual-item tracking.", "FAR 52.245-1(f)(1)(iii)(A)(4)", FAR_URL, V_FAR, "EXAMPLE-UII-001"),
    field("uom", "snapshot", "Unit of Measure", "Unit used for quantities.", "regulatory", "Government property accountable to the contract.", "FAR 52.245-1(f)(1)(iii)(A)(5)", FAR_URL, V_FAR, "EA"),
    field("contract", "snapshot", "Accountable Contract Number or Code", "Accountable contract number or equivalent code. When DFARS applies, this shared column should contain the accountable Government contract number.", "regulatory", "FAR permits an equivalent code; DFARS 252.245-7005(c)(4), when in the contract, calls for the Government contract number.", "FAR 52.245-1(f)(1)(iii)(A)(6)", FAR_URL, V_FAR, "FA0000-26-C-0001"),
    field("location", "snapshot", "Location", "Current property location.", "regulatory", "Government property accountable to the contract.", "FAR 52.245-1(f)(1)(iii)(A)(7)", FAR_URL, V_FAR, "Building A, room 101"),
    field("disposition", "snapshot", "Disposition", "Current or completed disposition information.", "regulatory", "Government property accountable to the contract; a blank value may be appropriate before disposition under the record design.", "FAR 52.245-1(f)(1)(iii)(A)(8)", FAR_URL, V_FAR, "On hand"),
    field("serviceDate", "snapshot", "Date Placed in Service", "Date the property was placed in service.", "conditional", "Only if required by the contract.", "FAR 52.245-1(f)(1)(iii)(A)(10)", FAR_URL, V_FAR, "2026-01-20"),
    field("mfrCage", "snapshot", "Manufacturer CAGE Code", "Manufacturer CAGE code paired with the manufacturer's part number as an NSN alternative.", "conditional", "DFARS clause applies, no NSN is available, and this alternative is used.", "DFARS 252.245-7005(c)(1)", DFARS_URL, V_DFARS, "1AB23", { dfarsOnly: true }),
    field("mfrPart", "snapshot", "Manufacturer Part Number", "Manufacturer part number paired with manufacturer CAGE; may match the FAR Part Number if that is the manufacturer's number.", "conditional", "DFARS clause applies, no NSN is available, and this alternative is used.", "DFARS 252.245-7005(c)(1)", DFARS_URL, V_DFARS, "MFR-PS100", { dfarsOnly: true }),
    field("model", "snapshot", "Model Number", "Model-number alternative when no NSN is available.", "conditional", "DFARS clause applies, no NSN is available, and this alternative is used.", "DFARS 252.245-7005(c)(1)", DFARS_URL, V_DFARS, "Model 30A", { dfarsOnly: true }),
    field("contractCage", "snapshot", "Accountable Contract CAGE Code", "CAGE code on the accountable Government contract.", "conditional", "When the DFARS clause applies.", "DFARS 252.245-7005(c)(2)", DFARS_URL, V_DFARS, "9XY12", { dfarsOnly: true }),
    field("receivedDate", "snapshot", "Received Date", "Date the property was received.", "conditional", "When the DFARS clause applies and a receipt event occurs.", "DFARS 252.245-7005(c)(3)", DFARS_URL, V_DFARS, "2026-01-15", { dfarsOnly: true }),
    field("shippedDate", "snapshot", "Sent or Shipped Date", "Date the property was sent or shipped.", "conditional", "When the DFARS clause applies and a shipment event occurs.", "DFARS 252.245-7005(c)(3)", DFARS_URL, V_DFARS, "2026-02-02", { dfarsOnly: true }),
    field("serial", "snapshot", "Serial Number", "Serial number for applicable serially managed items.", "conditional", "DFARS clause applies; serially managed item without a UII.", "DFARS 252.245-7005(c)(5)", DFARS_URL, V_DFARS, "SN-0001", { dfarsOnly: true }),
    field("condition", "snapshot", "Supply Condition Code", "Condition code used for reparable-item reporting.", "conditional", "DFARS clause applies; only required for reporting reparable items.", "DFARS 252.245-7005(c)(6)", DFARS_URL, V_DFARS, "A", { dfarsOnly: true }),
    field("sensitive", "snapshot", "Sensitive Property Indicator", "Helps produce a sensitive-item population for assessment.", "audit", "Optional; useful when sensitive Government property is held.", "DCMA Job Aid Rev. 4, Element 7, pp. 79–82", DCMA_URL, V_DCMA, "Yes"),
    field("category", "snapshot", "Property Category", "Convenience grouping for filtering; not a separate FAR record format.", "optional", "Optional, selected by default in the Equipment and Material views.", "—", "", V_DESIGN, "Equipment", { templateDefault: true }),
    field("origin", "snapshot", "Property Origin", "Convenience label such as Government-furnished or contractor-acquired.", "optional", "Optional; both origins are within the FAR clause scope.", "—", "", V_DESIGN, "GFP"),
    field("recordIdTxn", "transaction", "Record ID", "Shared key linking this event to a property snapshot row.", "optional", "Included by default for the demonstration; not a regulatory identifier.", "—", "", V_DESIGN, "GP-0001", { defaultOn: true }),
    field("postingRef", "transaction", "Transaction Posting Reference", "Reference linking the transaction to supporting records.", "regulatory", "Each applicable transaction; retain supporting records outside this demonstration.", "FAR 52.245-1(f)(1)(iii)(A)(9)", FAR_URL, V_FAR, "REC-001"),
    field("transactionDate", "transaction", "Transaction Date", "Date the transaction occurred, distinct from an optional entry date.", "regulatory", "Each applicable transaction.", "FAR 52.245-1(f)(1)(iii)(A)(9)", FAR_URL, V_FAR, "2026-01-15"),
    field("transactionType", "transaction", "Transaction Type", "Plain-language event label, for example receipt or issue.", "optional", "Included by default to explain example rows; not a prescribed FAR field.", "—", "", V_DESIGN, "Receipt", { defaultOn: true }),
    field("txnReceived", "transaction", "Quantity Received or Fabricated", "Quantity added by this event.", "regulatory", "Receipt or fabrication event; may be blank for other events.", "FAR 52.245-1(f)(1)(iii)(A)(2)", FAR_URL, V_FAR, "2"),
    field("txnIssued", "transaction", "Quantity Issued", "Quantity issued by this event.", "regulatory", "Issue event; may be blank for other events.", "FAR 52.245-1(f)(1)(iii)(A)(2)", FAR_URL, V_FAR, "1"),
    field("postingEntryDate", "transaction", "Posting Entry Date", "Date a transaction was entered, useful for reviewing posting timeliness.", "audit", "Optional DCMA assessment guidance; not a universal clause field.", "DCMA Job Aid Rev. 4, Element 7, p. 82", DCMA_URL, V_DCMA, "2026-01-16"),
    field("sourceType", "transaction", "Source Document Type", "Type of document supporting the posting.", "audit", "Optional DCMA assessment guidance; the FAR independently requires a posting reference.", "DCMA Job Aid Rev. 4, Element 7, pp. 80–82", DCMA_URL, V_DCMA, "Receiving report")
  ];

  const templateExamples = {
    general: { name: "Bench power supply", part: "PS-100", description: "Programmable 30 V supply", uom: "EA", category: "Equipment", note: "General view: the common FAR fields apply across property types." },
    equipment: { name: "Test meter", part: "TM-200", description: "Digital test meter", uom: "EA", category: "Equipment", note: "Equipment view: synthetic equipment examples; the same FAR record categories apply." },
    material: { name: "Fastener kit", part: "FK-300", description: "Assorted fasteners", uom: "KIT", category: "Material", note: "Material view: synthetic material examples; the same FAR record categories apply. An approved receipt-and-issue system may use cross-referenced documents for immediate-consumption material." }
  };
  const current = { template: "general", regime: "far", order: {}, selected: {} };
  const visible = (f) => !f.dfarsOnly || current.regime === "dfars";
  const fieldsFor = (file, selectedOnly = false) => current.order[file].map(id => FIELDS.find(f => f.id === id)).filter(f => visible(f) && (!selectedOnly || current.selected[f.id]));
  const effective = (f) => {
    if (current.regime === "dfars" && f.id === "nsn") return { ...f, citation: "FAR 52.245-1(f)(1)(iii)(A)(1); DFARS 252.245-7005(c)(1)", sourceUrl: DFARS_URL, version: `${V_FAR}; ${V_DFARS}` };
    if (current.regime === "dfars" && f.id === "contract") return { ...f, citation: "FAR 52.245-1(f)(1)(iii)(A)(6); DFARS 252.245-7005(c)(4)", sourceUrl: DFARS_URL, version: `${V_FAR}; ${V_DFARS}` };
    return f;
  };
  function defaults() {
    current.order.snapshot = FIELDS.filter(f => f.file === "snapshot").map(f => f.id);
    current.order.transaction = FIELDS.filter(f => f.file === "transaction").map(f => f.id);
    current.selected = Object.fromEntries(FIELDS.map(f => [f.id, f.classification === "regulatory" || f.classification === "conditional" || !!f.defaultOn || (!!f.templateDefault && current.template !== "general")]));
    render();
  }
  const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  function csvFor(fields, rows = []) {
    return "\uFEFF" + [fields.map(f => escapeCsv(f.name)).join(","), ...rows.map(row => fields.map(f => escapeCsv(row[f.id])).join(","))].join("\r\n") + "\r\n";
  }
  function exampleRows(file) {
    const t = templateExamples[current.template];
    const base = { recordId: "GP-0001", name: t.name, part: t.part, description: t.description, nsn: "", qtyReceived: "2", qtyIssued: "1", balance: "1", unitCost: "1250.00", uii: current.template === "material" ? "" : "EXAMPLE-UII-001", uom: t.uom, contract: "FA0000-26-C-0001", location: "Building A, room 101", disposition: "On hand", serviceDate: current.template === "material" ? "" : "2026-01-20", mfrCage: "1AB23", mfrPart: "MFR-PS100", model: "", contractCage: "9XY12", receivedDate: "2026-01-15", shippedDate: "", serial: "", condition: "", sensitive: "No", category: t.category, origin: "GFP" };
    if (file === "snapshot") return [base];
    return [
      { recordIdTxn: "GP-0001", postingRef: "REC-001", transactionDate: "2026-01-15", transactionType: "Receipt", txnReceived: "2", txnIssued: "", postingEntryDate: "2026-01-16", sourceType: "Receiving report" },
      { recordIdTxn: "GP-0001", postingRef: "ISS-001", transactionDate: "2026-02-02", transactionType: "Issue", txnReceived: "", txnIssued: "1", postingEntryDate: "2026-02-03", sourceType: "Issue document" }
    ];
  }
  function download(file, examples) {
    const fields = fieldsFor(file, true);
    if (!fields.length) return;
    const csv = csvFor(fields, examples ? exampleRows(file) : []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `government-property-${file === "snapshot" ? "snapshot" : "transaction-history"}-${examples ? "examples" : "blank"}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function el(tag, className, textValue) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textValue !== undefined) node.textContent = textValue;
    return node;
  }
  function badge(f) { return el("span", `badge ${f.classification}`, classes[f.classification]); }
  function fieldRow(f, index, count) {
    const row = el("div", `field-row${current.selected[f.id] ? "" : " off"}`);
    const top = el("div", "field-top");
    const label = el("label");
    const checkbox = el("input"); checkbox.type = "checkbox"; checkbox.checked = current.selected[f.id]; checkbox.dataset.field = f.id; checkbox.setAttribute("aria-label", `Include ${f.name} in ${f.file === "snapshot" ? "snapshot" : "transaction history"}`);
    label.append(checkbox, el("strong", "", f.name));
    const move = el("div", "move-controls");
    for (const [direction, symbol, disabled] of [[-1, "↑", index === 0], [1, "↓", index === count - 1]]) {
      const button = el("button", "secondary", symbol); button.type = "button"; button.dataset.move = f.id; button.dataset.direction = direction; button.disabled = disabled; button.setAttribute("aria-label", `Move ${f.name} ${direction < 0 ? "up" : "down"}`); move.append(button);
    }
    top.append(label, move);
    const info = el("p", "", f.description);
    const meta = el("div", "field-meta"); meta.append(badge(f), document.createTextNode(` ${f.citation} · Example: ${f.example || "(blank when inapplicable)"}`));
    row.append(top, info, meta); return row;
  }
  function renderFieldLists() {
    for (const file of ["snapshot", "transaction"]) {
      const target = document.getElementById(`${file}-fields`); target.replaceChildren();
      const fields = fieldsFor(file).map(effective);
      fields.forEach((f, i) => target.append(fieldRow(f, i, fields.length)));
    }
  }
  function tableFor(fields, rows, dictionary = false) {
    const table = el("table", dictionary ? "dictionary-table" : "preview-table");
    const head = el("thead"); const headRow = el("tr");
    (dictionary ? ["Field", "Description", "Classification", "Applicability", "Public citation", "Example"] : fields.map(f => f.name)).forEach(label => headRow.append(el("th", "", label)));
    head.append(headRow); table.append(head);
    const body = el("tbody");
    if (dictionary) {
      fields.forEach(f => {
        const tr = el("tr");
        for (const value of [f.name, f.description, classes[f.classification], f.applicability]) tr.append(el("td", "", value));
        const cite = el("td"); if (f.sourceUrl) { const a = el("a", "", f.citation); a.href = f.sourceUrl; cite.append(a); } else cite.textContent = "—"; tr.append(cite);
        tr.append(el("td", "", f.example)); body.append(tr);
      });
    } else rows.forEach(row => { const tr = el("tr"); fields.forEach(f => tr.append(el("td", "", row[f.id] ?? ""))); body.append(tr); });
    table.append(body); return table;
  }
  function renderPreview() {
    for (const file of ["snapshot", "transaction"]) {
      const fields = fieldsFor(file, true).map(effective);
      const target = document.getElementById(`${file}-preview`); target.replaceChildren();
      document.getElementById(`${file}-count`).textContent = `${fields.length} selected columns · preview uses synthetic data`;
      if (fields.length) target.append(tableFor(fields, exampleRows(file)));
      else target.append(el("p", "helper", "Select at least one column to enable downloads."));
      for (const kind of ["blank", "example"]) document.getElementById(`${file}-${kind}`).disabled = !fields.length;
    }
  }
  function renderDictionary() {
    const target = document.getElementById("dictionary"); target.replaceChildren();
    for (const [file, title] of [["snapshot", "Property snapshot"], ["transaction", "Transaction history"]]) {
      const fields = fieldsFor(file, true).map(effective);
      target.append(el("h3", "", title));
      if (fields.length) {
        const scroll = el("div", "dictionary-scroll");
        scroll.append(tableFor(fields, [], true));
        target.append(scroll);
      } else target.append(el("p", "helper", "No fields selected."));
    }
  }
  function renderWarnings() {
    const warnings = [];
    const omitted = FIELDS.filter(f => visible(f) && ["regulatory", "conditional"].includes(f.classification) && !current.selected[f.id]);
    if (omitted.length) warnings.push(`Potential omission: ${omitted.map(f => f.name).join(", ")} ${omitted.length === 1 ? "is" : "are"} excluded. Check the applicable clause, item conditions, and any Property Administrator approval before using these files.`);
    if (!current.selected.recordId || !current.selected.recordIdTxn) warnings.push("The shared Record ID is excluded from one or both files, so the examples cannot demonstrate a direct link between them.");
    if (current.regime === "dfars" && !["nsn", "model"].some(id => current.selected[id]) && !(current.selected.mfrCage && current.selected.mfrPart)) warnings.push("DFARS identification alternatives are missing: include NSN, model number, or both manufacturer CAGE and manufacturer part number when applicable.");
    for (const file of ["snapshot", "transaction"]) if (!fieldsFor(file, true).length) warnings.push(`The ${file === "snapshot" ? "property snapshot" : "transaction history"} has no columns and cannot be downloaded.`);
    const target = document.getElementById("warnings"); target.replaceChildren(...warnings.map(w => el("p", "", w)));
  }
  function render() {
    document.getElementById("template-note").textContent = templateExamples[current.template].note;
    renderFieldLists(); renderWarnings(); renderPreview(); renderDictionary();
  }
  function init() {
    document.getElementById("template").addEventListener("change", event => { current.template = event.target.value; defaults(); });
    document.getElementById("regime").addEventListener("change", event => { current.regime = event.target.value; defaults(); });
    document.getElementById("restore").addEventListener("click", defaults);
    document.querySelector(".field-groups").addEventListener("change", event => {
      if (!event.target.matches("input[data-field]")) return;
      current.selected[event.target.dataset.field] = event.target.checked; render();
    });
    document.querySelector(".field-groups").addEventListener("click", event => {
      const button = event.target.closest("button[data-move]"); if (!button) return;
      const id = button.dataset.move; const file = FIELDS.find(f => f.id === id).file;
      const list = current.order[file]; const at = list.indexOf(id); const next = at + Number(button.dataset.direction);
      if (next < 0 || next >= list.length) return;
      [list[at], list[next]] = [list[next], list[at]]; render();
      const moved = document.querySelector(`button[data-move="${id}"][data-direction="${button.dataset.direction}"]`); if (moved) moved.focus();
    });
    for (const file of ["snapshot", "transaction"]) for (const kind of ["blank", "example"]) document.getElementById(`${file}-${kind}`).addEventListener("click", () => download(file, kind === "example"));
    document.getElementById("print-dictionary").addEventListener("click", () => {
      document.getElementById("dictionary-details").open = true;
      window.print();
    });
    defaults();
  }
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
  if (typeof globalThis !== "undefined") globalThis.GPTemplateCore = { FIELDS, classes, csvFor, exampleRows, defaults, current, fieldsFor, effective };
})();
