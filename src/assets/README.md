# Supplied extension branding

The user supplied the Elec Training logo and six icon PNGs locally on 2026-09-14 for use in the development extension. The logo and 128px icon were visually inspected; PNG signatures and all dimensions were checked.

- `logo.png`: 837 by 252 pixels, displayed at 170 CSS pixels wide with its original aspect ratio.
- `icons/icon-{16,32,48,64,96,128}.png`: square PNGs at the corresponding sizes.

Both development builds copy these exact files. No graphic was redrawn, resized or replaced. The build validator verifies packaged bytes against source assets. Missing files fail the build instead of silently reverting to placeholders. This README is excluded from packages.

The user subsequently replaced all seven PNGs with transparent-background versions. Dimensions are unchanged; each file decodes successfully as RGBA and has a fully transparent corner pixel (alpha 0). Both development directories and ZIPs were rebuilt from the replacements, with package/source byte comparisons and Mozilla lint validation.

The development extension retains its [DEV] name and Development preview badge. The user reports boss approval of these supplied transparent files; their exact hashes and provenance are recorded in release-status.json. Final compact-layout screenshots and attributed release sign-off remain pending.

Historical context: initial downloads of website logo JPGs returned HTTP 403. Earlier builds used text branding and generated DEV icons; those placeholders are no longer used in builds.
