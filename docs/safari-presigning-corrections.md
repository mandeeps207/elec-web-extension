# Safari pre-signing corrections — 19 September 2026

Approval remains false. No workflow has been dispatched. The pre-existing release-status.json modification is excluded from this change. The optional upload step is hard-disabled (`false && inputs.upload_to_app_store == true`), and its input still defaults to false. Re-enabling Apple upload requires a separately reviewed change.

## Sandbox

Apple's generated template enabled outgoing network connections and user-selected-file read access. An unsigned build succeeding did not validate final signing entitlements. The post-conversion correction identifies exactly one application and one app-extension by product type, requires Debug and Release, and corrects every configuration and any conditional overrides:

- ENABLE_APP_SANDBOX = YES
- ENABLE_OUTGOING_NETWORK_CONNECTIONS = NO
- ENABLE_USER_SELECTED_FILES = NO

Only the three prohibited network/file entitlement keys are removed from any existing generated entitlement plist. Unknown entitlements still fail the existing allowlist. Each target receives an explicit ReviewedSandbox.entitlements containing only the sandbox Boolean. Both resolved configurations are checked. Available unsigned-build xcent files are inspected; their absence with code signing disabled is reported, not represented as signed validation. The existing strict signed-entitlement allowlist checks both products in the archive and expanded exported installer. Signed verification remains pending.

## Stable, complete fingerprint

The old fingerprint filtered by extensions and omitted the PBX project, storyboard and asset catalog metadata. The new fingerprint covers every file in the generated source tree before DerivedData is created, including unexpected files. Symlinks and Apple metadata files fail closed.

Only the date token in Apple's exact leading seven-line Swift comment header is replaced by `<GENERATED-DATE>`: `//`, `//  <filename>.swift`, `//  <project>`, `//`, `//  Created by <author> on M/D/YY.`, `//`. The pattern is anchored at byte zero. Author, filename, project, punctuation, line endings and every subsequent source byte remain significant. Comments inside executable code, multiline string literals or block comments are never normalized.

The PBX project is parsed and its complete reachable graph is hashed. Random object IDs are renamed by deterministic traversal; reference relationships, array order, object types, property values and all settings remain significant. Unreachable objects fail closed. Only CURRENT_PROJECT_VERSION is represented by `<CI-BUILD-NUMBER>` because each authorized run must have a fresh build number; the actual value remains validated and reported in resolved settings/products. Resolved configuration evidence likewise omits only that run counter from the fingerprint. No other build setting, entitlement, identifier or plist is ignored. Project changes, functional Swift changes, new files, catalog changes and PNG pixels alter evidence.

Fresh unsigned evidence is required. The prior fingerprint must not be approved for this implementation. Regression tests establish the normalization boundaries; no claim of cross-run macOS determinism is made until fresh runs are compared.

## Artwork audit

The tracked approved square sources are 16, 32, 48, 64, 96 and **128 pixels**. The approved horizontal logo is **837×252 RGBA**. There is no vector or >=1024px square master in the repository's approved assets. The manifest's largest supplied icon is 128×128; the converter copies that exact file to the containing app's Resources/Icon.png and generates its macOS catalog from the manifest artwork. The 1024×1024 result is an upscale, not a new official high-resolution source.

No artwork is regenerated, sharpened, redrawn or replaced here. Supply an official square **at least 1024×1024** PNG master (preferably larger), or official SVG/PDF vector artwork, with intended clear space and background treatment. A horizontal logo is not a square icon substitute. Final macOS artwork acceptance remains pending.

All ten required macOS slots (16/32/128/256/512 points at 1x and 2x) are audited for actual decoded dimensions, square aspect ratio, visible/transparent pixels, edge coverage and SHA256. ci/safari-icon-baseline.json records the existing converter output from run 35003030362 solely for regression detection. At 16/32 pixels, converter antialiasing reaches edges; the 64px and larger images have zero visible edge pixels. This is retained as measured evidence, not silently called uncropped/approved. The baseline detects changed pixels, padding, transparency or cropping; malformed/missing slots fail. Identical source/tool output must reproduce the recorded hashes. Automated geometry/hash checks do not confer subjective visual approval.

## Next run

Use **Safari unsigned diagnostic**, branch **master**, with no inputs. Start a new run rather than rerunning an old commit. Inspect corrected-structure.json, unsigned-entitlements.json, artwork-audit.json and diagnostic.json. It needs no signing secrets. The separate-P12 secret changes prepared earlier are included in the supporting signed workflow but signing approval remains closed, and Apple upload is hard-disabled.
