import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { zipSync } from 'fflate';
import { routes } from '../src/data/qualification-routes.js';
import { targets, runtimeFiles, validateRoutes, cleanUrl, validateManifest, json, read, auditRuntime, releaseErrors, validateBuild, validatePopupSizing } from '../scripts/lib.mjs';
import { packageBuild, archiveEntries } from '../scripts/package.mjs';
import { productionContent, build } from '../scripts/build.mjs';
import { submissionErrors, files } from '../scripts/lib.mjs';

test('account setup and store collateral are submission prerequisites, not package blockers', async () => {
  const pending = await json('release-status.json');
  pending.screenshotsApproved = false; pending.listingsApproved = false;
  pending.submissionAccounts = {};
  const ready = structuredClone(pending);
  ready.screenshotsApproved = true; ready.listingsApproved = true;
  ready.submissionAccounts = { firefox: { ready: true }, chrome: { ready: true } };
  assert.deepEqual(await releaseErrors(pending), await releaseErrors(ready));
  assert.equal(submissionErrors(pending).length, 4);
  assert.deepEqual(submissionErrors(ready), []);
  const forged = structuredClone(routes);
  forged[0].review.approvedBy = 'Someone else';
  assert((await releaseErrors(pending, forged)).some(error => error.includes('Route new')));
});

test('public product material excludes private objectives and packages exclude chat evidence', async () => {
  const names = ['README.md', 'CHANGELOG.md'];
  for (const dir of ['docs', 'privacy', 'store-listings', 'src']) names.push(...await files(dir));
  for (const name of names.filter(name => /\.(md|html|js|css)$/.test(name))) {
    assert(!/backlink|SEO experiment|link.building objective/i.test(await read(name)), `Private objective in ${name}`);
  }
  assert(!/client-authorization|written client chat|Mandeep Singh|yes thats fine/i.test(productionContent()));
});

test('candidate defers only human acceptance while keeping content, asset and source validation gates', async () => {
  const status = await json('release-status.json');
  status.privacyExtensionCoverageConfirmed = false;
  status.manualBrowsers = {};
  status.approvedSourceSha256 = '';
  const final = await releaseErrors(status);
  const candidate = await releaseErrors(status, routes, { candidate: true });
  assert(final.some(error => error.includes('privacyExtensionCoverageConfirmed')));
  assert(final.some(error => error.includes('Manual firefox')));
  assert(final.some(error => error.includes('visual/source')));
  assert(!candidate.some(error => /privacyExtensionCoverageConfirmed|Manual |visual\/source/.test(error)));
  status.assetHashes = {}; status.approvedContentSha256 = 'stale'; status.validatedSourceSha256 = 'stale';
  const rejected = await releaseErrors(status, routes, { candidate: true });
  assert(rejected.some(error => error.includes('official PNG')));
  assert(rejected.some(error => error.includes('Approved content hash')));
  assert(rejected.some(error => error.includes('Validation evidence/source hash')));
});

test('production serialization excludes internal presentation and preserves every qualification statement', async () => {
  const text = productionContent();
  assert(!/\b(?:DEV|development|draft|placeholder|unapproved|unresolved)\b|not for public release/i.test(text));
  auditRuntime('data/qualification-routes.js', text);
  const output = await import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`);
  assert.equal(output.copy.notice, undefined);
  for (const [i, route] of routes.entries()) {
    assert.deepEqual(output.routes[i], Object.fromEntries(['id', 'label', 'heading', 'intro', 'steps', 'caveats', 'sources'].map(key => [key, route[key]])));
  }
  for (const file of ['popup/popup.html', 'popup/popup.css', 'popup/popup.js']) {
    assert(!/\b(?:DEV|development|draft|placeholder|unapproved|unresolved)\b|not for public release/i.test(await read(`src/${file}`)));
  }
});

test('production build cannot bypass missing release evidence', async () => {
  if ((await releaseErrors()).length) await assert.rejects(build(true), /Release blocked/);
});

test('all five unique starting positions have sourced, reviewed steps or an unresolved state', () => validateRoutes());
test('popup roots retain explicit pixel sizing; viewport caps and media overrides are rejected', async () => {
  const css = await read('src/popup/popup.css');
  validatePopupSizing(css);
  const sizing = 'html, body { width: 380px; min-width: 380px; margin: 0; }';
  for (const unsafe of [
    'body { width: 400px; max-width: 100vw; margin: 0; overflow-wrap: anywhere; }',
    'html, body { width: 100%; min-width: 0; margin: 0; }',
    'html, body { width: 100vw; min-width: 100vw; margin: 0; }',
    'html, body { width: min(380px, 100vw); min-width: 0; margin: 0; }',
    'html, body { width: 900px; min-width: 900px; margin: 0; }',
    `@media (min-width: 360px) { ${sizing} }`,
  ]) assert.throws(() => validatePopupSizing(css.replace(sizing, unsafe)));
  for (const override of ['body { max-width: 100vw; }', '@media (max-width: 280px) { html, body { width: 100%; } }', 'html { overflow-x: hidden; }']) assert.throws(() => validatePopupSizing(css + override));
});
test('missing and duplicate routes are rejected', () => {
  assert.throws(() => validateRoutes(routes.slice(1)));
  const copy = structuredClone(routes); copy[4].id = copy[0].id;
  assert.throws(() => validateRoutes(copy));
});
test('foreign domains, insecure and tracking URLs are rejected', () => {
  for (const url of ['http://elec.training/', 'https://elec.training.evil.test/', 'https://example.org/', 'https://elec.training/?utm_source=extension', 'https://user@elec.training/', 'https://elec.training:8443/']) assert.throws(() => cleanUrl(url));
});
test('manifests match the package version and allow no permissions', async () => {
  for (const target of targets) {
    const manifest = await json(`manifests/${target}.json`);
    validateManifest(manifest, target, (await json('package.json')).version);
    assert.throws(() => validateManifest({ ...manifest, permissions: ['tabs'] }, target, manifest.version));
    assert.throws(() => validateManifest({ ...manifest, host_permissions: ['<all_urls>'] }, target, manifest.version));
  }
});
test('runtime rejects remote execution, inline handlers, network and storage APIs', async () => {
  for (const file of runtimeFiles) auditRuntime(file, await read(`src/${file}`));
  for (const code of ['fetch("https://elec.training/")', 'localStorage.setItem("x", "y")', 'node.innerHTML = value', 'eval(code)', 'import("https://elec.training/code.js")']) assert.throws(() => auditRuntime('test.js', code));
  assert.throws(() => auditRuntime('test.html', '<script src="https://elec.training/x.js"></script>'));
});
test('release rejects unapproved routes, missing assets, incomplete manual checks and stale evidence', async () => {
  const errors = await releaseErrors();
  if (routes.some((route) => route.review.status !== 'approved')) assert(errors.some((error) => error.includes('requires Charanjit')));
  const bad = await json('release-status.json');
  bad.officialBrandingApproved = false; bad.validatedSourceSha256 = 'stale'; bad.manualBrowsers.firefox = false;
  const rejected = await releaseErrors(bad);
  assert(rejected.some((error) => error.includes('officialBrandingApproved')));
  assert(rejected.some((error) => error.includes('source hash')));
  assert(rejected.some((error) => error.includes('Manual firefox')));
  const unresolved = structuredClone(routes);
  unresolved[0].review = { ...unresolved[0].review, status: 'approved', approvedBy: 'Charanjit', approvedOn: '2026-09-14' };
  unresolved[0].state = 'unresolved';
  assert((await releaseErrors(bad, unresolved)).some((error) => error.includes('Route new')));
});
test('both development packages contain only the runtime, valid icons and a root manifest; ZIPs are deterministic', async () => {
  await packageBuild();
  const version = (await json('package.json')).version;
  const paths = targets.map((target) => new URL(`../dist/development/elec-training-qualification-checker-${target}-v${version}-development.zip`, import.meta.url));
  const first = await Promise.all(paths.map((file) => readFile(file)));
  await packageBuild();
  for (const [i, target] of targets.entries()) {
    const second = await readFile(paths[i]);
    assert.deepEqual(second, first[i]);
    const entries = archiveEntries(second);
    assert.equal(JSON.parse(Buffer.from(entries['manifest.json']).toString()).version, version);
    await validateBuild(`build/development/${target}`, target);
    await assert.rejects(validateBuild(`build/development/${target}`, target, true));
  }
});
test('nested archive manifest is rejected', () => {
  assert.throws(() => archiveEntries(zipSync({ 'parent/manifest.json': new TextEncoder().encode('{}') })));
});
