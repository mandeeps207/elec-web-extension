# Official branding required

No official graphics were supplied. On 2026-09-14 the homepage HTML referenced these official logo assets, but both downloads returned HTTP 403:

- https://elec.training/wp-content/uploads/2023/09/Elec-Training-Logo-scaled.jpg
- https://elec.training/wp-content/uploads/2023/09/Elec-Training-Logo-scaled-e1772290125555.jpg

No downloaded logo is used and no company logo has been redrawn. Development builds generate plain grey DEV icons and show a text branding placeholder. The current navy/orange interface palette is provisional, not a claimed official brand palette.

Request from the design team:

- Approved official logo as transparent PNG (and original SVG for retention by the team). Save the approved runtime PNG here as `logo.png`; it displays at 170 CSS pixels wide, so supply at least 340 pixels wide with suitable padding.
- Approved square extension icon PNGs at 16, 32, 48, 64, 96 and 128 pixels, named `icons/icon-16.png`, etc. Small sizes must remain legible. Supply a 512px master for later store artwork.
- Confirmed brand colours, approved initial/result screenshots, and platform-specific promotional artwork after checking each submission form.

Record provenance and the SHA256 of each approved PNG in `release-status.json`. A renamed DEV bitmap is explicitly rejected. Human approval of brand authenticity is still required; a file hash cannot establish ownership. Runtime packages include only allowlisted PNGs, never this document.
