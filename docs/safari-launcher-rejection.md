# Build 3 launch rejection and correction

Apple reviewed version 1.0 (3) on October 3, 2026, on an M3 MacBook Air running macOS 27.0. Submission f1ad3044-f418-49ca-8b8f-fc63bfac611b was rejected under 2.1(a): no content appeared on containing-app launch. The supplied screenshot shows a blank window. This is actual launch evidence; earlier compile/sign/export success did not validate launch content.

The reviewed generated controller used WKWebView to load bundled Main.html. Instructions depended on successful WebKit rendering. Its extension-state error branch returned without displaying a message. The precise WebKit failure is not proven without a macOS reproduction or launch logs; absence of network capability is a possible contributing factor, not an independently verified diagnosis.

The deterministic post-conversion correction removes the single connected storyboard WebView and replaces the controller with native AppKit labels and a Safari extension-settings button. Instructions appear synchronously before extension-state lookup. Unavailable state or failed settings opening produces a visible manual fallback. No network/file capability is introduced; sandbox-only entitlements and WebExtension resources remain unchanged. Unexpected storyboard structure fails closed.

Phase 1 approval is closed. The previous run/fingerprint are retained as historical build 3 evidence, not authorization for the corrected launcher. A fresh unsigned diagnostic must compile and execute the native-controller smoke test, build both architectures, and produce a new fingerprint for review. The smoke test checks initial native content and the button action; it does not establish signed-app launch, Safari enablement, visual layout or accessibility acceptance.

Before resubmission, an authorized Mac tester must install the replacement through TestFlight and check a clean first launch on macOS 27, visible instructions, the Safari Settings button, enabled/disabled extension state, all five toolbar routes, reset/links, keyboard/VoiceOver and screenshots. Also test supported older macOS versions where available. Record actual results. Use a new build number greater than every previous upload (4 if 3 remains the latest). Only after fresh diagnostic review and signed artifact validation should the replacement be uploaded. Do not resubmit build 3 with reviewer instructions alone.

No reviewer reply, workflow dispatch, Apple upload, commit or push is part of this local corrective preparation.
