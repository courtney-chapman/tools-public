# Repository support

This directory contains repository-level maintenance guidance.

## Repository layout

- `plugins/` contains packaged plugin manifests and skills.
- `apps/dd1149-generator/` contains a standalone browser app, outside the plugin catalog.
- `apps/government-property-record-template-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/physical-inventory-count-sheet-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/property-custody-receipt-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/government-property-disposition-preparation-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/pmsa-evidence-preparation-toolkit/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/commercial-item-determination/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/individual-subcontracting-plan-builder/` contains a standalone offline browser app, outside the plugin catalog.
- `.agents/plugins/marketplace.json` is the Codex marketplace catalog.
- `.claude-plugin/marketplace.json` is the Claude Code marketplace catalog.
- `docs/` contains README graphics and release images.
- `support/` contains repository maintenance guidance.

The root [README](../README.md) is the capability catalog.

The root `index.html` is the GitHub Pages homepage. `support/catalog.json` is
the source for its cards, format directions, and the tool rows in the root
README. Add or edit a public tool there, keep its thumbnail in
`assets/thumbs/` and README icon in `docs/readme/icons/`, then run
`python3 support/scripts/build_homepage_catalog.py`. The builder generates
`catalog.js` and the README rows.
It also updates the versioned `catalog.js`, `app.js`, `copy-prompt.js`, and
`style.css` URLs so returning browsers fetch changed assets. Run the builder
after any homepage JavaScript or CSS change, even if catalog entries did not
change. Use `python3 support/scripts/build_homepage_catalog.py --check` to
confirm generated files are current; repository validation runs this check.

Each format has one entry in the `formats` array with its section name,
directions, and card action labels. Add tools to `entries` with that format's
ID. Formats without entries do not appear on the site or in the README. For
future Python packages, provide a verified requirements note and a setup URL;
for standalone videos, provide a watch URL. Keep a tool-specific demo with its
tool or link it directly from that tool's card. AI plugin entries also need
platforms supported by their manifests and marketplace listings, a fictional
starter prompt, and an expected result. Browser-app cards link to the release
ZIP or, when listed, a direct standalone HTML asset. The AI Plugins section
displays compact setup directions for ChatGPT web,
Codex, and Claude Code. Keep them aligned with `docs/install-plugins.md`. The ZIP contents and
repository manifests should support every listed platform; an AI response
alone does not prove installation.
Keep collection graphics in `assets/collections/` and the page's social
preview metadata in `index.html` current when the site design changes.

Validate the plugin catalog and repository structure locally with:

```bash
python3 support/scripts/validate_repository.py
```

Build all individual plugin ZIPs from tracked source files with
`python3 support/scripts/package_plugins.py`, or build one updated plugin with
`python3 support/scripts/package_plugins.py --plugin <plugin-name>`. Attach
only that plugin's ZIP from the ignored `.build/plugin-zips/` directory to its
own GitHub Release. Tag it `<plugin-name>-v<manifest-version>` and update only
that plugin's catalog download link. The repository and both marketplace
catalogs remain shared. Each ZIP contains both the Codex and Claude Code
manifests.

Review plugin instructions and references before distribution. Nothing committed
here may depend on private content, secrets, or paid APIs. New examples should
be synthetic or sanitized. Credentials, secrets, private case material, and
personal information must never be committed. Private review evidence does not
belong in this repository.

Build the DD1149 standalone download with
`python3 support/scripts/package_dd1149.py`. The deterministic ZIP is written to
`.build/app-zips/dd1149-generator.zip` for attachment to a GitHub Release.

Build the Government Property Record Template Generator download with
`python3 support/scripts/package_government_property_records.py`. The deterministic,
13-file ZIP is written to `.build/app-zips/government-property-record-template-generator.zip`
for attachment to a GitHub Release. The allowlist excludes private development
records and test files.

Build the Physical Inventory Count Sheet Generator download with
`python3 support/scripts/package_physical_inventory.py`. The deterministic,
11-file ZIP is written to `.build/app-zips/physical-inventory-count-sheet-generator.zip`
for attachment to a GitHub Release.

Build the Government Property Custody Receipt Generator download with
`python3 support/scripts/package_property_custody_receipt.py`. The deterministic,
8-file ZIP is written to `.build/app-zips/property-custody-receipt-generator.zip`
for attachment to a GitHub Release.

Build the Government Property Disposition Preparation Checklist Generator download with
`python3 support/scripts/package_disposition_preparation.py`. The deterministic,
11-file ZIP is written to `.build/app-zips/government-property-disposition-preparation-generator.zip`
for attachment to a GitHub Release. The release image is stored separately from the app ZIP.

Build the PMSA Evidence Preparation Toolkit download with
`python3 support/scripts/package_pmsa_evidence_preparation.py`. The deterministic,
13-file ZIP is written to `.build/app-zips/pmsa-evidence-preparation-toolkit.zip`
for attachment to a GitHub Release. The release image is stored separately from the app ZIP.

Build the Noncompetitive Source Justification download with
`python3 support/scripts/package_noncompetitive_source_justification.py`. The deterministic,
four-file ZIP is written to `.build/app-zips/noncompetitive-source-justification.zip`.
`index.html` and `tokens.css` are needed at runtime; the guide and license travel with the download.
The release image is stored separately from the app ZIP.

Build the Commercial Product, Service, and COTS Determination download with
`python3 support/scripts/package_commercial_item_determination.py`. The deterministic,
four-file ZIP is written to `.build/app-zips/commercial-item-determination.zip`.
`index.html` and `tokens.css` are needed at runtime; the guide and license travel with the download.
The release image is stored separately from the app ZIP.

Build the Subcontract Negotiation Memorandum download with
`python3 support/scripts/package_subcontract_negotiation_memo.py`. The deterministic,
four-file ZIP is written to `.build/app-zips/subcontract-negotiation-memo.zip`.
`index.html` and `tokens.css` are needed at runtime; the guide and license travel with the download.

Build the Individual Subcontracting Plan Builder download with
`python3 support/scripts/package_individual_subcontracting_plan.py`. The deterministic,
four-file ZIP is written to `.build/app-zips/individual-subcontracting-plan-builder.zip`.
`index.html` and `tokens.css` are needed at runtime; the guide and license travel with the download.
The release image is stored separately from the app ZIP.
Build the Offline Audit Package Organizer download with
`python3 support/scripts/package_offline_audit_organizer.py`. The deterministic
ZIP contains the offline app, fictional samples, guide, PolyForm Noncommercial license, and third-party notices.
Check its PDF and ZIP handling with `node support/scripts/test_offline_audit_organizer.cjs`.

Build the Consent-to-Subcontract Package Builder download with
`python3 support/scripts/package_consent_to_subcontract.py`. The deterministic,
four-file ZIP contains the app, local theme tokens, public guide, and PolyForm Noncommercial license.
Check its logic and output structure with `node support/scripts/test_consent_to_subcontract.cjs`.

Build the Procurement File Readiness Checklist download with
`python3 support/scripts/package_cpsr_procurement_file_checklist.py`. The deterministic,
four-file ZIP contains the app, local theme tokens, public guide, and PolyForm Noncommercial license.
Check its logic with `node support/scripts/test_cpsr_procurement_file_checklist.cjs`.
Build the Make-or-Buy Decision Worksheet download with
`python3 support/scripts/package_make_or_buy.py`. The deterministic,
four-file ZIP contains the app, local theme tokens, public guide, and PolyForm Noncommercial license.
Check its logic and output structure with `node support/scripts/test_make_or_buy.cjs`.
Build the Supplier Performance Evaluation download with
`python3 support/scripts/package_supplier_performance_evaluation.py`. The deterministic
four-file ZIP contains the app, local theme tokens, public guide, and PolyForm Noncommercial license.
Check its logic with `node support/scripts/test_supplier_performance_evaluation.cjs`.

Build the Subcontract Closeout Checklist download with
`python3 support/scripts/package_subcontract_closeout.py`. The deterministic,
four-file ZIP contains the app, local theme tokens, public guide, and PolyForm Noncommercial license.
Check its logic and output structure with `node support/scripts/test_subcontract_closeout.cjs`.

Build the Government Customer Engagement Planner download with
`python3 support/scripts/package_government_customer_engagement_planner.py`. The deterministic,
six-file ZIP contains the offline app, public guide, and PolyForm Noncommercial license.
The release image is stored separately. Check its model and import/export logic with
`node support/scripts/test_government_customer_engagement_planner.cjs`.

Build the Government Shutdown Coordination Tracker download with
`python3 support/scripts/package_government_shutdown_tracker.py`. The deterministic,
eight-file ZIP contains the browser app, public guide, and PolyForm Noncommercial license.
The release image is stored separately.

Build the Behind the Buy training download with
`python3 support/scripts/package_behind_the_buy.py`. Its deterministic ZIP
contains only the approved self-contained `index.html`; the public guide
and license remain alongside it in the repository. The release image is
stored separately from the app ZIP.

Build the Behind the Buy: The Butterfly Effect training download with
`python3 support/scripts/package_behind_the_buy_butterfly_effect.py`. Its
deterministic ZIP contains only the approved self-contained `index.html`;
the public guide and license remain alongside it in the repository. The
release image is stored separately from the app ZIP.

Build the Behind the Buy: The True Cost of a Supplier training download with
`python3 support/scripts/package_behind_the_buy_true_cost_of_a_supplier.py`. Its
deterministic ZIP contains only the approved self-contained `index.html`;
the public guide and license remain alongside it in the repository. The
release image is stored separately from the app ZIP.

## Release presentation

Build the Weighted Guidelines Calculator download with
`python3 support/scripts/package_weighted_guidelines.py`. The deterministic,
six-file ZIP contains the offline app, public guide, and PolyForm Noncommercial license.
The release image is stored separately from the app ZIP.

Build the CDRLs and Contracts Deliverables download with
`python3 support/scripts/package_cdrl_deliverables.py`. The deterministic,
nine-file ZIP contains the offline app, fictional CSV example, public guide,
and PolyForm Noncommercial license. The release image is stored separately.

Build the REA Coordination & Package Builder download with
`python3 support/scripts/package_rea_coordination.py`. The deterministic,
eight-file ZIP contains the offline app, public guide, source references,
and PolyForm Noncommercial license. The release image is stored separately.

Build the CPARS Coordination Tracker downloads with
`python3 support/scripts/package_cpars_coordination.py`. It creates an
eight-file offline ZIP and a direct one-file HTML asset under `.build/app-zips/`.
The HTML includes the license text; both assets are for the same release tag.

- Use the product name shown on its release card as the release title. Keep the
  version in one descriptive Git tag; do not create an unversioned alias tag.
- Store reviewed PNG release cards in `docs/release-images/`. Link each release
  note to the image at its committed revision so older releases keep their image.
- Order browser-app release notes as: reviewed image, Description of the App,
  How to use it (Online Preview, Download, Guide), then Current Version. Put
  the contractor need or requirement in its own paragraph before describing
  the tool and its benefit. Use the live app URL, direct versioned ZIP asset,
  and rendered GitHub guide. For plugin and skill releases, adapt the same
  three sections to their actual install paths and assets.
- Keep source commit IDs and exact ZIP SHA-256 values in the private release
  record. Verify them against the published assets, but do not crowd public
  release notes with internal provenance or a change log.
- Before publishing, check the image and notes for private material and verify
  the release title, tag, attached files, links, and rendered content.
