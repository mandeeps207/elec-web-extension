# Safari macOS CI: design and handoff

Current authoritative Apple record: Team/App ID Prefix `3XPCC2X77K`; registered containing Bundle ID `training.elec.qualification.checker`; proposed extension ID `training.elec.qualification.checker.extension` (not registered); SKU `ELEC-QUAL-CHECKER-MAC-002`; Apple ID `6812432163`; App Store Connect platform **macOS only**. The previous app record was deleted. The diagnostic corrects target-specific identifiers before validation; no extension registration or signing is authorized. This record supersedes earlier proposed-record wording below.

Status: workflows prepared locally; Phase 1 has not run. Signed archive, export, Apple upload, TestFlight and Safari testing are pending. No credential, identifier or profile has been created. The team reports that the Xcode Cloud web packager is unavailable; the GitHub route supersedes that handoff, without bypassing Apple distribution requirements.

## Design review (15 September 2026)

Inspected the repository source/manifests/assets, build and ZIP scripts, validation/security gates, unit/browser tests, package/lock files, release status and all four Safari audit/testing/listing/verification documents. Submitted Firefox/Chromium, Opera and Safari input archives were hashed before changes. Existing browser targets and approved runtime are untouched.

Apple currently calls its conversion utility a packager and documents its previous converter name. This implementation deliberately invokes the requested `xcrun safari-web-extension-converter --help` on the runner first. It verifies every flag before conversion; it does not silently switch tools, Xcode versions or extension suffixes. Windows cannot execute this command. The supported-argument and generated-project findings therefore remain **unobserved until Phase 1 runs**.

GitHub's macos-15 inventory reviewed for this work: image 20260824.0482.1, macOS 15.7.9, Xcode **26.3 (17C529)** at `/Applications/Xcode_26.3.app`. The workflow sets DEVELOPER_DIR explicitly and verifies the exact version/build. The macos-15 default is a different Xcode. Runner images are mutable; removal of the pinned version fails rather than falling back. Installed Node 22.23.2 supports the existing >=22.19 engine. npm uses the lockfile with lifecycle scripts disabled; no new dependencies were added. Actions are pinned to verified commit SHAs.

One credential requirement beyond app code signing: exporting an App Store installer also needs a **Mac Installer Distribution** identity. The documented P12 contains both that identity and Apple Distribution, each with its private key. Developer ID/development identities are rejected. Do not obtain profiles until the corrected resolved extension ID is confirmed.

## Two manual workflows

1. `.github/workflows/safari-diagnostic.yml`: workflow_dispatch only, read-only repository token, no Apple secrets. Reconstruct the exact approved Safari ZIP from readable source (dist is ignored in Git), verify SHA256 before extraction, validate its 12-file runtime, inspect converter help, convert macOS-only with no UI, inspect targets/schemes/settings, patch native plist encryption/version values, check resource equality and sandbox entitlements, then attempt an unsigned Release build.
2. `.github/workflows/safari-app-store.yml`: workflow_dispatch only; protected `apple-production` environment, sequential runs, Release configuration, upload default **false**. First require a reviewed Phase 1 fingerprint. Reconvert and compare native source/structure before accessing signing secrets. Import manual signing identities/profiles temporarily, archive, validate, export a signed `.pkg`, inspect exported payload, and upload only if the explicit input is true. No App Review submission command exists.

`scripts/apple-input.mjs` creates only `build/generated/safari-input.zip` and its extraction. It does not need submitted ZIPs in a fresh checkout and cannot produce different runtime bytes: the full hash is fixed at `4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88`.

## Run Phase 1 first

The workflow files must first be reviewed, committed and pushed to the repository's default branch **with separate authorization**. That has not been done. Never include internal communications, signing files or ignored generated folders in that commit. After the files are available on GitHub:

1. Open repository > Actions > **Safari unsigned diagnostic** > Run workflow. Select the reviewed branch and run. No Apple secrets or App IDs are needed.
2. Open the run. Download `safari-diagnostic-<run-id>-<attempt>` within seven days. Read converter-help.txt, generated-structure.json, diagnostic.json and operations.json. Extract generated-project.tar.gz to inspect Apple's source, target settings, plists, entitlements and app artwork. Failed conversion/structure checks may produce only partial artifacts.
3. Verify the actual containing ID is `training.elec.qualification.checker` and actual extension ID is `training.elec.qualification.checker.extension`. These are expected values, **not observed converter results**. Converter defaults are preserved as evidence, then explicitly corrected by product type in every target configuration. Validate the corrected Debug and Release settings. Do not create a third/unnecessary identifier or bypass the comparison.
4. Confirm the exact scheme, target names, macOS-only platforms, plist/entitlement paths, generated native behavior, wrapper artwork, resource equality, no unexpected capabilities, encryption false and unsignedBuild PASS. The generated source remains an artifact, not a committed Xcode project. No project is retained because reproducible generation plus fingerprint review is preferable here; converter drift is a blocking signal.
5. After a genuine review, update `ci/safari-diagnostic-approval.json`: approved true, actual successful GitHub run URL, reviewer's name and exact diagnostic fingerprint. Review and authorize committing that evidence. No fabricated values are supplied now. The signed workflow checks the same fingerprint on a new conversion; changed code/tool/topology blocks it.
6. Only then follow [signing setup](apple-signing-setup.md). Set a unique build number greater than previously uploaded builds, or use the workflow's `<run_number>.<run_attempt>` default. A rerun increments the attempt. The script enforces Apple's numeric component limits; it cannot inspect existing Apple build numbers without account access. Overrides must be checked manually against App Store Connect.

## Artifacts and limitations

Diagnostic artifacts contain generated source, exact target IDs/plist paths and non-secret reports. Signed success artifacts contain the validated `.pkg`, SHA256, bundle/signature metadata, encryption verification, archive-validation report and sanitized operation log (operation/exit code only). Raw signing logs are withheld because tools can print profile/certificate material. Failed signing does not publish build artifacts.

The `.xcarchive` remains on the ephemeral runner, not an artifact: a raw signed archive includes embedded provisioning profiles. Its validation result is provided instead. The exported `.pkg` necessarily contains Apple's embedded distribution profiles as part of the signed app; these are public signing metadata, not private keys. No loose profiles, P12, keychain or P8 files enter artifacts. Removing embedded profiles from the upload package would alter the product and is not done. Retention is three days for signed runs. Generated project artifacts come from the unsigned phase before credentials are loaded.

Actual converter help, target names, scheme, plist paths, unsigned/signed builds, export method/tool availability and Safari execution have **not** been verified on Windows. The scripts check them on macOS and stop on drift. This is prepared CI, not a claim of a working signed release. Mac/TestFlight acceptance from [Safari testing](safari-testing.md) remains required.

## Official references consulted

- [Apple Safari conversion and documented flags](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)
- [Safari compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility)
- [Creating distribution-signed macOS code: archive and exportArchive](https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac)
- [App Store installer signing](https://developer.apple.com/documentation/xcode/packaging-mac-software-for-distribution)
- [Certificates overview](https://developer.apple.com/help/account/certificates/certificates-overview)
- [Mac App Store Connect profiles](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile)
- [App Store Connect API keys](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api)
- [Apple build validation/upload tooling](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds)
- [Encryption declaration](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption)
- [Export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)
- [GitHub macos-15 image inventory](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md)
- [GitHub temporary signing keychains](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications)

Local commands: `node scripts/apple-input.mjs`, `npm run check:syntax`, `npm test`, `npm run validate`, `npm run validate:safari`, `npm run lint`, `npm run test:browser`. On macOS only: `node scripts/apple-ci.mjs diagnostic`. The signed and upload modes are intended for the protected workflow, not a workstation holding personal keychains.

## Local verification results

Windows checks on 15 September 2026: syntax passed for 16 JS files; all 23 tests passed (including parsed workflow trigger/default/secret/artifact tests, negative profile/entitlement/approval/build-number cases and exact input reproduction). General and Safari validation passed. Lint reported 0 errors, warnings and notices. Chromium regular extension-tab/native popup and Firefox regular-tab/native popup checks passed; these are not Safari evidence.

Negative safety checks behaved as intended: approval mode refused signing because Phase 1 is not reviewed; diagnostic mode refused on Windows before invoking Apple tools. Actual converter help, Xcode targets/scheme/plists, unsigned build, signing, archive, export and upload remain untested on macOS. No final .pkg is available yet.

All existing archives retained their before/after SHA256 values:

- dist/release-candidate/elec-training-qualification-checker-chromium-v1.0.0.zip
  ec0dcf5be6fae4d98f2a74bd249b40e7d94854c5d2c6e99a89492f923612741b
- dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0.zip
  1b5c0f56645f325e45519b3c99168bf40dddd1a683a6a1b9d322ffef7ba63bcd
- dist/opera/elec-training-qualification-checker-opera-v1.0.0.zip
  4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88
- dist/safari/elec-training-qualification-checker-safari-v1.0.0-packager-input.zip
  4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88

Machine evidence: test-results/apple-ci-verification.json, apple-ci-unit.log and browser-results.json. Existing runtime, manifests and browser ZIP outputs were not changed by this CI work. New files: both workflows, ci/safari-diagnostic-approval.json, scripts/apple-ci.mjs, scripts/apple-input.mjs, tests/apple-ci.test.mjs, .gitattributes and the four Apple CI/setup/compliance/upload guides. Updated .gitignore, package.json, README.md, release-status.json and existing Safari handoff/listing documents. No commit, push, workflow dispatch or Apple account action was performed.

## Historical diagnostic run 34999298612

Conversion succeeded under Xcode 26.3. The subsequent build-settings JSON parsing failed because the command wrapper combined stdout with stderr. Structured commands now parse stdout only; malformed stdout and nonzero command exits still fail. 25 local tests passed after this correction.

The generated project artifact shows containing Bundle ID `training.elec.UK-Electrician-Route-Checker` and extension Bundle ID `training.elec.qualification-checker.Extension` (capital E). These differ from the requested values. The existing mismatch gate remains in place. Do not create another App ID or enable signing; review the target-specific identifier correction first. No actual identifiers, provisioning profiles or approved WebExtension files were changed.

Historical evidence only: the correction now assigns the new registered app ID and proposed extension ID by product type before checking resolved settings. The old record is deleted and must not be used.
