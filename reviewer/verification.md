# Mozilla reviewer source handoff

Source ZIP: dist/source/elec-training-qualification-checker-firefox-v1.0.0-source.zip

Source ZIP SHA256: 24dc1551f81d046b832e3b2b88339eb3cb4651cd0f1877a481051d3e993d9024

Reference: dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0.zip

Clean extraction: C:\Users\Sandeep\AppData\Local\Temp\elec-mozilla-clean-VDfqSW

Tested Node 22.19.0 / npm 10.9.3 on Windows x64. Ran the archive's documented npm ci --ignore-scripts --no-audit --no-fund, npm run build, npm run validate, npm run package, npm run compare and explicit path-to-reference comparison. Every command exited 0. Exactly one dependency was installed. The reproduced Firefox ZIP is 187546 bytes and matches the reference byte-for-byte: 1b5c0f56645f325e45519b3c99168bf40dddd1a683a6a1b9d322ffef7ba63bcd. No timestamp or metadata differences.

The currently named reference matches the previously recorded 1.0.0 candidate hash; this source handoff does not upgrade release acceptance or submit it. No runtime/content/manifest/asset changes were made. Original source inputs in the source ZIP match repository bytes; source packaging uses an explicit 21-file allowlist. No private communications, credentials/environment files, screenshots, Chromium files, node_modules, Git files or other ZIPs are included.

## Included files

- LICENSES/fflate.txt
- REVIEWER-BUILD.md
- RIGHTS.md
- manifests/firefox.json
- package-lock.json
- package.json
- reproduction.json
- scripts/firefox-reproduce.mjs
- scripts/lib.mjs
- scripts/production-content.mjs
- src/assets/icons/icon-128.png
- src/assets/icons/icon-16.png
- src/assets/icons/icon-32.png
- src/assets/icons/icon-48.png
- src/assets/icons/icon-64.png
- src/assets/icons/icon-96.png
- src/assets/logo.png
- src/data/qualification-routes.js
- src/popup/popup.css
- src/popup/popup.html
- src/popup/popup.js

REVIEWER-BUILD.md explains the Firefox-only adapter, unchanged original serializer/validators, minimal package.json/lockfile, environment requirements and comparison commands. RIGHTS.md records that no first-party license/copyright notice was supplied, without inventing a copyright holder or granting a new license. The build-only fflate MIT notice is included.

The local generator is reviewer/create-source.mjs (stage then pack); the production adapter template is reviewer/firefox-reproduce.mjs. Neither changes the project's normal release gates. Machine-readable evidence is in test-results/mozilla-source-reproduction.json.
