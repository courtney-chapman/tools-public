# Government Customer Engagement Planner

A local browser workspace for Contracts teams and company leadership to track customer engagement, plan follow-ups and leadership meetings, and prepare a management report. It organizes user-entered records; it does not contact customers, inspect contracts, or determine Government requirements.

## Open the app

[Try online](https://courtney-chapman.github.io/tools-public/apps/government-customer-engagement-planner/) or download the [versioned ZIP](https://github.com/courtney-chapman/tools-public/releases/tag/government-customer-engagement-planner-v1.0.0), extract it, and open `index.html` in a current browser. The extracted app needs no account, server, external font, or network connection. Records stay in that browser's IndexedDB until you export or remove them. The online version is hosted with GitHub Pages; it does not upload your entries.

Do not enter classified, CUI, or otherwise restricted information. Protect exported files and printed reports according to your organization's rules. Export a JSON backup before clearing browser storage or replacing records.

## Use

1. **Engagement Dashboard:** Add a customer and choose an internal engagement cadence. Add separate meeting, call, email, or site-visit records. The dashboard derives the last completed engagement, next planned date, overdue follow-up, and cadence flag. Search and filter the customer list, then select a customer to see its history.
2. **Leadership Opportunities:** Add a proposed leadership meeting or flag an existing customer. Track its priority, target date, and status. To record a completed meeting in customer history, link it to an existing customer, enter the actual completed date, set its status to Completed, and choose **Record in history** once.
3. **Management Reports:** Set optional date bounds and review a dashboard of customers, engagements, attention reasons, and the leadership pipeline, followed by detail tables. Choose **Print / Save as PDF** to print or save the report. Open **Data tools: CSV and backup** for exports, imports, templates, and JSON backup or restore.

Import customers before engagements, using the matching `customer_key` from the customer export. Duplicate keys, missing customer links, invalid dates or choices, and malformed CSV are rejected. Restoring a JSON backup replaces the current browser data after confirmation. The current backup schema is `1`.

Dates and cadence flags are planning aids. A missing completed engagement cannot establish an overdue cadence. **As Needed** has no calculated cadence due date. The report date range limits completed and upcoming engagement counts and leadership opportunities; completed leadership meetings use their actual date. Attention flags use the current date. A completed leadership opportunity remains distinct until you record it in engagement history.

The app reads only CSV or JSON files you select. CSV exports prefix formula-like values with a tab to reduce spreadsheet formula execution risk. JSON is the exact-data backup. Review the management report and exported records before use.

Built by Courtney. Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
