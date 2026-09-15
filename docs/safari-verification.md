# Safari local verification

Current authoritative Apple record: Team/App ID Prefix `3XPCC2X77K`; registered containing Bundle ID `training.elec.qualification.checker`; proposed extension ID `training.elec.qualification.checker.extension` (not registered); SKU `ELEC-QUAL-CHECKER-MAC-002`; Apple ID `6812432163`; App Store Connect platform **macOS only**. The previous app record was deleted. The diagnostic corrects target-specific identifiers before validation; no extension registration or signing is authorized. This record supersedes earlier proposed-record wording below.

Update: the team reports no Xcode Cloud Safari packager access. Use [the GitHub macOS diagnostic-first route](safari-github-actions.md). The cloud instructions below are historical alternatives, not the current next action. The current App Store name is UK Electrician Route Checker; actual converter identifiers and signed builds remain pending.

Package prepared; Safari/TestFlight testing and App Store submission pending.

Verified 2026-09-15 on Windows with Node 22.19.0 and npm 10.9.3. No runtime or approved content/assets changed. Added manifests/safari.json, scripts/safari.mjs, tests/safari.test.mjs, three Safari documentation pages and store-listings/safari.md. Updated package.json commands, release-status.json, README.md and docs/architecture.md. Machine evidence is in test-results/safari-package-results.json and test-results/browser-results.json; none enters the ZIP.

## Commands and results

| Command | Result |
| --- | --- |
| npm run build:safari | PASS; source approval/asset hashes and submitted runtime match |
| npm run check:syntax | PASS; 13 JS files |
| npm test | PASS; 16 tests, including Safari negative manifest tests, deterministic ZIP and preserved submitted hashes |
| npm run validate | PASS; five routes, URL, manifests and runtime security; development validation does not imply final release |
| npm run validate:safari | PASS; production assets/content, strict manifest, 12-file allowlist, no permissions/network/browser APIs, approved HTTPS links |
| npm run package:safari | PASS; deterministic ZIP, unzipped entry comparison |
| npm run lint | PASS; 0 errors, warnings or notices (existing Firefox development lint) |
| npm run test:browser | PASS; Chromium 153.0.8010.12 regular extension-tab interaction/axe accessibility, Chromium native action popup, Firefox regular tab/native action popup |
| Independent temporary extraction and validateBuild(..., 'safari', true) | PASS; all extracted bytes equal the Safari build; root manifest validated |
| Submitted Firefox/Chromium before/after SHA256 | PASS; identical |

Browser tests run existing development packages. They cover five routes, keyboard/reset, clean links, offline behavior, scrolling and sizing. Normal-tab zoom checks at 100/150/200% are distinct from default-zoom native toolbar checks. No Safari browser, TestFlight, Apple cloud packaging or macOS execution occurred. These checks do not establish Safari acceptance. Existing final-release/manual gates were not weakened or represented as newly passed.

## Artifact

Path: dist/safari/elec-training-qualification-checker-safari-v1.0.0-packager-input.zip

Size: 187303 bytes.

SHA256: 4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88

Determinism: sorted entries, stored compression, fixed 2000-01-01 ZIP timestamps; two consecutive builds were byte-identical. Independent disk extraction: test-results/safari-extracted-WSwc2U. The ZIP currently has the same bytes as the Opera ZIP because both require the same short manifest name and unchanged runtime; it was built and validated through the independent Safari target, not assumed compatible from Opera.

Complete inventory:

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

No wrapping directory, docs, scripts, dependencies, other browser packages, screenshots or private communications are included.

## Preserved submitted packages

dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0.zip

Before and after SHA256: 1b5c0f56645f325e45519b3c99168bf40dddd1a683a6a1b9d322ffef7ba63bcd

dist/release-candidate/elec-training-qualification-checker-chromium-v1.0.0.zip

Before and after SHA256: ec0dcf5be6fae4d98f2a74bd249b40e7d94854c5d2c6e99a89492f923612741b

## Compatibility and handoff

See [official-source compatibility audit](safari-compatibility.md), [beginner App Store Connect and Mac testing instructions](safari-testing.md), and [listing/reviewer draft](../store-listings/safari.md).

Safari manifest differs from Chromium only by name: UK Electrician Qualification Checker (36 characters). Firefox-only browser_specific_settings is absent. MV3, action popup, local CSP, approved icons and all 11 non-manifest files are preserved. Safari standards compatibility is an assessment; toolbar layout, module execution, CSP, links and generated containing-app branding must pass on a Mac.

App Store name must be at most 30 characters; proposed UK Electrician Route Checker (28) needs approval/availability confirmation. Confirm Apple team/seller identity, Bundle ID training.elec.qualification.checker, SKU ELEC-QUAL-CHECKER-MAC-002, copyright holder, privacy answers and Safari listing. The containing identifier is registered; the extension identifier remains unregistered.

Pending: Apple packager success, TestFlight installation, actual macOS Safari toolbar/five-route/scroll/reset/keyboard/VoiceOver/scaling/link tests, approved Mac screenshots, privacy confirmation, Charanjit listing approval and explicit submission authority. No publishing or account actions were performed.

Exact next manual step: authorized Apple account owner opens App Store Connect > Apps and checks for an existing app record; confirm shorter name, team, Bundle ID and SKU before creating a macOS-only record. Later use its Xcode Cloud > Safari Web Extension Packager > Upload, following the linked guide.
