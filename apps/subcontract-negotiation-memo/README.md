# Subcontract Negotiation Memorandum

An offline browser app for prime-contractor buyers to document a supplier proposal, their evaluation and negotiation objective, the negotiation exchanges, and the agreed result. It prepares a purchase-file memorandum for Procurement review. The buyer and Procurement remain responsible for factual conclusions, clause applicability, price reasonableness, and approvals.

## Use

Open `index.html` in a current browser. The app has five bookmarkable steps:

1. **Before:** Identify the purchase, record the supplier proposal, evaluate it, set an objective, and record whether certified cost or pricing data are required and why. A waiver needs its approval reference.
2. **During:** Record dates, participants, offers, counteroffers, material issues, and changes to scope or terms.
3. **After:** Record an agreed amount when reached, compare proposed, objective, and negotiated amounts, explain price reasonableness, and identify supporting records. When applicable, record certified-data updates and supplier certification status.
4. **Check:** Review missing information, supporting evidence, and items for Procurement review. These checks use entered data and do not verify facts.
5. **Memo:** Review the purchase-file document, copy it, or print/save a PDF. Incomplete drafts show `[INSERT]` prompts. A completed title appears only when the Check step has no missing information or evidence gaps. It does not approve a purchase or execute a supplier certificate.

**Get AI Help** copies an optional prompt for the user to decide whether to share. **Export JSON** saves a working record; **Import JSON** validates it and asks before replacing populated data. **Clear all** asks before erasing current entries. To avoid a local file path or timestamp in the PDF, disable browser **Headers and footers** in the print dialog.

## Rule basis and limits

The buyer records the governing contract clause or rule basis. The app does not choose a certified-data threshold or exception, determine which clause applies, calculate a cost estimate, or infer that a price is fair and reasonable from a reduction. Procurement should confirm the applicable contract and company procedures. For general context, see [FAR 15.404-3](https://www.acquisition.gov/far/15.404-3), [FAR 52.215-12](https://www.acquisition.gov/far/52.215-12), and the applicable version of [DFARS 252.244-7001](https://www.acquisition.gov/dfars/252.244-7001-contractor-purchasing-system-administration.). The FAR Overhaul may use different section numbering where an agency deviation applies. Verify current sources before use.

The memorandum contains six core sections and a seventh certified-data section when applicable. Supplier certification remains a separate purchase-file record. The app does not open or verify referenced documents, transmit data, or grant Procurement approval.

## Data and privacy

Entries stay in browser memory while the page is open. Refreshing or closing it discards unsaved work. Nothing is sent or saved automatically. Exported JSON, copied text, and PDFs may contain procurement information; handle them in an authorized environment. The offline ZIP contains this guide, the PolyForm Noncommercial license, and the `index.html` with local `tokens.css`.

Built by [Courtney](https://github.com/courtney-chapman/tools-public). Revision 2. JSON schema version 1.1.
