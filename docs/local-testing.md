# Local browser testing for beginners

Run `npm ci` and `npm run build` from the repository folder first. “Unpacked” means a folder of extension files instead of a store download. These development builds use the supplied official icons, a [DEV] name and a Development preview badge. Reported content approval still needs release evidence; do not distribute these builds publicly.

## Firefox desktop 142 or newer

1. Open Firefox and type `about:debugging#/runtime/this-firefox` in the address bar.
2. Click **Load Temporary Add-on**. Open this repository's `build/development/firefox` folder and select `manifest.json`.
3. Open Firefox's extensions/puzzle menu. Choose **[DEV] UK Electrician Qualification Checker**. Pin it to the toolbar if desired, then click its Elec Training icon to open the panel.
4. To inspect errors, return to `about:debugging`, find the extension and click **Inspect**. Choose **Console**. If inspecting the popup, open it and use the inspector's document selector; its toolbox option to disable popup auto-hide can help keep it open.
5. After editing source, run `npm run build`, click **Reload** next to the extension in `about:debugging`, then reopen the popup.
6. Click **Remove** in `about:debugging` to uninstall it. A temporary installation also disappears when Firefox restarts.

## Google Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked**, then select the repository's `build/development/chromium` folder itself.
3. Open the puzzle menu and pin the DEV checker. Click its icon to open the popup.
4. Right-click inside the open popup and select **Inspect**. Select **Console**. Also inspect the extension card's **Errors** button if one appears.
5. After changes, run `npm run build`, click the reload arrow on its extensions card, close the old popup and reopen it.
6. Click **Remove** on the card and confirm removal. Turn off Developer mode if you no longer need it.

## Microsoft Edge

1. Open `edge://extensions`. Enable **Developer mode** (the placement can vary by version).
2. Click **Load unpacked** and select `build/development/chromium`.
3. Use the extensions menu to show/pin the DEV checker in the toolbar, then click it.
4. Right-click the popup and choose **Inspect**; open **Console**. Check the extension card for errors as well.
5. Run `npm run build` after source edits; click **Reload** on the card and reopen the popup.
6. Click **Remove** on the extension card to uninstall it.

## Opera

1. Open `opera://extensions` (or press Ctrl+Shift+E), then enable **Developer mode**.
2. Click **Load unpacked** and select `build/development/chromium`.
3. Find the DEV checker in the extensions menu, pin/show it if needed, then open it from the toolbar.
4. Right-click inside the popup and choose **Inspect element** or **Inspect**, depending on the version; select **Console**.
5. After source edits, run `npm run build`, use **Reload** on the extension card and reopen the popup.
6. Use **Remove** on the card to uninstall it.

No developer account or store fee is needed for these local tests. Browser UI labels may vary. Load the correct generated directory, not `src`, `dist` or the whole repository.

## Manual acceptance checklist in each browser

After the toolbar-width correction, reload the existing installation and close/reopen its popup; a previously open popup may still use the old CSS. Firefox: click **Reload** at `about:debugging#/runtime/this-firefox` for the extension loaded from `build/development/firefox/manifest.json`. Chrome: click the reload arrow at `chrome://extensions` for `build/development/chromium`. If installing fresh, use those same paths. The local version is now 1.0.0. Reload even if the same folder is already installed.

Expect a 380px-wide document in a panel up to 500px tall, with vertical scrolling only when the displayed content needs it. Firefox may reserve some of that width for its vertical scrollbar. The updated automation opens and measures real default-zoom action popups in Firefox/Chromium, but manual zoom/display-scale testing remains mandatory. Zooming a regular web page may not change the extension panel; record the actual popup zoom/display scale tested rather than assuming it follows the tab.

- Open the actual toolbar panel. At normal Windows scaling and 100% popup zoom, all five 44px buttons must be visible without any scrolling. Select a result to reveal both resource links; scroll longer results to reach the footer.
- Use Tab/Shift+Tab only. Focus must be clearly visible. Enter and Space activate each starting-point button; the result heading receives focus, and reset returns focus to the original choice.
- Read all five results. Verify the starting position and steps, bounded referral wording, all caveats and the development-preview badge.
- With the computer offline, repeat all choices. No content should depend on connectivity.
- At 100%, 150% and 200% browser zoom, verify no horizontal scrolling, clipped controls or trapped content. Test the browser's actual popup; tab zoom automation is supplementary.
- With a screen reader (for example NVDA), verify heading announcement on result changes, heading order, step list and link names. No duplicate or missing announcements.
- Check forced colours/high-contrast mode. There are no animations; reduced-motion settings need no alternative effect.
- Click both links and verify normal new tabs with clean destination URLs. The website may have its own cookies; the extension does not add tracking.
- Close and reopen the popup; it must start at the five choices. Confirm no console errors.
- Inspect permissions: no site or privileged permissions should be requested.

Record browser version, OS, date, tester, results and screenshots. Automated checks do not mark manual testing as completed. See `docs/verification.md` for the actual coverage of this session.

## Production release-candidate acceptance

Run npm run package:candidate after technical/content/asset validation evidence is current. In Firefox load build/release-candidate/firefox/manifest.json temporarily; in Chrome load build/release-candidate/chromium. Disable the development copy to avoid confusing two installations. These folders contain production presentation without a development badge; their containing folder/ZIP names identify them as candidates, not store-ready releases. Use this exact runtime for outstanding manual checks.

User evidence: corrected Chrome popup at default zoom was manually checked for width, wrapping, scrolling and horizontal overflow. Full Chrome acceptance, corrected Firefox acceptance, Edge, Opera, native 150/200% zoom, Windows display scaling and screen-reader checks remain pending.

## Outstanding beginner checks

Windows display scaling and NVDA review are currently mandatory internal final-release gates in scripts/lib.mjs, not blockers for release-candidate ZIPs. Neither has been completed. This is the project's acceptance policy, not a claim about a specific store-mandated tool.

Windows: record the current Settings > System > Display > Scale value. At browser zoom 100%, use standard Windows scale options (for example 100%, 125%, 150%, 200% where offered); reopen the browser/popup after changes. Test the exact candidate in Firefox, Chrome, Edge and Opera: readable controls, all routes/reset/links reachable, vertical scrolling usable, no horizontal clipping/overflow. At normal scaling the initial five choices should fit; higher scaling may scroll vertically. Record each actual scale/result and restore the original setting. Do not substitute browser zoom for Windows scaling. Microsoft: https://support.microsoft.com/en-in/help/3025083/windows-scaling-issues-for-high-dpi-devices

NVDA is a free Windows screen reader. Download from https://www.nvaccess.org/download/ and start it. Open the candidate popup in each browser. Use Tab/Shift+Tab and Enter/Space to select every route; listen for meaningful button/link labels and the changed result heading. Use arrow keys in browse mode to read the complete steps and caveats; reset should return focus to the chosen starting button. Record missing/duplicate announcements or unreachable content. NVDA+Q exits (NVDA key is normally Insert, or Caps Lock if configured). Guide: https://download.nvaccess.org/documentation/en/userGuide.html

Record browser/version, scale or NVDA version, checks performed, result and any issues. Mark PASS only after completing the checks; this beginner check does not claim a comprehensive accessibility audit.
