# Repository support

This directory contains repository-level maintenance guidance.

## Repository layout

- `plugins/` contains packaged plugin manifests and skills.
- `apps/dd1149-generator/` contains a standalone browser app, outside the plugin catalog.
- `.agents/plugins/marketplace.json` is the repository marketplace catalog.
- `support/` contains repository maintenance guidance.

The root [README](../README.md) is the capability catalog.

Validate the plugin catalog and repository structure locally with:

```bash
python3 support/scripts/validate_repository.py
```

Build the individual plugin ZIPs from tracked source files with
`python3 support/scripts/package_plugins.py`. Attach the generated files in
the ignored `.build/plugin-zips/` directory to one GitHub Release.

Review plugin instructions and references before distribution. Keep private
case material, credentials, and personal information out of this repository.

Build the DD1149 standalone download with
`python3 support/scripts/package_dd1149.py`. The deterministic ZIP is written to
`.build/app-zips/dd1149-generator.zip` for attachment to a GitHub Release.
