# Apple signing setup after Phase 1

Do not create the extension App ID or profiles yet. First complete the unsigned diagnostic and confirm its exact generated identifiers. Current expected IDs are `training.elec.qualification-checker` for the app and `training.elec.qualification-checker.extension` for the extension. A suffix conflict requires investigation before registration. Check existing identifiers first; never replace them silently.

An authorized Apple Developer Account Holder/Admin manages certificates and profiles. GitHub's macOS runner supplies Xcode; signing still requires a paid Apple Developer team with the appropriate account access. This implementation performs no automatic provisioning and uses no development signing.

## After the diagnostic has passed and been reviewed

1. In Certificates, Identifiers & Profiles, inspect Identifiers. Register or select the two **explicit** confirmed Bundle IDs. Enable only capabilities shown necessary in the reviewed generated project; unexpected groups/network/data-access entitlements currently fail the pipeline. Do not add capabilities merely to get a build through.
2. In Certificates, obtain/select an **Apple Distribution** certificate for application signing and **Mac Installer Distribution** for the installer package. The second is normally named `3rd Party Mac Developer Installer: ... (TEAMID)`. Developer ID Installer is a different distribution channel and is rejected here. Do not revoke existing certificates to solve a missing private key.
3. On the trusted Mac that holds those private keys, open Keychain Access > My Certificates. Confirm each certificate expands to show its private key. Select both identities and export as a password-protected `.p12`. If the account administrator supplies separate exports, ask them for a single protected export containing both; the workflow intentionally uses one P12 secret and one password. A `.cer` alone does not contain the signing key. Windows Base64 encoding cannot create a missing private key.
4. Under Profiles > + > Distribution choose **Mac App Store Connect**, select the confirmed containing App ID and the Apple Distribution certificate, generate and download. Repeat for the confirmed extension App ID using the same certificate. These are `.provisionprofile` files, not development/device profiles. They must be unexpired and match the team's exact IDs and certificate.
5. Note the team's ten-character Team ID from the developer membership page. No real Team ID belongs in source or documentation.

## GitHub environment and secrets

Repository Settings > Environments > create `apple-production`. Require a trusted reviewer, prevent self-review if available, and limit deployments to the reviewed protected branch. Check your GitHub plan supports these protections. The environment name alone does not configure approvals. Repository write access and workflow-file review are security-sensitive; a modified workflow can use environment secrets. Do not dispatch unreviewed branches. Only GitHub-hosted ephemeral macOS runners are supported here.

Add these as **environment secrets** (not variables):

| Secret | Value |
| --- | --- |
| APPLE_TEAM_ID | Apple Developer Team ID |
| APPLE_CERTIFICATE_P12_BASE64 | Base64 P12 containing Apple Distribution **and Mac Installer Distribution**, with both private keys |
| APPLE_CERTIFICATE_PASSWORD | Password protecting that P12 |
| APPLE_APP_PROFILE_BASE64 | Base64 containing-app Mac App Store Connect profile |
| APPLE_EXTENSION_PROFILE_BASE64 | Base64 confirmed extension Mac App Store Connect profile |
| APPSTORE_API_PRIVATE_KEY_BASE64 | Base64 downloaded P8 team API key; needed only for upload |
| APPSTORE_API_KEY_ID | API key ID; needed only for upload |
| APPSTORE_API_ISSUER_ID | Team API issuer ID; needed only for upload |

For safe Windows encoding, replace the path locally, run in PowerShell, paste the clipboard into the corresponding GitHub secret field, then clear the clipboard. Do not paste values into chat or terminal output:

```powershell
$appleFile = 'C:\secure-location\distribution-identities.p12'
[Convert]::ToBase64String([IO.File]::ReadAllBytes($appleFile)) | Set-Clipboard
# Paste into GitHub's secret field, save it, then:
Set-Clipboard -Value ''
```

Repeat for each profile and the P8. Use a secure folder outside the repository and an approved password manager for passwords/keys. Base64 is encoding, not encryption. Do not save encoded output in Git or issue comments. Ignore rules block common credential extensions; tests also check tracked/unignored candidate files for credential paths/private-key content.

## CI signing behavior

Credentials appear only in the signed step, after reconversion/fingerprint checks. The script creates a random-password temporary keychain, imports both identities and validates their type/team. Decoded profiles stay in the runner temp folder; each is checked for exact ID/team, platform, expiry, distribution characteristics and matching certificate. Only validated profiles are installed in Xcode's profile directory, with a cleanup ledger; existing files are not overwritten.

Each target receives its own profile UUID, exact Bundle ID and manual signing settings. The archive and exported payload must pass signature, embedded-extension, version/build, resource, encryption and entitlement checks. No automatic profile registration, signing updates or fallback identities are allowed. A `finally` block and an Actions `always()` step remove temporary keychains/profiles/P12/P8 and restore the keychain search list. GitHub also destroys the runner VM after the job.

See [design and official sources](safari-github-actions.md) and [upload instructions](app-store-upload.md). These setup steps are documented, not performed.
