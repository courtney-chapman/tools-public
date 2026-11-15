# Repository support

This directory contains repository-level maintenance guidance.

## Repository layout

- `plugins/` contains packaged plugin manifests and skills.
- `apps/dd1149-generator/` contains a standalone browser app, outside the plugin catalog.
- `apps/government-property-record-template-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/physical-inventory-count-sheet-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `apps/property-custody-receipt-generator/` contains a standalone offline browser app, outside the plugin catalog.
- `.agents/plugins/marketplace.json` is the repository marketplace catalog.
- `docs/` contains README graphics and release images.
- `support/` contains repository maintenance guidance.

The root [README](../README.md) is the capability catalog.

Validate the plugin catalog and repository structure locally with:

```bash
python3 support/scripts/validate_repository.py
```

Build the individual plugin ZIPs from tracked source files with
`python3 support/scripts/package_plugins.py`. Attach the generated files in
the ignored `.build/plugin-zips/` directory to one GitHub Release.

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
12-file ZIP is written to `.build/app-zips/government-property-record-template-generator.zip`
for attachment to a GitHub Release. The allowlist excludes private development
records and test files.

Build the Physical Inventory Count Sheet Generator download with
`python3 support/scripts/package_physical_inventory.py`. The deterministic,
10-file ZIP is written to `.build/app-zips/physical-inventory-count-sheet-generator.zip`
for attachment to a GitHub Release.

Build the Government Property Custody Receipt Generator download with
`python3 support/scripts/package_property_custody_receipt.py`. The deterministic,
7-file ZIP is written to `.build/app-zips/property-custody-receipt-generator.zip`
for attachment to a GitHub Release.

## Release presentation

- Use the product name shown on its release card as the release title. Keep the
  version in one descriptive Git tag; do not create an unversioned alias tag.
- Store reviewed PNG release cards in `docs/release-images/`. Link each release
  note to the image at its committed revision so older releases keep their image.
- Order release notes as: image, purpose, download or installation, use limits,
  then version, source commit, and ZIP SHA-256 where applicable. Keep the ZIP
  checksum tied to the exact attached file.
- Before publishing, check the image and notes for private material and verify
  the release title, tag, attached files, links, and rendered content.
