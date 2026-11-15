/* Standalone browser form. Working values stay in memory; text is never executed. */
(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const value = id => byId(id).value.trim();
  const text = (id, content) => { byId(id).textContent = content || "—"; };
  const itemList = byId("item-list");
  const titles = {
    issuance: "Property Issuance Receipt",
    return: "Property Return Receipt",
    custody: "Property Custody Acknowledgment"
  };
  const statements = {
    issuance: "The receiving party acknowledges receipt of the property identified in this document.",
    return: "The receiving party acknowledges receipt of the property returned by the issuing party and identified in this document.",
    custody: "The receiving party, identified here as the custodian, acknowledges possession of the listed property as documented on the receipt date."
  };
  const fields = ["description", "assetId", "partNumber", "serialNumber", "quantity", "unit", "condition", "itemRemarks"];

  function showStep() {
    const match = /^#step-([1-4])$/.exec(window.location.hash);
    const active = match ? match[1] : "1";
    document.querySelectorAll("[data-step]").forEach(panel => { panel.hidden = panel.dataset.step !== active; });
    document.querySelectorAll("[data-step-link]").forEach(link => {
      if (link.dataset.stepLink === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  }

  function createItem(data = {}) {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `<div class="item-heading"><h3>Item</h3><div class="row-actions"><button type="button" class="quiet" data-action="up">Move up</button><button type="button" class="quiet" data-action="down">Move down</button><button type="button" class="quiet" data-action="remove">Remove</button></div></div>
      <div class="item-fields">
        <label class="wide">Property description <input data-field="description" type="text" maxlength="400" required></label>
        <label>Asset identifier <span class="optional">Optional</span><input data-field="assetId" type="text" maxlength="120"></label>
        <label>Part number <span class="optional">Optional</span><input data-field="partNumber" type="text" maxlength="120"></label>
        <label>Serial number <span class="optional">Optional</span><input data-field="serialNumber" type="text" maxlength="120"></label>
        <label>Quantity <input data-field="quantity" type="text" inputmode="decimal" placeholder="Positive number" required></label>
        <label>Unit of measure <input data-field="unit" type="text" maxlength="40" placeholder="e.g., EA" required></label>
        <label>Condition <span class="optional">Optional</span><select data-field="condition"><option value="">Not entered</option><option>New</option><option>Serviceable</option><option>Unserviceable</option><option>Damaged</option><option>Not Assessed</option><option>Other</option></select></label>
        <label class="wide">Condition or item remarks <span class="optional">Optional</span><textarea data-field="itemRemarks" rows="2" maxlength="600"></textarea></label>
      </div>`;
    fields.forEach(name => { card.querySelector(`[data-field="${name}"]`).value = data[name] || ""; });
    return card;
  }

  function cards() { return [...itemList.querySelectorAll(".item-card")]; }
  function itemData(card) {
    return Object.fromEntries(fields.map(name => [name, card.querySelector(`[data-field="${name}"]`).value.trim()]));
  }
  function renumber() {
    cards().forEach((card, index, all) => {
      card.querySelector("h3").textContent = `Item ${index + 1}`;
      card.querySelector('[data-action="up"]').disabled = index === 0;
      card.querySelector('[data-action="down"]').disabled = index === all.length - 1;
    });
  }
  function addItem(data = {}) {
    itemList.append(createItem(data));
    renumber();
    renderPreview();
  }
  function formatDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
  }
  function td(content, className = "") {
    const cell = document.createElement("td");
    cell.textContent = content || "—";
    if (className) cell.className = className;
    return cell;
  }
  function renderPreview() {
    byId("validation").replaceChildren();
    const type = value("type");
    const title = titles[type] || "Select a document type";
    text("r-title", title);
    text("r-table-title", title);
    text("r-ref", value("reference"));
    text("r-table-ref", value("reference") || "No reference");
    text("r-date", formatDate(value("date")));
    byId("r-location-wrap").hidden = !value("location");
    text("r-location", value("location"));
    byId("r-purpose-wrap").hidden = !value("purpose");
    text("r-purpose", value("purpose"));
    text("r-issuer-name", value("issuer-name"));
    text("r-receiver-name", value("receiver-name"));
    text("r-issuer-detail", [value("issuer-org"), value("issuer-role")].filter(Boolean).join(" · "));
    text("r-receiver-detail", [value("receiver-org"), value("receiver-role")].filter(Boolean).join(" · "));
    text("r-statement", statements[type] || "Select a document type to see its acknowledgment.");
    byId("r-remarks-wrap").hidden = !value("remarks");
    text("r-remarks", value("remarks"));
    const tbody = byId("r-items");
    tbody.replaceChildren();
    cards().forEach((card, index) => {
      const item = itemData(card);
      const row = document.createElement("tr");
      row.append(td(String(index + 1)));
      const property = document.createElement("td");
      const description = document.createElement("span");
      description.className = "property-main";
      description.textContent = item.description || "Description pending";
      property.append(description);
      const details = [["Asset ID", item.assetId], ["Part", item.partNumber], ["Serial", item.serialNumber]]
        .filter(([, val]) => val).map(([label, val]) => `${label}: ${val}`).join(" · ");
      if (details) {
        const line = document.createElement("span");
        line.className = "property-detail";
        line.textContent = details;
        property.append(line);
      }
      row.append(property, td(item.quantity), td(item.unit), td(item.condition), td(item.itemRemarks));
      tbody.append(row);
    });
  }
  function validate() {
    const errors = [];
    let first = null;
    const requireField = (id, label) => {
      if (!value(id)) { errors.push(`${label} is required.`); first ||= byId(id); }
    };
    requireField("type", "Document type");
    requireField("date", "Transaction date");
    if (value("date") && !byId("date").validity.valid) { errors.push("Enter a valid transaction date."); first ||= byId("date"); }
    requireField("issuer-name", "Issuing-party name or identifier");
    requireField("receiver-name", "Receiving-party name or identifier");
    const all = cards();
    if (!all.length) { errors.push("Add at least one property item."); first ||= byId("add-item"); }
    all.forEach((card, index) => {
      const item = itemData(card);
      for (const [field, label] of [["description", "description"], ["quantity", "quantity"], ["unit", "unit of measure"]]) {
        if (!item[field]) { errors.push(`Item ${index + 1}: ${label} is required.`); first ||= card.querySelector(`[data-field="${field}"]`); }
      }
      if (item.quantity && (!/^\d+(?:\.\d+)?$/.test(item.quantity) || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
        errors.push(`Item ${index + 1}: quantity must be a positive number.`);
        first ||= card.querySelector('[data-field="quantity"]');
      }
    });
    const box = byId("validation");
    box.replaceChildren();
    if (errors.length) {
      const heading = document.createElement("strong");
      heading.textContent = "Complete these fields before printing:";
      const list = document.createElement("ul");
      errors.forEach(message => { const li = document.createElement("li"); li.textContent = message; list.append(li); });
      box.append(heading, list);
    }
    return { errors, first };
  }

  byId("receipt-form").addEventListener("submit", event => event.preventDefault());
  byId("receipt-form").addEventListener("input", renderPreview);
  byId("receipt-form").addEventListener("change", renderPreview);
  byId("add-item").addEventListener("click", () => { addItem(); cards().at(-1).querySelector('[data-field="description"]').focus(); });
  itemList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest(".item-card");
    const action = button.dataset.action;
    if (action === "remove") card.remove();
    if (action === "up" && card.previousElementSibling) itemList.insertBefore(card, card.previousElementSibling);
    if (action === "down" && card.nextElementSibling) itemList.insertBefore(card.nextElementSibling, card);
    renumber();
    renderPreview();
  });
  byId("print").addEventListener("click", () => {
    const result = validate();
    if (result.errors.length) {
      const step = result.first?.closest(".step-panel")?.dataset.step;
      if (step) { window.location.hash = `#step-${step}`; showStep(); }
      result.first?.focus();
      return;
    }
    renderPreview();
    window.print();
  });
  byId("reset").addEventListener("click", () => {
    if (!window.confirm("Clear all entered receipt information from this browser session?")) return;
    byId("receipt-form").reset();
    itemList.replaceChildren();
    byId("validation").replaceChildren();
    addItem();
    window.location.hash = "#step-1";
    showStep();
    byId("type").focus();
  });
  byId("sample").addEventListener("click", () => {
    const hasData = [...byId("receipt-form").querySelectorAll("input,textarea,select")].some(input => input.value && input.value !== "Not entered");
    if (hasData && !window.confirm("Replace the current receipt information with fictional sample data?")) return;
    const sample = {
      type: "issuance", date: "2026-11-15", reference: "DEMO-RECEIPT-001", location: "Sample Room A",
      purpose: "Temporary use for a fictional project", remarks: "Fictional demonstration only.",
      "issuer-name": "Mara Finch", "issuer-org": "North Harbor Demo Works", "issuer-role": "Property desk",
      "receiver-name": "Eli Rowan", "receiver-org": "North Harbor Demo Works", "receiver-role": "Sample custodian"
    };
    Object.entries(sample).forEach(([id, content]) => { byId(id).value = content; });
    itemList.replaceChildren();
    addItem({ description: "Portable measurement unit", assetId: "DEMO-ASSET-001", partNumber: "DEMO-PN-11", serialNumber: "DEMO-SN-001", quantity: "1", unit: "EA", condition: "Serviceable", itemRemarks: "Case included" });
    addItem({ description: "Sample calibration material", partNumber: "DEMO-PN-22", quantity: "2.5", unit: "KG", condition: "Not Assessed", itemRemarks: "Fictional material lot" });
    byId("validation").replaceChildren();
    renderPreview();
  });
  window.addEventListener("hashchange", showStep);
  addItem();
  showStep();
})();
