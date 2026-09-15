# macOS Safari compatibility audit

Update: the team reports no Xcode Cloud Safari packager access. Use [the GitHub macOS diagnostic-first route](safari-github-actions.md). The cloud instructions below are historical alternatives, not the current next action. The current App Store name is UK Electrician Route Checker; actual converter identifiers and signed builds remain pending.

Status: Package prepared; Safari/TestFlight testing and App Store submission pending. No Safari execution is claimed on Windows. Documentation reviewed 2026-09-15, before edits. Apple documentation pages requiring JavaScript were read through their official developer.apple.com/tutorials/data JSON representations.

## Official references

- [Safari extensions](https://developer.apple.com/safari/extensions/): web packager available without Mac/Xcode; native distribution still uses an app containing an extension.
- [Packaging a web extension](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari): local packager and compatibility warnings; links to the separate cloud workflow.
- [App Store Connect packaging](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect): browser-based ZIP conversion, Xcode Cloud tab, Builds and TestFlight.
- [Browser compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility): Safari 15.4+ supports MV3, but individual manifest/API differences require assessment.
- [WebKit action model](https://developer.apple.com/documentation/webkit/wkwebextension/action): action popup/icon/title support.
- [Creating a Safari extension](https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension): extension resources and containing-app artwork are distinct.
- [Product-page limits](https://developer.apple.com/app-store/product-page/): app name/subtitle 30 characters, keywords 100, promotional text 170.
- [App privacy](https://developer.apple.com/app-store/app-privacy-details/): declarations must describe the complete distributed app and third-party practices.

## Exact runtime assessment

The source and both submitted archives were inspected and their hashes recorded before edits. The 11 non-manifest files are identical across Firefox/Chromium and the prepared Safari input. No qualification wording, functionality, popup source or artwork was changed. This is a compatibility assessment, not proof of Safari behavior.

| Area | Finding and disposition |
| --- | --- |
| MV3 | Retained. Apple's compatibility page establishes support from Safari 15.4; generated app deployment minimum is chosen by Apple's packager and must be inspected, not assumed to be 15.4. |
| action.default_popup | Retained popup/popup.html and local default icons/title. Action popup concept is supported; actual toolbar behavior must be tested on macOS. |
| Name/description | Manifest name shortened to the requested UK Electrician Qualification Checker (36). Description remains the approved 74-character text, under our conservative 132-character validator. No Safari-specific 30-character manifest limit is inferred from the separate App Store name limit. App record requires a shorter proposed name; see listing. |
| Icons | All six approved PNGs (16/32/48/64/96/128) and supplied 837x252 logo retained exactly. Extension icons are not certification of containing-app/App Store icon quality. Inspect cloud-generated app/toolbar icons; a higher-resolution approved master or Apple app artwork may be needed. No invented/rescaled artwork added. |
| CSP | Retained local-only MV3 extension_pages policy, connect-src none, no remote fonts/code/eval/inline scripts. Compatibility is expected from standards use, but Apple packager warnings and actual Safari console must confirm no blocked local resources. |
| Modules | popup.html loads local type=module JS importing local qualification data. No bundler/runtime library/browser API dependency. Standards-based compatibility expected, not verified in Safari here. |
| Links | Two clean HTTPS destinations only: homepage and qualification guide. Real anchors use target=_blank, rel=noopener noreferrer; no tabs permission/API. Safari may present a tab/window according to preferences. Verify both destinations and absent opener/referrer leakage on Mac. |
| Layout | Explicit html/body 380px width/min-width, border-box, body max-height 500px with vertical auto-scroll, normal word wrapping. Five 44px buttons. Chromium/Firefox intrinsic sizing tests are not Safari evidence; verify Safari popover width, long routes, font scaling, scrolling and focus on Mac. |
| Firefox fields | browser_specific_settings/Gecko ID and no-data declaration excluded. Bundle ID belongs to Apple packaging metadata, not a WebExtension manifest field. |
| Chromium fields | No key, update_url, externally_connectable or Chromium-only APIs supplied. Strict Safari field allowlist rejects additional properties. |
| Unsupported APIs | Zero runtime chrome.* or browser.* calls. No background/content scripts, storage, identity, webRequest, tabs or native messaging. Apple's documented API exceptions therefore have no direct runtime use here. |
| Privacy/permissions | No permissions/host permissions, network APIs, tracking/storage/telemetry. No Apple privacy manifest or entitlements are fabricated inside the input ZIP; the cloud-generated native app must be reviewed for actual entitlements, privacy/export questions and any required declarations. WebExtension no-permission behavior does not eliminate Safari's user enable-extension step. |
| Platform | macOS-only is selected in App Store Connect's app record/packaging workflow, not encoded by an invented manifest platform key. Do not select iOS; no iPhone/iPad release. |

The requested app name is 36 characters, exceeding Apple's 30-character App Store name limit. Proposed store name: UK Electrician Route Checker (28), pending client approval and availability. Keep the requested full product name in the popup/description. Bundle ID training.elec.qualification-checker and SKU ELEC-QUAL-CHECKER-MAC-001 remain proposals; none registered or overwritten.

## Local protection

npm run build:safari, npm run validate:safari, npm run package:safari. Safari is a separate target; existing build target arrays and submitted ZIPs are untouched. The builder checks submitted package hashes, current approved content/asset hashes and identical source/production bytes. The dedicated manifest only changes name relative to Chromium. Validators enforce exact keys, version, local CSP, safe URLs, absence of network/browser APIs, approved assets, 12-file allowlist and production-only text. Packaging independently extracts and compares each entry; tests rebuild twice for deterministic bytes. These local checks cannot replace Apple conversion/TestFlight/Safari acceptance.
