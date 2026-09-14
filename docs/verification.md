# Implementation and verification report

Date: **2026-09-14**. Environment: Windows, Node **22.19.0**, npm **10.9.3**.

**Verdict: Development build ready for review. Public release is blocked pending content, assets and human approval.**

## Toolbar popup defect correction

The user's Chrome and Firefox screenshots were inspected before source editing. Chrome showed a narrow strip with ordinary words broken across many lines; Firefox showed an almost invisible panel. The previous automated run opened the extension document in a regular tab. **Its passing result did not validate native toolbar-panel geometry and did not establish that the toolbar popup was usable.** The user's subsequent manual test exposed that missing coverage.

The exact original rule was `body { width: 400px; max-width: 100vw; margin: 0; overflow-wrap: anywhere; }`. `html` had no explicit width or minimum width. Toolbar panels derive their viewport from the popup document's intrinsic size; the body's viewport-dependent maximum could therefore cap its supposedly fixed width during that measurement. Global `overflow-wrap: anywhere` permitted the observed letter-by-letter wrapping and very small intrinsic text widths. An independent pre-fix `chrome.action.openPopup()` probe measured a real **108px viewport**. The generated Firefox/Chromium CSS matched the source, and both manifests pointed to `popup/popup.html`; this was not a stale build or wrong manifest path. No absolutely positioned children or root percentage-width rule was involved. The reset button's `width: 100%` is an ordinary child width, not the cause. The under-280px media query changed padding/type size after collapse and was removed because it supported the inappropriate 200px-tab test contract.

Final shared sizing: **`html, body { width: 380px; min-width: 380px; margin: 0; }`**. All elements and pseudo-elements use `border-box`. The body is the vertical scroll container with `max-height: 500px; overflow-y: auto`, so Firefox's scrollbar stays inside the fixed-width border box. An intermediate root-scroll implementation correctly failed the new Firefox test because it consumed viewport width and caused horizontal overflow; the body scroll container fixes that issue. No horizontal overflow hiding or font reduction was used. `overflow-wrap: break-word; word-break: normal` preserves normal words while permitting exceptional strings to wrap. The existing choice/link grids have bounded single tracks so long strings cannot expand them. Root layout no longer depends on viewport units, percentages or narrow-screen media queries.

The final **380 × 500px** native panels were measured in both Firefox and Chromium. Main content uses the body's available width: 380px with overlay scrollbars in tested Chromium, 363px with Firefox's 17px scrollbar. All five routes retain this geometry; their bottom resource links remain reachable through vertical scrolling. Native focus movement/return and an artificially long URL-shaped link label passed. Actual Chromium action-popup screenshots (`test-results/chromium-native-initial.png` and `chromium-native-route.png`) were captured from the action popup's own CDP target without viewport overrides and visually inspected. The fixed width keeps ordinary words readable and the scrolled route legible. These are development evidence, not approved store images.

Regression protection now includes a source/build validator requiring the unconditional explicit root pixel-width/min-width rule, rejecting the former viewport cap, percentage/viewport-only widths, calculated viewport sizing, oversized widths, media-query overrides and horizontal clipping. A new unit test exercises these failures. Both generated builds run this audit before packaging. `scripts/native-popup-test.mjs` opens real action popups through `action.openPopup()` and measures only the separate window returned by `extension.getViews({type: 'popup'})`; it explicitly rejects the opener tab as a substitute. Chromium uses a fresh context without viewport emulation. Firefox similarly measures its actual action popup through its extension API.

Regular-tab accessibility/interaction tests are retained and labelled separately. They assert the 380px root/body width at 100%, 150% and 200% tab zoom in a window wide enough for the document. They no longer demand fitting a fixed desktop popup into a forced 200px viewport. **Tab zoom does not alter the action popup's zoom in this environment. Native geometry was tested at default popup zoom only.** Manual retesting of the corrected toolbar builds at 100/150/200% zoom/display scale, real Chrome/Firefox UI behaviour, and screen-reader speech remains required. No manual acceptance or release approval flag was marked complete.

Files changed for this defect: `src/popup/popup.css`, `scripts/lib.mjs`, `scripts/browser-test.mjs`, `tests/core.test.mjs`, this report, `docs/local-testing.md`, `docs/architecture.md`, and `CHANGELOG.md`; added `scripts/native-popup-test.mjs`. Both generated development directories, their two development ZIPs and test evidence were regenerated. Popup HTML/JavaScript, route content, manifests, dependencies and release approval records were not changed.

Official engineering references: [Mozilla popup sizing](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups) and [Chrome action popup API and size limits](https://developer.chrome.com/docs/extensions/reference/api/action). Accessed 2026-09-14. The 380 × 500px panel is within the documented 800 × 600 maximum.

## Delivered behaviour and architecture

One plain HTML/CSS/JavaScript toolbar popup, separate local route-data module, and small Firefox/Chromium Manifest V3 variations. Five accessible choices render useful guidance within the popup. New/Level 2/Level 3 are conditional drafts; site-experience and experienced-worker results are explicitly unresolved. Reset restores focus. Two clean Elec Training links open new tabs.

No runtime dependencies or requested browser permissions. No storage, telemetry, content injection, remote scripts/fonts, background scripts/service workers, cookies or network request APIs. A restrictive CSP blocks connections and external executable resources. Firefox declares no data collection/transmission.

Development builds use labelled text branding and generated grey DEV PNGs. No logo was invented. Release builds require approved official assets; they exclude development-only material through fixed file allowlists and approval gates.

## Exact commands and final results

| Command | Exit/result |
| --- | --- |
| `npm install --no-fund` | 0; installed 337 development packages; deprecation notices for `whatwg-encoding` and `eslint`; dependency audit findings below |
| `npx playwright install chromium` | 0; installed Chromium test browser and supporting binaries |
| `npm run check:syntax` | 0; all 10 project JavaScript files passed |
| `npm test` | 0; **9 tests passed, 0 failed, 0 skipped**, including root-sizing rejection |
| `npm run validate` | 0; five routes, source URLs, review metadata, manifests and runtime security checks passed |
| `npm run build` | 0; Firefox and Chromium development directories produced |
| `node scripts/validate.mjs --built` | 0; both generated manifests, version consistency, file allowlists and six PNG icon sizes passed |
| `npm run lint` | 0; Mozilla web-ext **10.6.0**: **0 errors, 0 warnings, 0 notices** |
| `npm run test:browser` | 0; regular-tab checks plus separately opened/measured native Firefox and Chromium action popups passed |
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
| Chromium **153.0.8010.12** | Unpacked extension in an isolated headless profile. Regular tab: all five routes offline, keyboard/tab order/focus, zero popup HTTP traffic, mocked clean new-tab links with no opener, reset and no JavaScript errors. Axe WCAG A/AA passed initial state/all results. Tab geometry passed at 100/150/200% zoom with adequate window width. Separately opened native action popup: **380 × 500px**, all five routes, focus return, vertical scrolling/footer reachability and exceptional-string wrapping passed; no horizontal overflow. |
| Firefox **155.0.1** | Temporary extension in an isolated headless profile. Regular tab: all five routes offline, keyboard/focus return, 100/150/200% tab zoom geometry and reset passed. Separately opened native action popup: **380 × 500px**, all five routes, focus return, vertical scrolling/footer reachability and exceptional-string wrapping passed; no horizontal overflow. |
| Chrome, Edge, Opera | Chromium build prepared. The user's pre-fix Chrome manual test reproduced the defect. **Manual retesting of corrected builds remains required**; automated Chromium does not substitute for these branded browsers. |

The original tests opened only a regular tab and missed the defect. The corrected test suite explicitly separates tab checks from default-zoom native action-popup geometry. **Corrected toolbar-panel behaviour and screen-reader speech have not been manually signed off.** Manual acceptance in Firefox, Chrome, Edge and Opera, including native popup zoom/display scale, remains required. Automated axe checks are not a claim of complete accessibility compliance.

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
scripts/native-popup-test.mjs
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
