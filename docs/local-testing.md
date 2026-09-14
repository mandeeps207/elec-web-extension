# Local browser testing for beginners

Run `npm ci` and `npm run build` from the repository folder first. “Unpacked” means a folder of extension files instead of a store download. These development builds contain a DEV icon and unapproved content; do not distribute them publicly.

## Firefox desktop 142 or newer

1. Open Firefox and type `about:debugging#/runtime/this-firefox` in the address bar.
2. Click **Load Temporary Add-on**. Open this repository's `build/development/firefox` folder and select `manifest.json`.
3. Open Firefox's extensions/puzzle menu. Choose **[DEV] UK Electrician Qualification Checker**. Pin it to the toolbar if desired, then click its DEV icon to open the panel.
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

After the toolbar-width correction, reload the existing installation and close/reopen its popup; a previously open popup may still use the old CSS. Firefox: click **Reload** at `about:debugging#/runtime/this-firefox` for the extension loaded from `build/development/firefox/manifest.json`. Chrome: click the reload arrow at `chrome://extensions` for `build/development/chromium`. If installing fresh, use those same paths. There is no version-number change; the development build remains 0.1.0.

Expect a 380px-wide document in a panel up to 500px tall, with vertical scrolling inside it. Firefox may reserve some of that width for its vertical scrollbar. The updated automation opens and measures real default-zoom action popups in Firefox/Chromium, but manual zoom/display-scale testing remains mandatory. Zooming a regular web page may not change the extension panel; record the actual popup zoom/display scale tested rather than assuming it follows the tab.

- Open the actual toolbar panel. Verify all five buttons and both resource links can be reached by scrolling.
- Use Tab/Shift+Tab only. Focus must be clearly visible. Enter and Space activate each starting-point button; the result heading receives focus, and reset returns focus to the original choice.
- Read all five results. Verify the starting position and steps, unresolved wording, caveats and persistent draft warning.
- With the computer offline, repeat all choices. No content should depend on connectivity.
- At 100%, 150% and 200% browser zoom, verify no horizontal scrolling, clipped controls or trapped content. Test the browser's actual popup; tab zoom automation is supplementary.
- With a screen reader (for example NVDA), verify heading announcement on result changes, heading order, step list and link names. No duplicate or missing announcements.
- Check forced colours/high-contrast mode. There are no animations; reduced-motion settings need no alternative effect.
- Click both links and verify normal new tabs with clean destination URLs. The website may have its own cookies; the extension does not add tracking.
- Close and reopen the popup; it must start at the five choices. Confirm no console errors.
- Inspect permissions: no site or privileged permissions should be requested.

Record browser version, OS, date, tester, results and screenshots. Automated checks do not mark manual testing as completed. See `docs/verification.md` for the actual coverage of this session.
