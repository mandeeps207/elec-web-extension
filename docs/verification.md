# Implementation and verification report

Date: **2026-09-14**. Environment: Windows, Node **22.19.0**, npm **10.9.3**.

**Verdict: Development build ready for review. Public release is blocked pending content, assets and human approval.**

## Delivered behaviour and architecture

One plain HTML/CSS/JavaScript toolbar popup, separate local route-data module, and small Firefox/Chromium Manifest V3 variations. Five accessible choices render useful guidance within the popup. New/Level 2/Level 3 are conditional drafts; site-experience and experienced-worker results are explicitly unresolved. Reset restores focus. Two clean Elec Training links open new tabs.

No runtime dependencies or requested browser permissions. No storage, telemetry, content injection, remote scripts/fonts, background scripts/service workers, cookies or network request APIs. A restrictive CSP blocks connections and external executable resources. Firefox declares no data collection/transmission.

Development builds use labelled text branding and generated grey DEV PNGs. No logo was invented. Release builds require approved official assets; they exclude development-only material through fixed file allowlists and approval gates.

## Exact commands and final results

| Command | Exit/result |
| --- | --- |
| `npm install --no-fund` | 0; installed 337 development packages; deprecation notices for `whatwg-encoding` and `eslint`; dependency audit findings below |
| `npx playwright install chromium` | 0; installed Chromium test browser and supporting binaries |
| `npm run check:syntax` | 0; all 9 project JavaScript files passed |
| `npm test` | 0; **8 tests passed, 0 failed, 0 skipped** |
| `npm run validate` | 0; five routes, source URLs, review metadata, manifests and runtime security checks passed |
| `npm run build` | 0; Firefox and Chromium development directories produced |
| `node scripts/validate.mjs --built` | 0; both generated manifests, version consistency, file allowlists and six PNG icon sizes passed |
| `npm run lint` | 0; Mozilla web-ext **10.6.0**: **0 errors, 0 warnings, 0 notices** |
| `npm run test:browser` | 0; actual installed Firefox and Chromium extension-document checks passed |
| `npm run package:dev` | 0; two development ZIPs created, extracted and compared entry-for-entry |
| `npm run validate:release` | **1, expected**; 26 unsatisfied approval/asset checks; source validation itself passed |
| `npm run package` | **1, expected**; release blocked before creating a release ZIP |
| `npm audit --json` | **1**; 3 high-severity development dependency findings through `web-ext → addons-linter → image-size` |
| `npm audit --omit=dev` | 0; **0 vulnerabilities**; no production dependencies |

The tests check all five IDs and labels, meaningful steps or unresolved status, sources/review metadata, URL HTTPS/domain/tracking restrictions, manifest capabilities/version, unsafe runtime patterns, release rejection (including approved-but-unresolved data), generated package allowlists/icons, root manifests, byte-for-byte ZIP contents and repeat-build determinism. They explicitly reject development builds when validated as release builds.

Positive end-to-end release packaging cannot be exercised with real release content until approvals/assets exist. The negative gate paths and development packaging paths are tested. No approval flags were fabricated for testing.

## Browser evidence

| Browser | Actual automated result |
| --- | --- |
| Chromium **153.0.8010.12** | Unpacked extension loaded and enabled in an isolated headless profile. All five routes used offline. Keyboard activation, tab order, focus movement/return, zero popup HTTP traffic, both clean links opening separate tabs with no opener, selection reset on reload and zero JavaScript errors passed. Destination pages were mocked, so link tests did not contact Elec Training. Axe WCAG A/AA checks passed for initial state and all five results. Actual tab zoom 200% and 200px viewport reflow passed. |
| Firefox **155.0.1** | Actual temporary extension installed in an isolated headless profile. All five routes worked offline, keyboard activation and focus return passed, actual 200% tab zoom had no horizontal overflow, reload reset passed. |
| Chrome, Edge, Opera | Shared Chromium build prepared; **no manual installation/testing completed in these branded browsers**. Chromium automation does not substitute for those checks. |

These tests open the extension's real popup document in a browser tab. **Native toolbar-panel sizing/scroll behaviour and screen-reader speech have not been manually verified.** Manual acceptance in Firefox, Chrome, Edge and Opera, including native popup zoom, remains required. Automated axe checks are not a claim of complete accessibility compliance.

Screenshots were generated under `test-results/`. The initial Chromium state, longest route, both unresolved results and 200% viewport captures were visually inspected; representative Firefox route/zoom captures were also inspected. Visible text and focus states are readable. Long results intentionally scroll. These are internal development evidence, not approved store screenshots.

## Issues found and resolved or retained

- Initial Mozilla lint failed because the requested full product name is **52 characters**, beyond its **45-character** name limit. Firefox now uses **UK Electrician Qualification Checker** (with a DEV prefix in development). Chromium keeps the requested full name. The shorter Firefox name needs company approval.
- Initial lint warned about Firefox data-declaration compatibility. The minimum Firefox version is now **142.0**, and lint passes with warnings treated as errors. Desktop support for the declaration starts earlier, but this conservative minimum avoids the linter's cross-platform warning. No Android compatibility claim is made.
- Initial Firefox automation rejected the system-access argument in browser capabilities. It was moved to the geckodriver service argument as documented by Mozilla; the final test passed.
- Playwright's full-page screenshot at non-default tab zoom clipped its capture. The test now captures the physical viewport through CDP; layout/reflow assertions remain independent of screenshots. Final zoom capture was inspected.
- Python was unavailable during the first brief-extraction attempt; complete Word XML paragraph text was successfully read using .NET ZIP/XML support instead. No source document was changed.
- Both official logo URL downloads returned HTTP 403; no asset was downloaded/used. The design-team request is in `src/assets/README.md`.
- The development audit flags image parser denial-of-service advisories [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq). `npm view image-size version` returned **2.0.2**, still affected. npm suggested downgrading web-ext to 5.5.0; that was not applied because current Manifest V3/data-declaration validation is needed. The tools only lint this project's local files and are excluded from packages. Recheck upstream tooling before release.

## Produced builds and archives

- `build/development/firefox/` — load `manifest.json` temporarily in Firefox.
- `build/development/chromium/` — select this directory for unpacked loading in Chrome, Edge or Opera.
- `dist/development/elec-training-qualification-checker-firefox-v0.1.0-development.zip`
- `dist/development/elec-training-qualification-checker-chromium-v0.1.0-development.zip`

Each development archive contains exactly 11 files: root `manifest.json`, three popup files, one route-data module and six PNG icons. The runtime is readable and the archives are deterministic. **No release ZIPs were produced.**

## Remaining release prerequisites

Charanjit must approve the exact qualification wording, resolve the two uncertain outcomes and confirm certificate equivalence, relevant prerequisites and UK nation coverage. The company must supply approved logo/icon PNGs (16/32/48/64/96/128px icons), provenance, permanent Firefox ID, confirmed support/privacy URLs, screenshot/listing approval including the shorter Firefox name, four manual browser checks and final sign-off. Evidence must match the content/source hashes in `release-status.json`.

Any later account verification, payment or store submission needs separate authorization. No accounts, payments, messages to others, commits, pushes or submissions were made. Safari remains a separate phase.

## Complete repository file inventory

All files below were created in the previously empty workspace; no pre-existing repository files were modified.

```text
.gitignore
package.json
package-lock.json
release-status.json
README.md
CONTENT_APPROVAL.md
CHANGELOG.md
src/popup/popup.html
src/popup/popup.css
src/popup/popup.js
src/data/qualification-routes.js
src/assets/README.md
manifests/firefox.json
manifests/chromium.json
scripts/lib.mjs
scripts/build.mjs
scripts/package.mjs
scripts/validate.mjs
scripts/syntax.mjs
scripts/browser-test.mjs
tests/core.test.mjs
store-listings/firefox.md
store-listings/edge.md
store-listings/chrome.md
store-listings/opera.md
privacy/privacy-disclosure.md
docs/implementation-plan.md
docs/architecture.md
docs/content-sources.md
docs/local-testing.md
docs/submission-checklist.md
docs/verification.md
```

Generated/ignored files: each of `build/development/{firefox,chromium}/` contains `manifest.json`, `popup/popup.html`, `popup/popup.css`, `popup/popup.js`, `data/qualification-routes.js`, and `assets/icons/icon-{16,32,48,64,96,128}.png`. The two ZIP paths are listed above. `test-results/` contains `browser-results.json`, `chromium-initial.png`, `chromium-{new,level-2,level-3,site-experience,experienced}.png`, `chromium-200-percent.png`, `firefox-{new,level-2,level-3,site-experience,experienced}.png` and `firefox-200-percent.png`. `node_modules/` is local development tooling, excluded from source/package deliverables.
