# Repository support

This directory contains repository-level maintenance guidance.

## Repository layout

- `plugins/` contains packaged plugin manifests and skills.
- `.agents/plugins/marketplace.json` is the repository marketplace catalog.
- `support/` contains repository maintenance guidance.

The root [README](../README.md) is the capability catalog.

Validate the plugin catalog and repository structure locally with:

```bash
python3 support/scripts/validate_repository.py
```

Review plugin instructions and references before distribution. Keep private
case material, credentials, and personal information out of this repository.
