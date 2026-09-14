# Production release-candidate verification

**Verdict: production release-candidate ZIPs ready for manual acceptance. Not final or store-ready.** Nothing was committed, pushed, published or submitted.

Version 1.0.0. The user explicitly authorized candidate construction while keeping unperformed manual checks pending; privacy-policy approval is now recorded. Final release gates remain enforced. Account access and store collateral are submission prerequisites, not candidate/package blockers.

## Client authorization and evidence

Charanjit Mannu, approval date 2026-09-14, written client chat: Mandeep Singh may publish the approved extension and Elec Training branding through his Firefox and Chrome developer accounts on behalf of Elec Training. The user supplied the transcription and reported that changes may be made later if needed. The internal reference is internal/client-authorization.md; the private screenshot was not independently inspected or copied. Neither the internal record nor private chat evidence is embedded in any package. The current agent task expressly prohibits publication/submission.

Existing wording, bounded referral results, logo and six icons are recorded with attributed approval; no qualification statements or caveats were changed. Content and asset approval are bound to measured hashes in release-status.json. Public product material describes typical UK electrician qualification routes and passes the private-material exclusion check.

## Candidate artifacts

- dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0-release-candidate.zip: 187546 bytes; SHA256 1b5c0f56645f325e45519b3c99168bf40dddd1a683a6a1b9d322ffef7ba63bcd
- dist/release-candidate/elec-training-qualification-checker-chromium-v1.0.0-release-candidate.zip: 187321 bytes; SHA256 ec0dcf5be6fae4d98f2a74bd249b40e7d94854c5d2c6e99a89492f923612741b

Both candidates contain exactly 12 allowlisted files, with manifest.json at ZIP root:

- assets/icons/icon-128.png
- assets/icons/icon-16.png
- assets/icons/icon-32.png
- assets/icons/icon-48.png
- assets/icons/icon-64.png
- assets/icons/icon-96.png
- assets/logo.png
- data/qualification-routes.js
- manifest.json
- popup/popup.css
- popup/popup.html
- popup/popup.js

No test files, scripts, dependencies, docs, source-control files, approval records, private chat evidence, credentials or screenshots are packaged. Text entries were scanned after extraction: no DEV/development, draft, placeholder, unapproved, unresolved or not-for-release presentation. Candidate labels are on the artifact/folder names; the runtime is the production presentation, with official local artwork and no development badge. Both archives were independently rebuilt twice and have identical bytes.

Load Firefox from build/release-candidate/firefox/manifest.json and Chrome from build/release-candidate/chromium. Disable the development copy to avoid confusion, and reload/reopen after changing builds. These are local acceptance candidates, not instructions to submit.

## Metadata, privacy and security

Firefox name: UK Electrician Qualification Checker. Chromium name: UK Electrician Qualification Checker – Elec Training. Version: 1.0.0. Permanent Firefox ID: qualification-checker@elec.training. The separate development build retains its temporary ID.

Homepage/support: https://elec.training/. Support email: enquiry@elec.training. Privacy-policy URL: https://elec.training/privacy-policy/. No phone/address was added. Charanjit Mannu explicitly approved this existing URL for initial Firefox/Chrome submissions on 2026-09-14. Company approval is satisfied. The page still lacks extension-specific wording; adding it is a future improvement, not a package blocker.

Exact candidate manifests request no permissions/host permissions, background script/service worker or content scripts. The inspected runtime uses no storage, analytics, telemetry, remote scripts/fonts or background network APIs. Local modules/assets only; textContent/DOM creation, approved clean HTTPS links with noopener/noreferrer, and the restrictive CSP including connect-src 'none'. Firefox declares required: ["none"]. No secrets were found in the inspected allowlisted text entries. Extension privacy facts are separate from the linked website's data practices.

The logo is the supplied 837 x 252 PNG; square icons are supplied 16/32/48/64/96/128px PNGs. All packaged assets match approved source bytes. Source and both candidate popup stylesheets match exactly.

## Automated checks on exact candidate output

Environment: Windows, Node 22.19.0, npm 10.9.3; Chromium 153.0.8010.12 and Firefox 155.0.1. Candidate browser report: 2026-09-14T18:20:24.767Z.

| Check | Result |
| --- | --- |
| npm run check:syntax / package syntax step | PASS: 10 JavaScript files |
| npm test / package unit step | PASS: 14 tests, 0 failures |
| npm run validate | PASS: source routes, URLs, manifests, runtime security |
| npm run package:candidate, twice | PASS: both production candidates, all mandatory production checks before ZIP creation |
| npm run validate:candidate / generated validation in package pipeline | PASS: production manifests/assets/runtime allowlist/root sizing and technical/content gates |
| Mozilla lint on candidate Firefox | PASS: 0 errors, 0 warnings, 0 notices |
| Candidate Chromium tab | PASS: 5 routes offline, keyboard/focus/reset, no popup HTTP traffic/JS errors, safe new tabs, axe WCAG A/AA on initial screen and all results |
| Candidate native Chromium action popup | PASS: actual separate action popup, 5 choices/routes, dimensions, scrolling, exceptional strings and reset focus |
| Candidate Firefox tab/native action popup | PASS: actual installed extension, 5 routes, focus/reset, offline use and native dimensions/scrolling |
| Tab zoom 100/150/200% | PASS in both engines; this does not validate native popup zoom |
| npm audit --omit=dev --json | PASS: 0 vulnerabilities; no production dependencies |
| npm audit --json | Exit 1: 3 high development-tool findings via web-ext/addons-linter/image-size; tooling is excluded from packages |
| Independent candidate rebuild/extraction verification | PASS: identical ZIP hashes, 12 entries each, root manifest, production metadata/ID, exact source assets/CSS, excluded-text scan |
| Final npm run validate:release / npm run package | BLOCKED as intended: pending human acceptance listed below |

The candidate path supports deferred human visual/manual checks; company privacy approval has now been recorded. It does not skip source validation, approved content/asset hashes, runtime privacy/security audit, CSP/manifest checks, lint, accessibility/native tests or package allowlists. Unit tests prove stale content/source/asset evidence still rejects candidates and that account setup does not affect package gating.

## Native geometry and visual check

Before compact layout, both native panels were 380 x 500px, with 938px of initial Chromium content and 950px in Firefox. Current candidate Chromium initial panel: 380 x 486px, content 487px; Firefox: 380 x 487px, content 487px. Both show all five choices without initial scrolling or horizontal overflow. Integer height rounding differs by about one pixel in Chromium.

Width/min-width stays 380px on html/body, border-box throughout, 500px body scroll cap. Logo width 112px, product heading 22px, readable 14px body/labels, 44px buttons, 6px gaps and visible 3px focus outlines. Results replace the introduction and retain the selected position, steps, caveats, reset and resource links. Normal word breaking is preserved; long exceptional strings wrap safely. No clipping, CSS transforms or zoom reduction was used.

| Route | Chromium content height | Firefox content height | Scrolls |
| --- | --- | --- | --- |
| new | 737px | 737px | Yes, complete content and footer reachable |
| level-2 | 682px | 683px | Yes, complete content and footer reachable |
| level-3 | 628px | 628px | Yes, complete content and footer reachable |
| site-experience | 498px | 498px | No |
| experienced | 498px | 498px | No |

The production initial screenshot was visually inspected and shows official branding with no development badge. Screenshots named chromium-initial/route and firefox-route are regular-tab evidence, not native store screenshots. Native geometry is separately measured via action.openPopup and extension.getViews({type: 'popup'}); the opener tab is explicitly rejected as a substitute. Earlier tab-only passing tests did not validate intrinsic native toolbar sizing.

## Actual manual evidence and remaining acceptance

The user now reports testing the exact version 1.0.0 candidate packages in Firefox, Chrome, Edge and Opera. Each passed the native toolbar popup, all five routes, links/reset, keyboard navigation, 150%/200% zoom and no horizontal overflow. Final logo, icon, wording and visual presentation were explicitly approved. These reports are tied to the recorded unchanged candidate hashes. Browser versions and test dates were not supplied.

The user explicitly confirmed that Windows display-scaling and NVDA screen-reader testing were not performed. The earlier bracketed entries were placeholders. Both are recorded NOT COMPLETED. They are mandatory internal final-release gates in scripts/lib.mjs, while candidate construction remains allowed. This is a project acceptance policy, not a claim that either store specifically mandates NVDA. Runtime and approved content remain unchanged.

See internal/manual-acceptance.md and release-status.json. Final store-upload ZIP creation waits for these internal acceptance checks. Candidate artifacts remain available and retain their prior hashes.

## Submission prerequisites

Firefox: access to Mandeep Singh's authorized developer account, current account/security requirements, final Firefox listing/screenshots/privacy answers and acceptance evidence, then Mozilla review/signing through the appropriate submission workflow when separately instructed. Use the confirmed permanent ID. A company-owned account is not required by the client's authorization.

Chrome: access to Mandeep Singh's authorized developer account and any required registration/security steps, final Chrome listing/screenshots/privacy answers and acceptance evidence, then submission of the Chromium package when separately instructed. No credentials were requested/stored; no account creation, payment or submission occurred. Verify current store forms at submission time rather than assuming historical requirements.

Current source SHA256: 1c1258cc551f00ff9cae3abdc3196b1f4a60a77620dcae797379b41c0d19f5fb

Current approved content SHA256: baa0da08646a9a8f8ffb22bd96eec94ac68764aa4bb1aa7dac17b634a503596c

Asset, candidate ZIP and browser-report hashes are recorded in release-status.json and test-results/candidate-package-results.json. Human acceptance is not inferred from these computed hashes.

## Historical intrinsic-width defect

The original body width: 400px with max-width: 100vw depended circularly on native popup viewport measurement, while html had no fixed width. Global overflow-wrap: anywhere allowed very small intrinsic text widths; a real Chromium probe measured 108px. The correction established unconditional 380px width/min-width on both roots and normal word wrapping, with vertical scrolling contained inside the body. Source/build tests reject viewport/percentage sizing, sizing overrides and horizontal overflow masking. Both manifests pointed to popup/popup.html and generated CSS matched the source.

## Privacy approval update - 2026-09-14

Charanjit Mannu explicitly approved the existing https://elec.training/privacy-policy/ URL for initial Firefox and Chrome submissions through written client chat, as transcribed by the user. The company approval requirement is now satisfied. The page still lacks extension-specific wording; a dedicated extension section is recommended for the future and is not a package blocker. This supersedes earlier pending-privacy statements in this document. No website edit or manual testing is implied. All unperformed browser, zoom, display-scaling, screen-reader and final visual checks remain pending. Private evidence stays outside the packages.
