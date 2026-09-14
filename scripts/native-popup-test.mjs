import assert from 'node:assert/strict';
import { popupWidth } from './lib.mjs';
import { routes } from '../src/data/qualification-routes.js';

// Runs in the opener extension tab, but inspects ONLY a separate browser action
// popup returned by getViews({type: 'popup'}). No CSS/viewport overrides are used.
function inspectPopup(command = {}) {
  const api = globalThis.browser ?? globalThis.chrome;
  const views = api.extension.getViews({ type: 'popup' });
  if (views.length !== 1) return { count: views.length };
  const panel = views[0];
  if (panel === window) throw new Error('The opener tab is not a native action popup');
  const doc = panel.document;
  if (doc.querySelectorAll('.choice').length !== 5) return { count: 1, ready: false };
  if (command.route) doc.querySelector(`[data-route="${command.route}"]`).click();
  if (command.reset) doc.getElementById('reset').click();
  if (command.longText) doc.querySelector('footer a').textContent = 'https://elec.training/' + 'exceptionallylongsegment'.repeat(30);
  if (command.scroll) doc.body.scrollTo(0, doc.body.scrollHeight);
  if (command.top) panel.scrollTo(0, 0);
  const root = doc.documentElement;
  return {
    count: 1, ready: true, url: panel.location.href,
    viewportWidth: panel.innerWidth, viewportHeight: panel.innerHeight,
    rootWidth: root.getBoundingClientRect().width,
    bodyWidth: doc.body.getBoundingClientRect().width,
    bodyClientWidth: doc.body.clientWidth,
    mainWidth: doc.querySelector('main').getBoundingClientRect().width,
    rootMinWidth: panel.getComputedStyle(root).minWidth,
    bodyMinWidth: panel.getComputedStyle(doc.body).minWidth,
    horizontalOverflow: root.scrollWidth > root.clientWidth + 1 || doc.body.scrollWidth > doc.body.clientWidth + 1,
    scrollY: doc.body.scrollTop, scrollHeight: doc.body.scrollHeight,
    bodyClientHeight: doc.body.clientHeight,
    choices: [...doc.querySelectorAll('.choice')].map(button => {
      const rect = button.getBoundingClientRect();
      const style = panel.getComputedStyle(button);
      return { top: rect.top, bottom: rect.bottom, height: rect.height, fontSize: parseFloat(style.fontSize), wordBreak: style.wordBreak };
    }),
    selected: doc.getElementById('selected-label').textContent,
    stepCount: doc.querySelectorAll('#steps li').length,
    focused: doc.activeElement.id || doc.activeElement.dataset.route,
    footerBottom: doc.querySelector('footer').getBoundingClientRect().bottom,
    devicePixelRatio: panel.devicePixelRatio,
  };
}

export async function testNativePopup({ evaluate, open, close }) {
  await open();
  let initial;
  // Wait for population AND several layout frames: intrinsic auto-sizing is async.
  for (let attempt = 0; attempt < 30; attempt++) {
    initial = await evaluate(inspectPopup, {});
    if (initial.ready && initial.rootWidth === popupWidth && initial.bodyWidth === popupWidth) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const check = (geometry) => {
    assert.equal(geometry.count, 1, 'A real action popup must be open');
    assert.equal(geometry.rootWidth, popupWidth);
    assert.equal(geometry.bodyWidth, popupWidth);
    assert.equal(geometry.mainWidth, geometry.bodyClientWidth);
    assert(geometry.mainWidth >= popupWidth - 24, 'Only the vertical scrollbar may consume main width');
    assert.equal(geometry.rootMinWidth, `${popupWidth}px`);
    assert.equal(geometry.bodyMinWidth, `${popupWidth}px`);
    assert(!geometry.horizontalOverflow, 'Native action popup must not scroll horizontally');
    // Chromium may reserve additional width for its vertical scrollbar.
    assert(geometry.viewportWidth >= popupWidth && geometry.viewportWidth <= 420);
    assert(geometry.viewportHeight > 0 && geometry.viewportHeight <= 600);
  };
  try {
    check(initial);
    assert(initial.scrollHeight <= initial.bodyClientHeight + 1, 'Initial screen must not scroll vertically');
    assert(initial.viewportHeight <= 500, 'Initial screen must fit within 500px');
    for (const choice of initial.choices) {
      assert(choice.top >= 0 && choice.bottom <= initial.viewportHeight, 'Every choice must be visible without scrolling');
      assert(choice.height >= 44 && choice.height <= 48, 'Choice must retain a comfortable touch target');
      assert(choice.fontSize >= 14 && choice.wordBreak === 'normal');
    }
    const resultGeometry = [];
    for (const route of routes) {
      await evaluate(inspectPopup, { route: route.id });
      // Read after layout has had a chance to resize for changed route content.
      await new Promise((resolve) => setTimeout(resolve, 100));
      const geometry = await evaluate(inspectPopup, {});
      check(geometry);
      assert.equal(geometry.selected, route.label);
      assert.equal(geometry.stepCount, route.steps.length);
      assert.equal(geometry.focused, 'result-heading');
      await evaluate(inspectPopup, { scroll: true });
      const bottom = await evaluate(inspectPopup, {});
      if (geometry.scrollHeight > geometry.bodyClientHeight + 1) assert(bottom.scrollY > 0, 'Long results must be vertically scrollable');
      assert(bottom.footerBottom <= bottom.viewportHeight + 1, 'Footer must be reachable');
      resultGeometry.push({ id: route.id, viewportHeight: geometry.viewportHeight, scrollHeight: geometry.scrollHeight, scrolls: bottom.scrollY > 0 });
      const reset = await evaluate(inspectPopup, { reset: true });
      assert.equal(reset.focused, route.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await evaluate(inspectPopup, { route: routes[0].id });
    const longText = await evaluate(inspectPopup, { longText: true });
    check(longText);
    return { result: 'PASS', method: 'action.openPopup + extension.getViews({type: popup}); no viewport emulation', initial, resultGeometry, routes: 5, verticalScroll: 'PASS', exceptionalString: 'PASS', zoomScope: 'Default action-popup zoom only; browser-tab zoom does not change this popup. Manual zoom/display-scale checks remain required.' };
  } finally { await close(); }
}
