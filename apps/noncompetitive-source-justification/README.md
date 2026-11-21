# Noncompetitive Source Justification

A standalone browser app for preparing a factual, four-section noncompetitive source justification for Procurement review. It can support subcontract, agency, indirect, and commercial purchasing contexts, but does not determine which rules apply.

## Use

Open `index.html` in a current browser. No server, account, installation, or network connection is required. The app has three bookmarkable steps:

1. **Form:** Enter the supplier and requirement, alternatives considered, rationale, and unique qualifications. An optional policy or contract reference appears in the output only if Procurement has supplied one. Draft options let you copy an AI prompt or download and reopen a JSON draft. **Clear all** asks before erasing entered information.
2. **Check:** Review missing information, evidence needed, and matters for Procurement review. These checks flag gaps from entries; they do not verify facts or approve a purchase.
3. **Preview / Export:** Choose Draft or Final, then copy the text or print/save a PDF. Draft can contain `[INSERT]` prompts. Final requires completed form checks and a requester certification with name, title, date, and attestation. Final means a requester submission for Procurement review, not Procurement approval.

For a clean PDF, disable **Headers and footers** in the browser print dialog. Browser headers can otherwise expose the local file path.

## Data and limits

The app keeps working entries in memory only. Refreshing or closing the page discards unsaved work. Draft JSON, copied text, and PDFs may contain procurement information; handle exported files in an authorized environment. The AI prompt action only copies text. You decide whether an external AI service may receive it.

JSON exports use schema version 1.2. The app also imports versions 1.0 and 1.1, leaving newer fields blank. Imports are validated before replacing an existing form, and replacement requires confirmation when data is present. No data is uploaded or saved automatically.

The selected justification option is a requester description, not a regulatory exception. The app does not inspect evidence, determine a source's actual capability, perform price or cost analysis, establish clause applicability, or approve a purchase. Procurement must verify facts, the governing contract and company procedures, the sourcing classification, and approvals. No FAR or DFARS clause text is embedded in the generated justification.

The browser runtime is `index.html` with its local `tokens.css`; the download also includes this guide and the PolyForm Noncommercial license. Built by Courtney.
