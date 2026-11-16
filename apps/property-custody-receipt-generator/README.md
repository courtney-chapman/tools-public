# Government Property Custody Receipt Generator

A standalone, offline browser demonstration for creating printable property issuance receipts, property return receipts, and custody acknowledgments. It documents a working acknowledgment; it is not a property management system or a Government form.

## Use

Open `index.html` in a current browser. Four bookmark buttons show one step at a time: Transaction, Parties, Property, and Preview & Print. Each step has its own URL bookmark, such as `index.html#step-4`.

1. Select a document type and enter the transaction date. A reference, location, purpose, and remarks are optional.
2. Enter issuing and receiving party names or identifiers. Organization and role are optional.
3. Add, edit, remove, or reorder property items. Each needs a description, positive quantity, and unit of measure. Asset ID, part number, serial number, condition, and item remarks are optional. Decimal quantities are allowed when appropriate for the unit; no conversion occurs.
4. Review the live preview and select **Print or save as PDF**. Printing validates required fields and uses the browser's native print function. Signature and date lines remain blank for completion outside the app.

In step 4, you may select **Include optional receiving inspection checklist**. Each observation starts **Not Checked** and can be marked Confirmed, Discrepancy, or Not Applicable, with an optional note or supporting reference. The checklist previews below the receipt and prints on a separate page tied to the receipt reference and date. Leave the option off to print the original receipt alone. The statuses record what the user entered; Not Checked does not mean acceptable, and no status establishes Government acceptance.

**Load fictional sample** fills the form with invented data. **Clear form** asks before discarding entries. Neither action saves data. Entered information stays in browser memory and is lost on reload or close; it is not transmitted. No account, installation, server, or internet connection is required.

The condition choices are descriptive demonstration labels, not Government supply condition codes. Selecting Damaged does not classify loss or trigger reporting. A receipt does not update a property record, prove authority for a move, or replace a shipment document.

## Sources and limits

The app shows **Revision 2**. [Public sources and versions](docs/sources.md) were checked on 2026-11-15; the app does not check for later changes. [Limitations](docs/limitations.md) explains what the receipt cannot establish. The source is plain HTML, CSS, and JavaScript with no runtime dependencies.

This standalone demonstration generates property custody documentation. It does not establish authorization to transfer Government Property, change contractual accountability, or relieve a contractor of stewardship. Users are responsible for following applicable contracts, procedures, and approval requirements. The application is provided as-is without a guarantee of ongoing updates or support.

Built by Courtney · [More tools on GitHub](https://github.com/courtney-chapman).

The app uses the shared navy and blue color theme and follows your system dark mode setting. Printed documents remain on white paper.
