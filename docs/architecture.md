# Architecture

`src/popup/` contains the semantic toolbar popup. Native buttons select a route; an ordered list presents steps. The result heading receives focus so assistive technology announces the changed context. Reset returns focus to the originating button. Native anchors open new tabs with `noopener noreferrer`; no browser tabs permission is needed.

`src/data/qualification-routes.js` owns route IDs, all qualification prose, caveats, sources, uncertainty and review metadata. The presentation code creates nodes with `textContent` and never inserts HTML strings. No selection is persisted. Closing and reopening the popup starts a fresh instance.

The toolbar document has explicit 380px width/min-width on both `html` and `body`; viewport-dependent width caps are prohibited by source/build validation. A body scroll container capped at 500px keeps its vertical scrollbar inside that width. This avoids intrinsic sizing collapse and Firefox root-scrollbar overflow. Browser tests separately verify regular-tab interactions and actual native action-popup geometry via `action.openPopup()` and `extension.getViews({type: 'popup'})`. Default-zoom automation does not replace manual zoom/display-scale and screen-reader acceptance.

Both browsers receive the same runtime. Firefox adds a Gecko ID, minimum desktop version 142, and `data_collection_permissions.required: ["none"]`. Version 142 conservatively clears Mozilla's data-declaration compatibility lint warning (desktop support began in 140). No Android support is claimed. Firefox's manifest name is shortened to “UK Electrician Qualification Checker” because Mozilla lint enforces a 45-character limit; the requested 52-character name remains the product/Chromium name and Elec Training is shown in the popup. The Firefox release name is recorded with the approved extension metadata.

The ID in the source manifest is deliberately a development placeholder; the confirmed release ID is qualification-checker@elec.training. Chromium covers Chrome, Edge and Opera; this does not imply those browsers have all been manually tested. Android remains outside scope. Safari now has a separate macOS-only packager-input target; see [Safari compatibility](safari-compatibility.md). Its runtime is byte-identical to the submitted packages except for its manifest; actual Safari acceptance remains pending.

Neither manifest declares permissions, optional permissions, host permissions, a background script, service worker or content script. A restrictive extension CSP permits only local scripts, styles and images and forbids connections, objects and forms. No remote fonts, cookies, tracking, executable downloads or storage APIs are present. Local JavaScript modules need no framework or runtime dependencies.

## Build and release control

`scripts/build.mjs` copies an explicit set of runtime files and user-supplied logo/icons into fixed generated directories. Both development and release builds use these graphics; development retains its `[DEV]` name and development-preview notice. Release builds require every existing release gate before writing files. Production serialization emits only display fields (including the unchanged result heading), excluding review/state/uncertainty and development notice fields. Unit tests exercise serialization without claiming a production build was approved. The source remains readable; no minifier is used.

`scripts/lib.mjs` centralizes schema/security checks, icon validation, fixed package allowlists and release gates. `scripts/package.mjs` packages sorted files with a fixed ZIP timestamp and no compression for deterministic bytes. It extracts and compares every entry before writing the archive. Tests, docs, dependencies, lockfiles, credentials, scripts and source-control files are excluded by the allowlist.

Release gates require all routes resolved and approved by Charanjit/Charanjit Mannu, final brand files and their hashes/provenance, confirmed support/privacy URLs and Firefox ID, four manual browser checks,  final sign-off, a content hash and validation evidence tied to a source hash. A final approvedSourceSha256 additionally binds human visual/sign-off approval to the exact source digest, separately from validatedSourceSha256. A changed runtime, manifest, tool, test, dependency lockfile, listing or privacy disclosure invalidates source evidence. Store screenshots/listings and developer-account access are separate submission prerequisites and cannot block ZIP creation. Privacy coverage and manual technical checks remain package gates. These records attest human decisions; software cannot independently verify that a person approved them. Do not populate them merely to make a build pass.

Release packaging re-runs syntax checks, unit/package tests, Mozilla lint and installed Firefox/Chromium automation before writing ZIPs. Automated checks supplement mandatory manual toolbar-panel and screen-reader review.

## Extension security versus developer tools

Test automation uses browser APIs and privileged test contexts to inspect isolated browser sessions. These files are outside the extension and never packaged. npm and browser-driver tools may connect to their vendors during setup. That is separate from the offline extension runtime. Review dependency audit results in the verification report.

## Compact presentation in 1.0.0

The initial screen uses a 112px-wide logo, 22px product heading, 14px body/choice text, 44px buttons and 6px gaps. It fits below the existing 500px body scroll cap. Selecting a route hides the product introduction and choices, shows a focused result h1 and h2 step/caveat headings, and reveals the resource footer. Reset restores the original choice and introduction. Qualification statements and caveats are unchanged. Long result screens scroll normally; no content is clipped to fit.

## Authorized production release candidates

The explicit --candidate path uses the same production serialization, manifest/asset allowlist, runtime security audit, approved content/asset hashes and source-validation evidence as final builds. It writes only build/release-candidate and dist/release-candidate, with -release-candidate ZIP names. Candidate packaging runs source/generated validation, syntax, unit/security/package tests, Mozilla lint and production native/browser/accessibility tests before writing archives. The candidate path can defer human manual/visual acceptance and company privacy confirmation as explicitly authorized. Privacy URL approval is now recorded; manual/visual acceptance remains pending. Final release gating is unchanged. Submission accounts and collateral are independently tracked.

## Privacy approval update - 2026-09-14

Charanjit Mannu explicitly approved the existing https://elec.training/privacy-policy/ URL for initial Firefox and Chrome submissions through written client chat, as transcribed by the user. The company approval requirement is now satisfied. The page still lacks extension-specific wording; a dedicated extension section is recommended for the future and is not a package blocker. This supersedes earlier pending-privacy statements in this document. No website edit or manual testing is implied. All unperformed browser, zoom, display-scaling, screen-reader and final visual checks remain pending. Private evidence stays outside the packages.
