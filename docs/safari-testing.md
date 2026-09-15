# Safari cloud packaging and Mac acceptance

Current authoritative Apple record: Team/App ID Prefix `3XPCC2X77K`; registered containing Bundle ID `training.elec.qualification.checker`; proposed extension ID `training.elec.qualification.checker.extension` (not registered); SKU `ELEC-QUAL-CHECKER-MAC-002`; Apple ID `6812432163`; App Store Connect platform **macOS only**. The previous app record was deleted. The diagnostic corrects target-specific identifiers before validation; no extension registration or signing is authorized. This record supersedes earlier proposed-record wording below.

Update: the team reports no Xcode Cloud Safari packager access. Use [the GitHub macOS diagnostic-first route](safari-github-actions.md). The cloud instructions below are historical alternatives, not the current next action. The current App Store name is UK Electrician Route Checker; actual converter identifiers and signed builds remain pending.

Package prepared; Safari/TestFlight testing and App Store submission pending. This is a future manual handoff; no steps below were performed by the agent. Local Windows work produces only the ZIP input, not a signed Mac application.

## Before creating anything

Client decisions: approve a <=30-character App Store name (suggestion UK Electrician Route Checker; requested 36-character name cannot fit), Apple publisher team/account, proposed Bundle ID training.elec.qualification.checker, SKU ELEC-QUAL-CHECKER-MAC-002, copyright holder, Safari listing/privacy answers and Apple distribution authority. Elec Training is the intended display brand; actual seller/developer name comes from the account and cannot be freely assumed. Check existing app records/identifiers first. Do not silently replace them.

Apple access: enrolled Apple Developer Program membership and appropriate App Store Connect access. Creating an app normally requires Account Holder/Admin/App Manager; Apple also documents delegated Developer/Marketing creation access. The account holder must resolve agreements/access if the packager is unavailable. Do not share credentials in project files.

## Manual workflow (Windows browser unless marked Mac)

1. Open App Store Connect > Apps. First inspect for an existing matching app. Once identifiers/name are confirmed, use + > New App. Select **macOS only**, primary language English (UK), confirmed name, Bundle ID and SKU. Do not select iOS; that would add iPhone/iPad/other compatible platforms. Choose appropriate user access and Create. Requires Apple role access and client decisions; not done here.
2. In the app record, open **Xcode Cloud**. Find **Safari Web Extension Packager** and click **Upload**. Apple documents this browser-based route, so local Xcode is unnecessary. If that section is missing, ask the account holder to verify enrollment/role/agreements rather than inventing an alternative UI path.
3. Select dist/safari/elec-training-qualification-checker-safari-v1.0.0-packager-input.zip. It contains a root manifest and 11 related resources. Verify the recorded SHA256 before upload. This ZIP is not a Firefox/Chrome store ZIP or an already signed Mac app.
4. Monitor the **Builds** page. Save build number, platform, packager errors/warnings and generated minimum OS version. Confirm only macOS exists. Inspect generated app branding and permissions. Cloud packaging uses the membership's Xcode Cloud allocation; no cloud job was started here. Resolve warnings before testing; do not assume packaging succeeded.
5. After processing succeeds, open **TestFlight**, select the Mac build, complete required test/compliance details truthfully and add it to an internal testing group. See Apple's TestFlight instructions below; processing/compliance issues may need account-holder action.
6. Invite an internal Mac tester who is an App Store Connect user with access to this app. Account Holder/Admin/App Manager/Developer/Marketing roles can manage internal testers as documented. Do not grant unnecessary account access merely to test; external testers are a different workflow and can require beta review. No invitation was sent here.
7. **Real Mac required:** install TestFlight from the Mac App Store, accept the invitation and install the exact build. Launch the containing app once, then open Safari > Settings > Extensions and enable the extension. Record macOS, Safari and build versions. Use Apple's generated app instructions if its enabling flow differs.
8. **Safari required:** show the extension's toolbar button (customize toolbar if needed), then click it. Inspect the actual toolbar popover, not popup.html in a normal tab. Confirm initial five choices fit at normal scale, readable text, no horizontal overflow and visible focus.
9. Select each route: verify unchanged steps/caveats, vertical scrolling for long results, reachable reset and resource footer, and reset focus returning to the chosen control. Short referrals may fit without scrolling. Test Tab/Shift+Tab, Enter/Space and VoiceOver announcements; confirm content is not clipped at increased text/display scale. Record actual settings, not assumed tab zoom.
10. Open Visit Elec Training and Read the Full Electrician Qualification Guide. Confirm the clean homepage and /news/how-to-become-an-electrician/ destinations open separately and popup behavior remains usable. No login/purchase is needed. Repeat route use offline; website destinations themselves require internet. Close/reopen and check the starting screen returns.
11. Capture actual approved **Mac/Safari** screenshots: initial choices, typical route with caveats, bounded referral. Show long result portions honestly; no Windows images represented as Safari. Use 1-10 opaque PNG/JPEG screenshots, 16:10 at 1280x800, 1440x900, 2560x1600 or 2880x1800, per Apple specifications. Client approves final screenshots and generated app artwork.
12. Report errors with packager build ID/time, full warning/error text, macOS/Safari version, route, steps to reproduce, actual/expected behavior and screenshot. For runtime issues inspect Safari's extension console using its developer tools, removing unrelated private information. Do not mark failures passed or change runtime without rebuilding/retesting the affected candidate.
13. Only after packager success, TestFlight and real Safari acceptance, layout/links approval, screenshots/privacy confirmation, Charanjit listing approval and explicit submission authority: select the approved macOS build for App Review, complete metadata/review fields and submit manually. No publishing/submission is authorized for this agent.

Record each acceptance result in release-status.json only after real evidence. Existing Firefox/Chrome/Edge/Opera submissions do not establish Safari approval. Prior privacy URL authorization named Firefox/Chrome; confirm its use and generated-app privacy answers for Safari separately.

## References

- [Cloud packager workflow](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)
- [Internal testers and role access](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers)
- [Run/enable a Safari extension](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)
- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

**Exact next manual step:** have the authorized Apple account owner inspect App Store Connect > Apps for an existing record, then confirm the shorter name, team, Bundle ID and SKU before creating a macOS-only record. Nothing should be uploaded before those decisions.
