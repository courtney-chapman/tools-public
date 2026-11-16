"use strict";

// One state object is the only source of truth for editing, preview, print, CSV, and drafts.
const createDefaultState = () => ({
  shipment: { from: "", to: "", shipToMarkFor: "" },
  authority: { contract: "", purpose: "", authorization: "", documentDate: "" },
  property: [],
  shipping: { dateShipped: "", mode: "", billOfLading: "", airMovement: "", transportChargeableTo: "", specialHandling: "" },
  packing: { issuedBy: "", checkedBy: "", packedBy: "", totalContainers: "", containerType: "", containerDescription: "", totalWeight: "", totalCube: "" },
  advanced: {
    appropriations: "", requisitionNumber: "", requiredDate: "", priority: "", signature: "",
    voucherNumberDate: "", supplyAction: "", containersReceived: "", quantitiesReceived: "",
    receivedBy: "", receivedDate: "", receiverVoucherNumber: "", posted: ""
  }
});

let state = createDefaultState();

// Centralized mapping from friendly fields to the official DD1149 blocks.
const dd1149Mapping = Object.freeze({
  from: { path: "shipment.from", block: 1 },
  to: { path: "shipment.to", block: 2 },
  shipToMarkFor: { path: "shipment.shipToMarkFor", block: 3 },
  appropriations: { path: "advanced.appropriations", block: 4 },
  requisitionDate: { path: "authority.documentDate", block: 5 },
  requisitionNumber: { path: "advanced.requisitionNumber", block: 6 },
  requiredDate: { path: "advanced.requiredDate", block: 7 },
  priority: { path: "advanced.priority", block: 8 },
  authorityPurpose: { paths: ["authority.purpose", "authority.contract", "authority.authorization"], block: 9 },
  signature: { path: "advanced.signature", block: 10 },
  voucher: { path: "advanced.voucherNumberDate", block: 11 },
  dateShipped: { path: "shipping.dateShipped", block: 12 },
  mode: { path: "shipping.mode", block: 13 },
  billOfLading: { path: "shipping.billOfLading", block: 14 },
  airMovement: { path: "shipping.airMovement", block: 15 },
  transportChargeableTo: { path: "shipping.transportChargeableTo", block: 16 },
  specialHandling: { path: "shipping.specialHandling", block: 17 },
  packing: { path: "packing", block: 18 },
  receipt: { path: "advanced", block: 19 },
  receiverVoucher: { path: "advanced.receiverVoucherNumber", block: 20 }
});

const lineItemMapping = Object.freeze({
  itemNumber: "item",
  description: "description",
  unitOfIssue: "uom",
  quantityRequested: "quantity",
  supplyAction: "advanced.supplyAction",
  typeContainer: "container_type",
  containerNumbers: "container_number",
  unitPrice: "unit_cost",
  totalCost: "calculated"
});

const csvColumns = ["description", "quantity", "uom", "tag", "serial_number", "part_number", "nsn", "unit_cost", "condition", "container_type", "container_number", "notes"];

const propertyRows = document.getElementById("propertyRows");
const previewPages = document.getElementById("previewPages");
const propertyTemplate = document.getElementById("propertyRowTemplate");

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const getPath = (obj, path) => path.split(".").reduce((value, key) => value?.[key], obj);
const setPath = (obj, path, value) => {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((value, key) => value[key], obj);
  target[last] = value;
};

const formatDate = value => value ? value.replaceAll("-", "") : "";
const isFiniteNumber = value => value !== "" && Number.isFinite(Number(value));
const formatMoney = value => Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lineTotal = item => isFiniteNumber(item.quantity) && isFiniteNumber(item.unit_cost) ? Number(item.quantity) * Number(item.unit_cost) : null;
const itemBlank = () => ({ ...Object.fromEntries(csvColumns.map(key => [key, ""])), uom: "EA" });

function authorityPurposeText() {
  return [
    state.authority.purpose?.trim().toUpperCase(),
    state.authority.contract?.trim() ? `CONTRACT: ${state.authority.contract.trim()}` : "",
    state.authority.authorization?.trim() ? `AUTHORITY: ${state.authority.authorization.trim()}` : ""
  ].filter(Boolean).join("\n");
}

function itemDescription(item) {
  const identifiers = [
    item.nsn && `NSN: ${item.nsn}`,
    item.part_number && `P/N: ${item.part_number}`,
    item.tag && `TAG: ${item.tag}`,
    item.serial_number && `S/N: ${item.serial_number}`,
    item.condition && `CONDITION: ${item.condition}`,
    item.notes && `NOTES: ${item.notes}`
  ].filter(Boolean);
  return [item.description, identifiers.join(" | ")].filter(Boolean).join("\n");
}

function estimateUnits(item) {
  const text = itemDescription(item);
  const explicitLines = text.split("\n").length;
  const wrapLines = Math.ceil(text.length / 76);
  return Math.max(1, Math.min(5, Math.max(explicitLines, wrapLines)));
}

function paginate(items) {
  // Measure actual browser layout, not a capped character-count estimate.
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;left:-20000px;top:0;visibility:hidden;width:1056px";
  document.body.append(probe);
  const pages = [[]];
  const fits = rows => {
    probe.innerHTML = pages.length === 1 ? mainPage(rows, 999) : continuationPage(rows, pages.length, 999);
    const page = probe.firstElementChild;
    const bottom = page.querySelector(".form-footer").getBoundingClientRect().bottom;
    return bottom <= page.getBoundingClientRect().bottom - 18;
  };
  try {
    items.forEach((item, index) => {
      let text = itemDescription(item), continuation = false;
      do {
        let rows = pages[pages.length - 1];
        const row = {item, number:index + 1, units:1, text, continuation};
        if (fits([...rows, row])) { rows.push(row); break; }
        if (rows.length) { pages.push([]); continue; }
        // Split only the description; quantity and cost appear exactly once.
        let low = 0, high = text.length;
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          if (fits([{...row, text:text.slice(0,middle)}])) low = middle;
          else high = middle - 1;
        }
        if (low === 0) {
          if (pages.length === 1) { pages.push([]); continue; }
          throw new Error("A property row cannot fit on a continuation page. Shorten the non-description fields.");
        }
        // Prefer a whitespace boundary while preserving every character.
        const boundary = text.lastIndexOf(" ", low - 1);
        if (boundary > low / 2) low = boundary + 1;
        rows.push({...row, text:text.slice(0,low)});
        text = text.slice(low); continuation = true;
        if (text) pages.push([]);
      } while (text);
    });
    return pages;
  } finally { probe.remove(); }
}

function renderPropertyRows() {
  propertyRows.replaceChildren();
  state.property.forEach((item, index) => {
    const fragment = propertyTemplate.content.cloneNode(true);
    const mainRow = fragment.querySelector(".property-row");
    const detailRow = fragment.querySelector(".property-row-details");
    mainRow.dataset.index = index;
    detailRow.dataset.index = index;
    fragment.querySelector(".row-number").textContent = index + 1;
    csvColumns.forEach(key => {
      const input = fragment.querySelector(`.${key}`);
      if (!input) return;
      input.value = item[key] ?? "";
      input.addEventListener("input", event => {
        state.property[index][key] = event.target.value;
        clearRowError(event.target);
        renderPreview();
      });
    });
    fragment.querySelector(".delete-row").addEventListener("click", () => {
      state.property.splice(index, 1);
      renderPropertyRows();
      renderPreview();
    });
    propertyRows.append(fragment);
  });
  document.getElementById("propertyError").textContent = "";
}

function clearRowError(input) {
  input.classList.remove("invalid");
  const error = input.parentElement.querySelector(".inline-error");
  if (error) error.textContent = "";
}

function officialTableHead() {
  return `<thead><tr>
    <th class="col-item">Item No.<br>(a)</th>
    <th class="col-desc">Federal Stock Number, Description, and Coding of Materiel and/or Services<br>(b)</th>
    <th class="col-uom">Unit of Issue<br>(c)</th>
    <th class="col-qty">Quantity Requested<br>(d)</th>
    <th class="col-action">Supply Action<br>(e)</th>
    <th class="col-type">Type Container<br>(f)</th>
    <th class="col-number">Container Nos.<br>(g)</th>
    <th class="col-price">Unit Price<br>(h)</th>
    <th class="col-total">Total Cost<br>(i)</th>
  </tr></thead>`;
}

function renderOfficialRows(pageItems, minimumRows) {
  const rows = pageItems.map(({ item, number, units, text, continuation }) => {
    const total = continuation ? null : lineTotal(item);
    const height = Math.max(.25, units * .17);
    return `<tr style="height:${height}in">
      <td class="col-item">${number}${continuation ? " (cont.)" : ""}</td>
      <td class="col-desc description-lines">${escapeHtml(text ?? itemDescription(item))}</td>
      <td class="col-uom">${continuation ? "" : escapeHtml(item.uom)}</td>
      <td class="col-qty">${continuation ? "" : escapeHtml(item.quantity)}</td>
      <td class="col-action">${continuation ? "" : escapeHtml(state.advanced.supplyAction)}</td>
      <td class="col-type">${continuation ? "" : escapeHtml(item.container_type)}</td>
      <td class="col-number">${continuation ? "" : escapeHtml(item.container_number)}</td>
      <td class="col-price money">${!continuation && isFiniteNumber(item.unit_cost) ? formatMoney(item.unit_cost) : ""}</td>
      <td class="col-total money">${total === null ? "" : formatMoney(total)}</td>
    </tr>`;
  });
  const used = pageItems.reduce((sum, row) => sum + row.units, 0);
  const blanks = pageItems.length ? 0 : minimumRows;
  for (let i = 0; i < blanks; i += 1) rows.push(`<tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`);
  return rows.join("");
}

function tally() {
  return `<div class="tally"><div class="tally-label">SHIPPING CONTAINER TALLY</div><div class="tally-numbers">${Array.from({ length: 50 }, (_, index) => `<span>${index + 1}</span>`).join("")}</div></div>`;
}

function block(label, value, extra = "") {
  return `<div class="block ${extra}"><span class="block-label">${label}</span><div class="block-value">${escapeHtml(value)}</div></div>`;
}

function sheetAmount(pageItems) {
  const totals = pageItems.map(({ item, continuation }) => continuation ? null : lineTotal(item)).filter(value => value !== null);
  return totals.length ? formatMoney(totals.reduce((sum, value) => sum + value, 0)) : "";
}

function allAmount() {
  const totals = state.property.map(lineTotal).filter(value => value !== null);
  return totals.length ? formatMoney(totals.reduce((sum, value) => sum + value, 0)) : "";
}

function mainPage(pageItems, totalSheets) {
  return `<article class="dd1149-page main-form" aria-label="DD Form 1149, sheet 1 of ${totalSheets}">
    ${tally()}
    <div class="form-title"><span></span><h3>REQUISITION AND INVOICE/SHIPPING DOCUMENT</h3><span class="omb">OMB No. 0704-0246</span></div>
    <div class="official-grid">
      <div class="official-left">
        ${block("1. FROM: (Include ZIP Code)", state.shipment.from)}
        ${block("2. TO: (Include ZIP Code)", state.shipment.to)}
        ${block("3. SHIP TO - MARK FOR", state.shipment.shipToMarkFor)}
        ${block("4. APPROPRIATIONS DATA", state.advanced.appropriations, "small-value")}
      </div>
      <div class="official-right">
        <div class="right-pair">${block("SHEET NO.", "1")}${block("NO. OF SHEETS", totalSheets)}</div>
        <div class="right-pair">${block("5. REQUISITION DATE", formatDate(state.authority.documentDate))}${block("6. REQUISITION NUMBER", state.advanced.requisitionNumber)}</div>
        ${block("9. AUTHORITY OR PURPOSE", authorityPurposeText(), "small-value")}
        <div class="right-pair">${block("7. DATE MATERIAL REQUIRED (YYYYMMDD)", formatDate(state.advanced.requiredDate))}${block("8. PRIORITY", state.advanced.priority)}</div>
        <div class="right-pair">${block("10. SIGNATURE", state.advanced.signature)}${block("11a. VOUCHER NUMBER & DATE (YYYYMMDD)", state.advanced.voucherNumberDate)}</div>
        <div class="right-pair">${block("12. DATE SHIPPED (YYYYMMDD)", formatDate(state.shipping.dateShipped))}${block("11b.", "")}</div>
        <div class="right-pair">${block("13. MODE OF SHIPMENT", state.shipping.mode)}${block("14. BILL OF LADING NUMBER", state.shipping.billOfLading)}</div>
        ${block("15. AIR MOVEMENT DESIGNATOR OR PORT REFERENCE NO.", state.shipping.airMovement)}
      </div>
    </div>
    <table class="official-table">${officialTableHead()}<tbody>${renderOfficialRows(pageItems, 8)}</tbody></table>
    <div class="lower-grid">${block("16. TRANSPORTATION VIA AMC OR MSC CHARGEABLE TO", state.shipping.transportChargeableTo)}${block("17. SPECIAL HANDLING", state.shipping.specialHandling)}</div>
    <div class="packing-receipt">
      <div class="packing-box">
        ${mini("18. RECAPITULATION / ISSUED BY", state.packing.issuedBy)}${mini("TOTAL CONTAINERS", state.packing.totalContainers)}${mini("TYPE CONTAINER", state.packing.containerType)}${mini("DESCRIPTION", state.packing.containerDescription)}${mini("TOTAL WEIGHT", state.packing.totalWeight)}${mini("TOTAL CUBE", state.packing.totalCube)}
        ${mini("CHECKED BY", state.packing.checkedBy)}${mini("", "")}${mini("", "")}${mini("", "")}${mini("", "")}${mini("", "")}
        ${mini("PACKED BY", state.packing.packedBy)}${mini("", "")}${mini("", "")}${mini("", "")}${mini("", "")}${mini("", "")}
      </div>
      <div class="receipt-box">
        ${mini("19. RECEIPT / CONTAINERS RECEIVED EXCEPT AS NOTED", state.advanced.containersReceived)}${mini("DATE (YYYYMMDD)", formatDate(state.advanced.receivedDate))}${mini("BY", state.advanced.receivedBy)}
        ${mini("QUANTITIES RECEIVED EXCEPT AS NOTED", state.advanced.quantitiesReceived)}${mini("DATE (YYYYMMDD)", formatDate(state.advanced.receivedDate))}${mini("BY", state.advanced.receivedBy)}
        ${mini("POSTED", state.advanced.posted)}${mini("20. RECEIVER'S VOUCHER NO.", state.advanced.receiverVoucherNumber)}${mini("", "")}
      </div>
    </div>
    <div class="totals-strip"><div></div><div><span>GRAND TOTAL</span><span>${allAmount()}</span></div></div>
    <div class="form-footer"><span class="edition">DD FORM 1149, JAN 2016</span><span>UNOFFICIAL PREPARATION COPY</span><span>SHEET TOTAL ${sheetAmount(pageItems)}</span></div>
  </article>`;
}

function mini(label, value) {
  return `<div class="mini-cell"><span class="mini-label">${escapeHtml(label)}</span>${escapeHtml(value)}</div>`;
}

function continuationPage(pageItems, sheetNumber, totalSheets) {
  return `<article class="dd1149-page continuation" aria-label="DD Form 1149C, sheet ${sheetNumber} of ${totalSheets}">
    ${tally()}
    <div class="form-title"><span></span><h3>REQUISITION AND INVOICE/SHIPPING DOCUMENT (Continuation Sheet)</h3><span class="omb">OMB No. 0704-0246</span></div>
    <div class="continuation-header">
      <div class="continuation-title">DD FORM 1149C</div>
      ${block("SHEET NO.", sheetNumber)}${block("NO. OF SHEETS", totalSheets)}
    </div>
    <table class="official-table">${officialTableHead()}<tbody>${renderOfficialRows(pageItems, 20)}</tbody></table>
    <div class="continuation-total"><span><b>SHEET TOTAL</b><b>${sheetAmount(pageItems)}</b></span></div>
    <div class="form-footer"><span class="edition">DD FORM 1149C, JAN 2016</span><span>UNOFFICIAL PREPARATION COPY</span><span>REQUISITION NO. ${escapeHtml(state.advanced.requisitionNumber)}</span></div>
  </article>`;
}

let paginationError = "";
function renderPreview() {
  let pages;
  try { pages = paginate(state.property); paginationError = ""; }
  catch (error) { paginationError = error.message; showNotice(paginationError, true); return; }
  const totalSheets = pages.length;
  previewPages.innerHTML = mainPage(pages[0] ?? [], totalSheets) + pages.slice(1).map((items, index) => continuationPage(items, index + 2, totalSheets)).join("");
  document.getElementById("sheetCount").textContent = `${totalSheets} ${totalSheets === 1 ? "sheet" : "sheets"}`;
  document.getElementById("previewTotal").textContent = allAmount() ? `Total: $${allAmount()}` : "Total: -";
  updateWarningSummary();
}

function bindStateInputs() {
  document.querySelectorAll("[data-path]").forEach(input => {
    input.value = getPath(state, input.dataset.path) ?? "";
    input.addEventListener("input", event => {
      setPath(state, input.dataset.path, event.target.value);
      input.classList.remove("invalid");
      const error = document.getElementById(`error-${input.id}`);
      if (error) error.textContent = "";
      renderPreview();
    });
  });
}

function syncStateInputs() {
  document.querySelectorAll("[data-path]").forEach(input => input.value = getPath(state, input.dataset.path) ?? "");
}

function validate() {
  const errors = [];
  if (!state.shipment.from.trim()) errors.push({ type: "field", field: "from", message: "From organization and address are required." });
  if (!state.shipment.to.trim()) errors.push({ type: "field", field: "to", message: "To organization and address are required." });
  if (!state.authority.contract.trim()) errors.push({ type: "field", field: "contract", message: "Contract number is required." });
  if (!state.property.length) errors.push({ type: "property", message: "Add at least one property item." });
  state.property.forEach((item, index) => {
    if (!item.description.trim()) errors.push({ type: "row", index, field: "description", message: "Description is required." });
    if (!isFiniteNumber(item.quantity) || Number(item.quantity) <= 0) errors.push({ type: "row", index, field: "quantity", message: "Enter a quantity greater than zero." });
    if (!item.uom.trim()) errors.push({ type: "row", index, field: "uom", message: "UOM is required." });
  });
  return errors;
}

function warnings() {
  const output = [];
  if (!state.authority.authorization.trim()) output.push("Authority/reference is blank.");
  if (!state.shipping.dateShipped) output.push("Shipment date is blank.");
  const missing = key => state.property.filter(item => !String(item[key] ?? "").trim()).length;
  const serial = missing("serial_number");
  const tag = missing("tag");
  const cost = missing("unit_cost");
  if (serial) output.push(`${serial} ${serial === 1 ? "item has" : "items have"} no serial number.`);
  if (tag) output.push(`${tag} ${tag === 1 ? "item has" : "items have"} no property tag.`);
  if (cost) output.push(`${cost} ${cost === 1 ? "item has" : "items have"} no unit acquisition cost.`);
  return output;
}

function displayErrors(errors) {
  document.querySelectorAll(".invalid").forEach(node => node.classList.remove("invalid"));
  document.querySelectorAll(".field-error, .inline-error").forEach(node => node.textContent = "");
  document.getElementById("propertyError").textContent = "";
  errors.forEach(error => {
    if (error.type === "field") {
      const input = document.getElementById(error.field);
      input.classList.add("invalid");
      document.getElementById(`error-${error.field}`).textContent = error.message;
    } else if (error.type === "property") {
      document.getElementById("propertyError").textContent = error.message;
    } else {
      const row = propertyRows.querySelector(`.property-row[data-index="${error.index}"]`);
      const input = row?.querySelector(`.${error.field}`);
      const message = row?.querySelector(`.${error.field}-error`);
      input?.classList.add("invalid");
      if (message) message.textContent = error.message;
    }
  });
  if (errors.length) (document.querySelector(".invalid") ?? document.getElementById("property-heading")).focus?.();
}

function updateWarningSummary() {
  const list = warnings();
  document.getElementById("validationSummary").textContent = list.length ? `${list.length} review ${list.length === 1 ? "note" : "notes"}: ${list.join(" ")}` : "Ready to print.";
}

function printDocument() {
  renderPreview();
  const clipped = [...previewPages.querySelectorAll(".block, .mini-cell")].some(el => el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2);
  if (paginationError || clipped) {
    showNotice(paginationError || "A fixed form field is too long to print without clipping. Shorten it or place details in a property description.", true);
    return;
  }
  const errors = validate();
  displayErrors(errors);
  if (errors.length) {
    showNotice(`Fix ${errors.length} required ${errors.length === 1 ? "field" : "fields"} before printing.`, true);
    document.querySelector(".invalid, .section-error:not(:empty)")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const review = warnings();
  if (review.length && !window.confirm(`Review before printing:\n\n${review.join("\n")}\n\nThese are not automatically compliance failures. Print anyway?`)) return;
  window.print();
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.hidden = false;
  notice.style.borderColor = isError ? "var(--danger)" : "";
  notice.style.background = isError ? "var(--danger-soft)" : "";
  notice.style.color = isError ? "var(--danger)" : "";
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 5000);
}

function csvParse(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(value); value = ""; }
    else if (char === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
    else if (char !== "\r") value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function importCsv(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = csvParse(String(reader.result));
      const headers = rows.shift()?.map(value => value.trim().toLowerCase()) ?? [];
      const missingHeaders = ["description", "quantity", "uom"].filter(key => !headers.includes(key));
      if (missingHeaders.length) throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
      const imported = rows.filter(row => row.some(value => value.trim())).map(row => {
        const item = itemBlank();
        csvColumns.forEach(key => {
          const index = headers.indexOf(key);
          if (index >= 0) item[key] = row[index]?.trim() ?? "";
        });
        return item;
      });
      state.property.push(...imported);
      renderPropertyRows(); renderPreview();
      showNotice(`Imported ${imported.length} property ${imported.length === 1 ? "item" : "items"}.`);
    } catch (error) { showNotice(`CSV could not be imported. ${error.message}`, true); }
  };
  reader.readAsText(file);
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function loadDraft(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || !Array.isArray(data.property)) throw new Error("The file is not a DD1149 draft.");
      const fresh = createDefaultState();
      for (const section of ["shipment", "authority", "shipping", "packing", "advanced"]) {
        if (data[section] && typeof data[section] === "object") {
          for (const key of Object.keys(fresh[section])) if (typeof data[section][key] === "string") fresh[section][key] = data[section][key];
        }
      }
      fresh.property = data.property.map(source => {
        const item = itemBlank();
        for (const key of csvColumns) if (["string", "number"].includes(typeof source?.[key])) item[key] = String(source[key]);
        return item;
      });
      state = fresh; syncStateInputs(); renderPropertyRows(); renderPreview();
      showNotice(`Opened draft with ${state.property.length} property ${state.property.length === 1 ? "item" : "items"}.`);
    } catch (error) { showNotice(`Draft could not be opened. ${error.message}`, true); }
  };
  reader.readAsText(file);
}

document.getElementById("addProperty").addEventListener("click", () => {
  state.property.push(itemBlank()); renderPropertyRows(); renderPreview();
  propertyRows.querySelector("tr:last-of-type")?.previousElementSibling?.querySelector(".description")?.focus();
});
document.getElementById("csvInput").addEventListener("change", event => { if (event.target.files[0]) importCsv(event.target.files[0]); event.target.value = ""; });
document.getElementById("draftInput").addEventListener("change", event => { if (event.target.files[0]) loadDraft(event.target.files[0]); event.target.value = ""; });
document.getElementById("downloadTemplate").addEventListener("click", () => {
  const example = ["Network Server", "1", "EA", "GP-1001", "SN12345", "ABC-123", "", "4500.00", "Used", "BOX", "1", ""];
  download("DD1149-property-template.csv", `${csvColumns.join(",")}\n${example.join(",")}\n`, "text/csv;charset=utf-8");
});
document.getElementById("saveDraft").addEventListener("click", () => download(`DD1149-draft-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), "application/json"));
document.getElementById("printButton").addEventListener("click", printDocument);
document.getElementById("clearForm").addEventListener("click", () => {
  if (!window.confirm("Clear all entered DD1149 information?")) return;
  state = createDefaultState(); syncStateInputs(); renderPropertyRows(); renderPreview(); displayErrors([]); showNotice("Form cleared.");
});

bindStateInputs();
renderPropertyRows();
renderPreview();
