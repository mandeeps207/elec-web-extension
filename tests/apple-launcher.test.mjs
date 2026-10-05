import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeLauncherStoryboard, nativeLauncherSource } from '../scripts/apple-launcher.mjs';

test('Launcher correction removes only the exact connected WebView and fails on unexpected structure', () => {
  const scene = '<viewController customClass="ViewController"><view><subviews><wkWebView id="web"><wkWebViewConfiguration/></wkWebView></subviews></view><connections><outlet property="webView" destination="web" id="out"/></connections></viewController>';
  const corrected = nativeLauncherStoryboard(scene);
  assert(corrected.includes('customClass="ViewController"'));
  assert(!corrected.includes('wkWebView'));
  assert.throws(() => nativeLauncherStoryboard(scene + scene));
  assert.throws(() => nativeLauncherStoryboard(scene.replace('destination="web"', 'destination="other"')));
  assert.throws(() => nativeLauncherStoryboard('<view/>'));
});
test('Native launcher displays instructions before asynchronous state lookup and retains visible failures', () => {
  const source = nativeLauncherSource('training.elec.qualification.checker.extension');
  assert(source.indexOf('view.addSubview(stack)') < source.indexOf('refreshState()'));
  assert(!/WKWebView|evaluateJavaScript|loadFileURL|NSApplication.shared.terminate/.test(source));
  assert(source.includes('Extension status is unavailable.'));
  assert(source.includes('Could not open settings automatically.'));
  assert(source.includes('showPreferencesForExtension(withIdentifier: extensionBundleIdentifier)'));
  assert.throws(() => nativeLauncherSource('wrong'));
});
