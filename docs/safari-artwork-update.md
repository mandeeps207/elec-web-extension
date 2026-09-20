# Client-selected full-logo macOS artwork

The user explicitly confirmed the client's choice of the full wordmark in
`src/assets/icons/icon-1254.png`, accepting reduced readability at small sizes.
This supersedes the request for a symbol-only replacement. The supplied PNG is
1254 by 1254, opaque RGB. Its original export history is not independently known.

The diagnostic replaces the converter's app-icon catalog before fingerprinting
and building. Each of the ten macOS slots is generated directly from this master
using deterministic area averaging and the locked fflate encoder. No cropping,
sharpening, recoloring, background removal, added padding or enlargement occurs.
The source hash is pinned; every resulting slot must match the reviewed baseline.
The opaque background is intentional, so the old transparent-padding assertion
has been replaced with an opaque full-canvas check. The existing native window
Resources/Icon.png and browser extension icons are unchanged.

Automated checks establish dimensions and reproducibility, not subjective visual
approval. Local output previews are under test-results/apple-artwork-review.
The earlier documentation's lack-of-large-source statement describes the previous
artifact only. Historical diagnostic runs and their fingerprints remain valid
historical evidence, but cannot approve this changed native artwork.

The signing gate remains closed and Apple upload remains hard-disabled. After
review and authorized commit/push, start a NEW Safari unsigned diagnostic run on
master (no inputs), inspect artwork/build evidence, and compare fresh-run
fingerprints. Then complete the pre-signing review before authorizing the first
signed artifact-only run with upload_to_app_store=false. Actual Mac/Safari testing,
store metadata/screenshots/privacy declarations and separately authorized Apple
upload/submission remain necessary. No workflow is automatically dispatched.
