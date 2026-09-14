# Future submission checklist

**No publishing, account creation, payment, commit or push is authorized by this task.** This checklist is a later handoff, not an instruction to submit now. Preferred order: Firefox, Edge, Chrome, Opera; Safari later.

## Company and content

- [ ] Charanjit reviews and approves exact wording for all five starting points; resolve or explicitly approve bounded referral wording.
- [ ] Confirm current qualification identifiers, prerequisites and UK geographical coverage.
- [ ] Obtain official logo and icon PNGs; record provenance and approved hashes.
- [ ] Confirm company-owned support and privacy URLs. Verify the policy covers the extension's actual behaviour.
- [ ] Confirm permanent Firefox extension ID. Do not submit the `example.invalid` development ID.
- [ ] Approve all four store descriptions and final screenshots showing approved content.
- [ ] Approve the shortened Firefox name required by its 45-character limit; the full product name is retained for Chromium.

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
| Mozilla | Company-controlled Mozilla account, permanent ID, correct `required: ["none"]` data declaration; review lint; proposed slug `electrician-qualification-route-uk` (availability unverified) |
| Edge | Company-controlled Partner Center publisher account and any required company verification; Chromium package; review Edge-specific listing/data fields |
| Chrome | Company-controlled developer account, any registration/security requirements, verify official website ownership if requested; Chromium package; accurate privacy answers |
| Opera | Company-controlled Opera Add-ons publisher account; Chromium package; check compatibility and current artwork/form requirements |
| Safari | Separate later scope: Apple tooling, packaging, membership/account confirmation and specific approval; no Safari work started |

## Final Charanjit sign-off gate

Provide the working-extension screenshots, final name, proposed Mozilla slug, full Firefox listing text, exact website URL `https://elec.training/`, source and final ZIPs to Charanjit through an authorized channel. **Wait for explicit sign-off before the first public submission.** This task has not sent any messages or files to Charanjit or other people.
