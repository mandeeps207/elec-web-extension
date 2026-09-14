# Future submission checklist

**No publishing, account creation, payment, commit or push is authorized by this task.** This checklist is a later handoff, not an instruction to submit now. Preferred order: Firefox, Edge, Chrome, Opera; Safari later.

## Company and content

- [x] Attributed approval recorded for the five existing results, including bounded referral wording.
- [ ] Confirm current qualification identifiers, prerequisites and UK geographical coverage.
- [x] Supplied transparent logo and six PNG icons are present; boss approval was reported by the user. Exact asset hashes/provenance are recorded.
- [x] User confirmed homepage/support https://elec.training/, privacy https://elec.training/privacy-policy/ and enquiry@elec.training.
- [x] Charanjit Mannu approved the existing privacy URL for initial Firefox/Chrome submissions; adding extension-specific wording is a future improvement.
- [x] Permanent Firefox release ID confirmed: qualification-checker@elec.training. Do not submit the development ID.
- [ ] Approve all four store descriptions and final screenshots showing approved content.
- [x] Firefox name recorded with approved extension metadata; full product name retained for Chromium.

## Validation and evidence

- [ ] Run syntax, unit/package tests, source/generated validation, Mozilla lint and installed browser tests.
- [ ] Review npm audit; test tools are excluded from runtime packages.
- [ ] Manually test actual toolbar popups in Firefox, Chrome, Edge and Opera, including screen-reader use and 200% zoom.
- [ ] Review package file allowlists, zero permissions, local-only resources and accurate no-data disclosure.
- [ ] Update `release-status.json` only from real evidence; record sign-off references and exact content/source hashes (`node scripts/validate.mjs --hashes`). Hash approved PNGs using `Get-FileHash -Algorithm SHA256`; store lowercase hashes.
- [ ] Run `npm run validate:release`, then `npm run package`. Both must succeed. Development ZIPs must never be uploaded.
- [ ] Independently open each final archive: `manifest.json` at root; no docs, tools, tests, dependencies, draft wording or placeholder assets.

## Platform handoff

Store requirements change: check the current official submission forms before preparing artwork or answering account questions. Do not guess company details or rely on old fee amounts from the brief.

| Platform | Later prerequisites and review |
| --- | --- |
| Mozilla | Mandeep Singh's authorized Mozilla developer account, permanent ID, correct `required: ["none"]` data declaration; review lint; proposed slug `electrician-qualification-route-uk` (availability unverified) |
| Edge | Company-controlled Partner Center publisher account and any required company verification; Chromium package; review Edge-specific listing/data fields |
| Chrome | Mandeep Singh's authorized Chrome developer account, any registration/security requirements, verify official website ownership if requested; Chromium package; accurate privacy answers |
| Opera | Company-controlled Opera Add-ons publisher account; Chromium package; check compatibility and current artwork/form requirements |
| Safari | Separate later scope: Apple tooling, packaging, membership/account confirmation and specific approval; no Safari work started |

## Final Charanjit sign-off gate

Provide the working-extension screenshots, final name, proposed Mozilla slug, full Firefox listing text, exact website URL `https://elec.training/`, source and final ZIPs to Charanjit through an authorized channel. **Wait for explicit sign-off before the first public submission.** This task has not sent any messages or files to Charanjit or other people.

## 1.0.0 handoff state

Client authorization is recorded internally: Charanjit Mannu, 2026-09-14, written client chat; Mandeep Singh may use his Firefox and Chrome developer accounts for the approved Elec Training extension/branding. Company-owned Firefox/Chrome accounts are not required by this handoff. Credentials and account/submission setup remain separate prerequisites, never ZIP blockers. No credentials were requested or stored.

Permanent Firefox release ID: qualification-checker@elec.training. Version: 1.0.0. Current source/content/asset hashes are in release-status.json. Manual technical acceptance and final visual evidence remain pending; company privacy URL approval is recorded. Account setup and store artwork/listing reviews are listed separately by submissionErrors().

Firefox submission: access to Mandeep Singh's authorized account, current listing/artwork/privacy fields, final manual acceptance and the gated Firefox ZIP; complete Mozilla review/signing through the store workflow when separately instructed.

Chrome submission: access to Mandeep Singh's authorized developer account, required account/security/registration steps, current listing/artwork/privacy answers, final manual acceptance and the gated Chromium ZIP. Confirm current store forms at submission time. No login, account creation, fee payment or submission was performed.

## Candidate handoff clarification

The user explicitly permits production candidate construction while manual/visual acceptance is pending; company privacy URL approval is recorded. Use npm run package:candidate; only technically validated candidates may be handed off, clearly labelled not final/store-ready. Keep all unperformed checks pending. The final npm run package command remains blocked until acceptance evidence is complete. Firefox/Chrome account access and store collateral remain submission prerequisites.

## Privacy approval update - 2026-09-14

Charanjit Mannu explicitly approved the existing https://elec.training/privacy-policy/ URL for initial Firefox and Chrome submissions through written client chat, as transcribed by the user. The company approval requirement is now satisfied. The page still lacks extension-specific wording; a dedicated extension section is recommended for the future and is not a package blocker. This supersedes earlier pending-privacy statements in this document. No website edit or manual testing is implied. All unperformed browser, zoom, display-scaling, screen-reader and final visual checks remain pending. Private evidence stays outside the packages.
