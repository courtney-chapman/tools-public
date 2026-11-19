# Bundled components

These files are loaded locally. No CDN is contacted when the app runs.

| Component | Version | Source | SHA-256 of bundled file |
| --- | --- | --- | --- |
| JSZip | 3.10.2 | `https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js` | `7f839b2d4688b845c105ebf5d2f9803075f91ea0fe72bdaac176c3a04dd3d2c1` |
| pdf-lib | 1.17.1 | `https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js` | `0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f` |
| @pdf-lib/fontkit | 1.1.1 | `https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js` | `d8df561b9fba98e24f2e5130e40948809281bbbc55a20c412359f1a0a5eb35a6` |
| Noto Sans Regular | 2.015 | `https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf` | `478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823` |

The font bytes are also embedded in `font-data.js` to avoid `file://` fetch restrictions. The TTF is kept as a source artifact; an offline distribution ZIP need only contain `font-data.js` and the license notice.

JSZip is dual licensed under MIT or GPLv3; its upstream license text is included as `JSZIP-LICENSE.txt`. pdf-lib is MIT licensed; its text is `PDF-LIB-LICENSE.txt`. Noto Sans is under SIL Open Font License 1.1; its text is `OFL.txt`. The @pdf-lib/fontkit package declares MIT; its upstream package does not provide a separate license file. Retain this notice and complete a license review before public distribution.
