import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Builder, By, Key, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { root, json, popupWidth } from './lib.mjs';
import { testNativePopup } from './native-popup-test.mjs';
import { routes, links } from '../src/data/qualification-routes.js';

const release = process.argv.includes('--release');
const mode = release ? 'release' : 'development';
const results = [];
await mkdir(path.join(root, 'test-results'), { recursive: true });
const fits = () => document.documentElement.scrollWidth <= window.innerWidth;
const layout = () => [document.documentElement, document.body, document.querySelector('main')].map((node) => node.getBoundingClientRect().width);
async function chromiumTest() {
  const extension = path.join(root, `build/${mode}/chromium`);
  const context = await chromium.launchPersistentContext('', {
    // Do not emulate a viewport globally: that can mask native popup sizing.
    channel: 'chromium', headless: true, viewport: null,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const installed = await manager.evaluate(() => new Promise((resolve) => chrome.developerPrivate.getExtensionsInfo({}, resolve)));
    const addon = installed.find((item) => item.name.includes('UK Electrician Qualification Checker'));
    assert(addon, 'Chromium must load the actual unpacked extension');
    assert.equal(addon.state, 'ENABLED');
    const page = await context.newPage();
    const errors = [], network = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    await context.setOffline(true);
    await page.goto(`chrome-extension://${addon.id}/popup/popup.html`);
    await page.locator('.choice').first().waitFor();
    assert.equal(await page.locator('.choice').count(), 5);
    assert.deepEqual(await page.evaluate(layout), [popupWidth, popupWidth, popupWidth]);
    await page.screenshot({ path: 'test-results/chromium-initial.png', fullPage: true });
    for (const route of routes) {
      const button = page.locator(`[data-route="${route.id}"]`);
      await button.focus();
      await page.keyboard.press(route.id === 'new' ? 'Space' : 'Enter');
      assert.equal(await page.locator('#selected-label').textContent(), route.label);
      assert.equal(await page.locator('#steps li').count(), route.steps.length);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'result-heading');
      assert(await page.evaluate(fits));
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), []);
      await page.screenshot({ path: `test-results/chromium-${route.id}.png`, fullPage: true });
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'reset');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.route), route.id);
    }
    await page.locator('.choice').first().focus();
    for (const route of routes) {
      assert.equal(await page.evaluate(() => document.activeElement.dataset.route), route.id);
      await page.keyboard.press('Tab');
    }
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
    const initialAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(initialAxe.violations.map((v) => v.id), []);
    // Regular-tab checks only. Allow room for a 380px document at 200% zoom;
    // a forced 200px viewport is not the contract of this desktop toolbar UI.
    await page.setViewportSize({ width: 820, height: 700 });
    for (const zoom of [1, 1.5, 2]) {
      await page.evaluate(z => new Promise(resolve => chrome.tabs.setZoom(z, resolve)), zoom);
      assert.deepEqual(await page.evaluate(layout), [popupWidth, popupWidth, popupWidth]);
      assert(await page.evaluate(fits));
    }
    await page.evaluate(() => new Promise((resolve, reject) => chrome.tabs.setZoom(2, () => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve())));
    assert.equal(await page.evaluate(() => new Promise((resolve) => chrome.tabs.getZoom(resolve))), 2);
    assert(await page.evaluate(fits));
    await page.locator('.choice').first().click();
    assert(await page.evaluate(fits));
    // Playwright's fullPage capture clips at non-default tab zoom. Capture the
    // physical viewport through CDP instead; scroll/reflow is checked separately.
    const cdp = await context.newCDPSession(page);
    const zoomCapture = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile('test-results/chromium-200-percent.png', Buffer.from(zoomCapture.data, 'base64'));
    await cdp.detach();
    await page.evaluate(() => new Promise((resolve) => chrome.tabs.setZoom(1, resolve)));
    await page.locator('#reset').click();
    assert.deepEqual(network, [], 'No popup network traffic during offline route use');
    // Intercept destination pages so links can be tested without contacting the website.
    await context.setOffline(false);
    await context.route('https://elec.training/**', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Test destination</title>' }));
    for (const link of links) {
      const [tab] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: link.label, exact: true }).click()]);
      await tab.waitForLoadState();
      assert.equal(tab.url(), link.url);
      assert.equal(await tab.evaluate(() => window.opener), null);
      await tab.close();
    }
    await page.reload();
    assert(await page.locator('#starting-point').isVisible());
    assert.deepEqual(errors, []);
    // Run native geometry in a fresh context without ANY viewport emulation.
    results.push({ browser: 'Chromium', version: context.browser()?.version(), result: 'PASS', scope: 'regular extension tab, not native toolbar geometry', checks: 'Five routes offline; keyboard/focus return; axe WCAG A/AA; zero popup HTTP traffic; 380px layout at 100/150/200% tab zoom in an adequately sized window; clean new-tab links; reset on reload; no JS errors.' });
  } finally { await context.close(); }
}
async function firefoxTest() {
  const manifest = await json(`build/${mode}/firefox/manifest.json`);
  const uuid = 'e11c0000-0000-4000-8000-000000000001';
  const options = new firefox.Options()
    .addArguments('-headless')
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [manifest.browser_specific_settings.gecko.id]: uuid }))
    .setPreference('datareporting.healthreport.uploadEnabled', false)
    .setPreference('toolkit.telemetry.enabled', false);
  const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  try {
    const id = await driver.installAddon(path.join(root, `build/${mode}/firefox`), true);
    assert.equal(id, manifest.browser_specific_settings.gecko.id);
    await driver.manage().window().setRect({ width: 1000, height: 750 });
    await driver.get(`moz-extension://${uuid}/popup/popup.html`);
    await driver.wait(until.elementLocated(By.css('.choice')), 10000);
    assert.equal((await driver.findElements(By.css('.choice'))).length, 5);
    assert.deepEqual(await driver.executeScript(layout), [popupWidth, popupWidth, popupWidth]);
    // Work offline after the browser/driver has started.
    await driver.setContext('chrome');
    await driver.executeScript('Services.io.offline = true;');
    await driver.setContext('content');
    for (const route of routes) {
      const button = await driver.findElement(By.css(`[data-route="${route.id}"]`));
      await button.sendKeys(Key.ENTER);
      assert.equal(await driver.findElement(By.id('selected-label')).getText(), route.label);
      assert.equal((await driver.findElements(By.css('#steps li'))).length, route.steps.length);
      assert.equal(await driver.executeScript('return document.activeElement.id'), 'result-heading');
      assert(await driver.executeScript(`return (${fits.toString()})()`));
      await writeFile(`test-results/firefox-${route.id}.png`, Buffer.from(await driver.takeScreenshot(), 'base64'));
      await driver.findElement(By.id('reset')).sendKeys(Key.ENTER);
      assert.equal(await driver.executeScript('return document.activeElement.dataset.route'), route.id);
    }
    for (const zoom of [1, 1.5, 2]) {
      await driver.setContext('chrome');
      await driver.executeScript('gBrowser.selectedBrowser.fullZoom = arguments[0];', zoom);
      assert.equal(await driver.executeScript('return gBrowser.selectedBrowser.fullZoom'), zoom);
      await driver.setContext('content');
      assert.deepEqual(await driver.executeScript(layout), [popupWidth, popupWidth, popupWidth]);
      assert(await driver.executeScript(`return (${fits.toString()})()`));
    }
    await driver.findElement(By.css('.choice')).click();
    assert(await driver.executeScript(`return (${fits.toString()})()`));
    await writeFile('test-results/firefox-200-percent.png', Buffer.from(await driver.takeScreenshot(), 'base64'));
    await driver.navigate().refresh();
    assert(await driver.findElement(By.id('starting-point')).isDisplayed());
    const capabilities = await driver.getCapabilities();
    await driver.setContext('chrome');
    await driver.executeScript('gBrowser.selectedBrowser.fullZoom = 1;');
    await driver.setContext('content');
    const nativePopup = await testNativePopup({
      evaluate: (fn, argument) => driver.executeScript(fn, argument),
      open: async () => {
        const error = await driver.executeAsyncScript('const done = arguments[arguments.length - 1]; browser.action.openPopup().then(() => done(null), error => done(error.message));');
        assert.equal(error, null);
      },
      close: () => driver.executeScript('browser.extension.getViews({type: "popup"}).forEach(w => w.close());'),
    });
    results.push({ browser: 'Firefox', version: capabilities.get('browserVersion'), result: 'PASS', scope: 'regular extension tab plus separately opened native action popup', checks: 'Tab: five routes offline, keyboard/focus return, 380px layout at 100/150/200% tab zoom in an adequately sized window, reset on reload.', nativePopup });
  } finally { await driver.quit(); }
}
async function chromiumNativeTest() {
  const extension = path.join(root, `build/${mode}/chromium`);
  const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, viewport: null, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const installed = await manager.evaluate(() => new Promise(resolve => chrome.developerPrivate.getExtensionsInfo({}, resolve)));
    const addon = installed.find(item => item.name.includes('UK Electrician Qualification Checker'));
    assert(addon);
    const opener = await context.newPage();
    await opener.goto(`chrome-extension://${addon.id}/popup/popup.html`);
    const nativePopup = await testNativePopup({
      evaluate: (fn, argument) => opener.evaluate(fn, argument),
      open: () => opener.evaluate(() => chrome.action.openPopup()),
      close: () => opener.evaluate(() => chrome.extension.getViews({ type: 'popup' }).forEach(w => w.close())),
    });
    results.push({ browser: 'Chromium native action popup', version: context.browser()?.version(), result: 'PASS', nativePopup });
  } finally { await context.close(); }
}
for (const [name, check] of [['Chromium tab', chromiumTest], ['Chromium native action popup', chromiumNativeTest], ['Firefox tab and native action popup', firefoxTest]]) {
  try { await check(); console.log(`PASS: ${name} installed-extension browser checks`); }
  catch (error) { results.push({ browser: name, result: 'FAIL', error: error.stack }); console.error(`${name}: ${error.stack}`); process.exitCode = 1; }
}
await writeFile('test-results/browser-results.json', JSON.stringify({ date: new Date().toISOString(), mode, results, manualTesting: 'User supplied failing Chrome/Firefox toolbar screenshots before this correction. Corrected native action geometry is separately automated at default popup zoom. Manual retesting of the corrected builds at 100/150/200% zoom/display scale and screen-reader review remains required.' }, null, 2));
