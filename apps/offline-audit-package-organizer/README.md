# Offline Audit Package Organizer

Open `index.html` in a modern desktop browser. No server, account, API key, or network connection is required at runtime. The app runs locally in your browser. Opening it does not authorize use with controlled information; follow your organization’s handling rules.

## What it does

1. Create, edit, load, or save a version 1 JSON folder template. Expand or collapse all folders at once.
2. Import a ZIP and additional individual files. All start unassigned; original files remain untouched. Remove an individual file or clear all imported files from the session after confirmation, with Undo available.
3. Work in a compact file table. Select a page or all matching files across pages to assign one folder and document type in bulk, or remove selected files. The selected-file preview shows names and rows outside the current page. Edit export names, move rows with arrow buttons, search/filter, save a session, and undo changes. On narrow screens the table becomes one card per file. Folder and document-type selections keep rows in place; **Sort by folder and type** explicitly groups them when wanted.
4. Review a folder-grouped checklist showing Included, Missing, Optional not included, and Needs type. A file placed in a folder without a chosen document type can still be exported in that folder after a warning and confirmation. The PDF checklist labels it Needs document type.
5. Download a new ZIP and a separate PDF checklist. Save a session ZIP to resume later.

The application handles file bytes for ZIP import, integrity checks, session preservation, and export. It does not read document meaning, classify files, inspect PDF or Word content, upload data, or make compliance determinations. A session ZIP contains **copies of all imported documents**; protect it accordingly. No browser storage is used.

## Limits and behavior

- Input ZIP: 100 MB compressed; 250 MB total declared expanded size; 50 MB per file; 1,000 entries/files; maximum 200:1 compression ratio for files over 1 MB.
- Generated session and package ZIPs may be up to 300 MB because they contain copies of imported files and may include a PDF. Session import uses that 300 MB cap; ordinary ZIP import remains capped at 100 MB.
- ZIP64, encrypted, multi-volume, non-UTF-8 names, invalid paths, and unsupported compression methods are rejected.
- All unassigned files go into `Unassigned Files`; none is silently dropped. Missing required types, files needing a document type, and unassigned files require a confirmation at export. Incomplete files remain in their selected folders.
- Names are checked case insensitively for destination collisions. Original extensions must remain unchanged.
- The PDF uses a built-in font. Characters it cannot draw appear as `[U+XXXX]` codes in the checklist; filenames in the ZIP stay unchanged.
- Browser memory and download behavior vary. These limits reduce risk but do not guarantee that a device can process every archive within them.

## Fictional demonstration

Load `samples/fictional-template.json`, then import `samples/fictional-records.zip`. Assign the two request files to Planning / Request, the research file to Research / Research summary, and leave the extra note unassigned. The request filenames will become `01-01 - Request 1.txt` and `01-01 - Request 2.txt` in the chosen order. The first number is the folder, and the second is the document type within that folder. The unassigned note will be preserved in its own folder.

## Template and session formats

Templates use `schemaVersion: 1`, a name, and ordered `folders`. Each folder has an ID, name, and ordered `types`; each type has an ID, name, standard filename `stem`, and `required` boolean. IDs preserve assignments when labels or order change.

Session ZIPs contain `session.json` and `files/<opaque-id>` for every imported file. Version 1 sessions are validated before replacing a working session. A saved session is a snapshot; the undo history starts fresh after loading.

## Distribution

The download ZIP includes this guide, the MIT license for the app’s original code, bundled third-party notices, and the files needed to run offline. Files and saved session ZIPs stay on your device unless you choose to share them. The optional online page is a static copy of the app; imported files are processed in the browser and are not uploaded by the app.

Third-party scripts are bundled locally under `vendor/`. See `vendor/NOTICE.md` for versions, sources, hashes, and separate license terms.

Built by Courtney · Revision 13
