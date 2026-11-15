# DD Form 1149 Generator

An independent, unofficial browser tool for preparing a DD Form 1149-style requisition and invoice/shipping document. It is not a Department of Defense product, an official form, or a substitute for your contract's required process.

Built by Courtney · [More tools on GitHub](https://github.com/courtney-chapman)

## Start

1. Download `dd1149-generator.zip` from this repository's [Releases](https://github.com/courtney-chapman/tools-public/releases).
2. Unzip the package and open `dd1149-generator/index.html` in a desktop browser. No installation, server, account, or network connection is needed to use the app. The official-form links require a connection to open.
3. Enter the shipment and property details. Use **Print / Save PDF** to save a PDF through the browser's print dialog. Review the resulting PDF before use.

The source files can also be opened directly from this folder. Keep `index.html`, `styles.css`, and `app.js` together. The app has no external runtime dependencies and does not send entered data to a server. Downloads and PDFs are saved only when you choose to create them. The app does not autosave; save a draft before closing the page if you need to resume.

## Import and drafts

The CSV template uses these columns, in this order:

`description,quantity,uom,tag,serial_number,part_number,nsn,unit_cost,condition,container_type,container_number,notes`

Only `description`, `quantity`, and `uom` are required CSV headers. Quoted commas, quotes, and line breaks are supported. Import appends rows to the current form. **Save Draft** downloads a JSON file with the `shipment`, `authority`, `property`, `shipping`, `packing`, and `advanced` sections. **Open Draft** replaces the current form with a saved draft. Keep drafts and generated PDFs secure: they can contain shipment, contract, and property information.

## Use limits

- Check the [official DD Form 1149 and DD Form 1149C](https://www.esd.whs.mil/Directives/forms/dd1000_1499/DD1149/) and the requirements that apply to your shipment. The output is an unofficial preparation copy.
- A DD1149 does **not** transfer government property accountability between DoD contracts. [DFARS PGI 245.103-71](https://www.acquisition.gov/dfarspgi/pgi-245.103-71-transferring-government-property-accountability.) specifies an SF 30 for that transfer.
- Where [DFARS 252.245-7005](https://www.acquisition.gov/dfars/252.245-7005-management-and-reporting-government-property.) applies, required PIEE GFP Module reporting still applies. A PDF from this tool may not replace that reporting.
- Save through the browser's PDF print destination and inspect the resulting pages before use. Physical paper printing is unverified.

## Build the download

From the repository root, run `python3 support/scripts/package_dd1149.py`. The script packages only this app's five public files into `.build/app-zips/dd1149-generator.zip` with stable ordering and timestamps. No government PDF is bundled.

## License

This app is released under the [MIT license](LICENSE), as an explicit exception to the repository's root CC BY-NC license. The government form linked above is not included in this license or package.
