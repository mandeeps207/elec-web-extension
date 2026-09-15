# UK Electrician Qualification Checker – Elec Training

Local, permission-free browser extension, version **1.0.0**. Choose one of five starting points and read qualification guidance inside a toolbar popup. Two clean links open the Elec Training homepage and full guide in new tabs.

**Status: production release-candidate preparation authorized; final/store-ready acceptance pending.** Client authorization for Mandeep Singh is recorded internally. Production candidates use the approved wording/branding and permanent Firefox ID; manual checks remain pending; company approval of the existing privacy URL for initial Firefox/Chrome submissions is recorded. Nothing is published or submitted.

## Start locally

Install Node.js 22.19 or newer with npm. Open a terminal in this folder:

```sh
npm ci
npm run build
```

Load `build/development/firefox/manifest.json` in Firefox, or select `build/development/chromium` in Chrome, Edge or Opera. Follow [local installation instructions](docs/local-testing.md). A toolbar popup is the small panel that opens when you click the extension icon. Closing it discards the selection.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Recreate both clearly labelled development directories |
| `npm test` | Data, security, manifest, release rejection and deterministic ZIP tests; also builds development packages |
| `npm run check:syntax` | Check every project JavaScript file |
| `npm run validate` | Validate source data, manifests and security constraints |
| `node scripts/validate.mjs --built` | Also validate both generated development directories |
| `npm run lint` | Mozilla web-ext lint on the generated Firefox development build |
| `npx playwright install chromium` | One-time download of the test browser |
| `npm run test:browser` | Install/test both builds in isolated automated Firefox/Chromium sessions |
| `npm run package:dev` | Produce explicitly named local review ZIPs |
| `npm run validate:release` | Report all missing release approvals/assets |
| `npm run package:candidate` | Build and fully test production runtime, then create clearly labelled candidate ZIPs while preserving pending human acceptance |
| `npm run validate:candidate` | Audit generated production candidate files and technical/content/asset gates |
| `npm run build:release` | Build release directories only after gates pass |
| `npm run package` | Enforce gates and checks, then create release ZIPs |

Firefox must be installed for browser tests. Selenium Manager may download its driver; development tools and downloads require internet, but the extension does not. Automated test screenshots/logs go to `test-results/`, outside every package.

Development archives: `dist/development/elec-training-qualification-checker-{firefox,chromium}-v1.0.0-development.zip`.
Future release archives: `dist/elec-training-qualification-checker-{firefox,chromium}-v1.0.0.zip`. **These are intentionally not produced yet.** ZIP entries start with `manifest.json` at the root.

## Content, privacy and approvals

Read [CONTENT_APPROVAL.md](CONTENT_APPROVAL.md) for the attributed approval record, [content sources](docs/content-sources.md) for provenance and uncertainty, and [branding requirements](src/assets/README.md) for the design handoff.

The shipped runtime is plain HTML/CSS/JavaScript and local data. It requests no permissions, stores no selection and contains no analytics, network request APIs, remote resources, content scripts or background scripts. External links take the user to the website, which has its own data practices. See [privacy disclosure](privacy/privacy-disclosure.md) and [verification report](docs/verification.md).

Development dependencies support tests and packaging only; they never enter extension builds. `package-lock.json` pins them. No production dependencies are required.

Read [architecture](docs/architecture.md), [implementation plan](docs/implementation-plan.md), [submission checklist](docs/submission-checklist.md) and separate [Firefox](store-listings/firefox.md), [Edge](store-listings/edge.md), [Chrome](store-listings/chrome.md) and [Opera](store-listings/opera.md) listing drafts. Safari has a separate macOS packager-input target: see [compatibility](docs/safari-compatibility.md), [cloud packaging and Mac testing](docs/safari-testing.md), [listing draft](store-listings/safari.md) and [verification](docs/safari-verification.md). Run `npm run build:safari`, `npm run validate:safari` and `npm run package:safari`. Apple packaging, TestFlight and real Safari acceptance remain pending.

Production candidate folders: build/release-candidate/firefox and build/release-candidate/chromium. Candidate archives: dist/release-candidate/elec-training-qualification-checker-{firefox,chromium}-v1.0.0-release-candidate.zip. These are not final or store-ready. Final release commands retain all manual/privacy acceptance gates.

Safari macOS GitHub Actions alternative: [diagnostic-first workflow](docs/safari-github-actions.md), [signing setup](docs/apple-signing-setup.md), [encryption declaration](docs/apple-export-compliance.md), [optional upload](docs/app-store-upload.md). Prepared locally; macOS conversion/signing and Safari acceptance remain pending.
