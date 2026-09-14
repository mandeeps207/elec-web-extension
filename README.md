# UK Electrician Qualification Checker – Elec Training

Local, permission-free browser extension, version **0.1.0**. Choose one of five starting points and read draft guidance inside a toolbar popup. Two clean links open the Elec Training homepage and full guide in new tabs.

**Status: development only. Qualification content is unapproved, two routes are unresolved, and final branding is missing. Public release and release ZIP creation are blocked.** Nothing has been committed, pushed or submitted by this implementation.

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
| `npm run build:release` | Build release directories only after gates pass |
| `npm run package` | Enforce gates and checks, then create release ZIPs |

Firefox must be installed for browser tests. Selenium Manager may download its driver; development tools and downloads require internet, but the extension does not. Automated test screenshots/logs go to `test-results/`, outside every package.

Development archives: `dist/development/elec-training-qualification-checker-{firefox,chromium}-v0.1.0-development.zip`.
Future release archives: `dist/elec-training-qualification-checker-{firefox,chromium}-v0.1.0.zip`. **These are intentionally not produced yet.** ZIP entries start with `manifest.json` at the root.

## Content, privacy and approvals

Read [CONTENT_APPROVAL.md](CONTENT_APPROVAL.md) for Charanjit's review, [content sources](docs/content-sources.md) for provenance and uncertainty, and [branding requirements](src/assets/README.md) for the design handoff.

The shipped runtime is plain HTML/CSS/JavaScript and local data. It requests no permissions, stores no selection and contains no analytics, network request APIs, remote resources, content scripts or background scripts. External links take the user to the website, which has its own data practices. See [privacy disclosure](privacy/privacy-disclosure.md) and [verification report](docs/verification.md).

Development dependencies support tests and packaging only; they never enter extension builds. `package-lock.json` pins them. No production dependencies are required.

Read [architecture](docs/architecture.md), [implementation plan](docs/implementation-plan.md), [submission checklist](docs/submission-checklist.md) and separate [Firefox](store-listings/firefox.md), [Edge](store-listings/edge.md), [Chrome](store-listings/chrome.md) and [Opera](store-listings/opera.md) listing drafts. Safari is deferred to a separately approved phase.
