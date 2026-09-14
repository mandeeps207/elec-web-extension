# Architecture

`src/popup/` contains the semantic toolbar popup. Native buttons select a route; an ordered list presents steps. The result heading receives focus so assistive technology announces the changed context. Reset returns focus to the originating button. Native anchors open new tabs with `noopener noreferrer`; no browser tabs permission is needed.

`src/data/qualification-routes.js` owns route IDs, all qualification prose, caveats, sources, uncertainty and review metadata. The presentation code creates nodes with `textContent` and never inserts HTML strings. No selection is persisted. Closing and reopening the popup starts a fresh instance.

Both browsers receive the same runtime. Firefox adds a Gecko ID, minimum desktop version 142, and `data_collection_permissions.required: ["none"]`. Version 142 conservatively clears Mozilla's data-declaration compatibility lint warning (desktop support began in 140). No Android support is claimed. Firefox's manifest name is shortened to “UK Electrician Qualification Checker” because Mozilla lint enforces a 45-character limit; the requested 52-character name remains the product/Chromium name and Elec Training is shown in the popup. The shorter Firefox name needs listing approval.

The ID in the source manifest is deliberately a development placeholder; a permanent company-approved ID is required for release. Chromium covers Chrome, Edge and Opera; this does not imply those browsers have all been manually tested. Android and Safari are outside the initial scope.

Neither manifest declares permissions, optional permissions, host permissions, a background script, service worker or content script. A restrictive extension CSP permits only local scripts, styles and images and forbids connections, objects and forms. No remote fonts, cookies, tracking, executable downloads or storage APIs are present. Local JavaScript modules need no framework or runtime dependencies.

## Build and release control

`scripts/build.mjs` copies an explicit set of runtime files into fixed generated directories. It creates labelled DEV PNGs only for development. Release builds require actual approved PNG files, replace the branding placeholder with the official logo and serialize only reviewed route fields. The source remains readable; no minifier is used.

`scripts/lib.mjs` centralizes schema/security checks, icon validation, fixed package allowlists and release gates. `scripts/package.mjs` packages sorted files with a fixed ZIP timestamp and no compression for deterministic bytes. It extracts and compares every entry before writing the archive. Tests, docs, dependencies, lockfiles, credentials, scripts and source-control files are excluded by the allowlist.

Release gates require all routes resolved and approved by Charanjit, final brand files and their hashes/provenance, confirmed support/privacy URLs and Firefox ID, four manual browser checks, screenshot/listing approval, final sign-off, a content hash and validation evidence tied to a source hash. A changed runtime, manifest, tool, test, dependency lockfile, listing or privacy disclosure invalidates source evidence. These records attest human decisions; software cannot independently verify that a person approved them. Do not populate them merely to make a build pass.

Release packaging re-runs syntax checks, unit/package tests, Mozilla lint and installed Firefox/Chromium automation before writing ZIPs. Automated checks supplement mandatory manual toolbar-panel and screen-reader review.

## Extension security versus developer tools

Test automation uses browser APIs and privileged test contexts to inspect isolated browser sessions. These files are outside the extension and never packaged. npm and browser-driver tools may connect to their vendors during setup. That is separate from the offline extension runtime. Review dependency audit results in the verification report.
