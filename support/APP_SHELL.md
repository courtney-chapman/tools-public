# Browser app shell

All standalone apps use the same visible header and footer. Each app keeps its own workflow, fields, and instructions in the main content.

## Header

- Full-width navy bar using `--header` and `--on-header` from local `tokens.css`.
- Identical 88 px desktop bar and 110 px minimum phone bar, with centered content width of 1200 px. Every header contains only the same eyebrow, “Standalone offline demonstration,” and one `h1` with the tool name. The title uses the brand spec's 18 px bold sans-serif style.
- Put the short task description and any official source link in `.app-brand-intro` immediately below the header. Do not put badges, status messages, revision numbers, or extra links in the header.
- Use `.app-brand-header` with its `__inner` and `__eyebrow` elements. The shared CSS block in `tokens.css` must remain identical across apps so each downloaded ZIP works offline.

## Footer

- Full-width navy bar with “Built by Courtney · More tools on GitHub,” linking to `https://courtney-chapman.github.io/tools-public/`.
- The other side says “Provided as-is · Review outputs before use.” Both sides and the markup are identical in every app. Put app-specific public-source links in the intro below the header.
- Do not display revision numbers or imply that the app saves or uploads data. Put precise save and export behavior near the controls it describes.

The repository validator checks that header and footer markup match across apps after substituting the app name, and that the shared CSS is identical. Review the actual app at desktop and phone width, light and dark themes, and print mode before release. Keep navigation and form behavior specific to the task rather than forcing one workflow onto every app.
