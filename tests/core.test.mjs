import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { zipSync } from 'fflate';
import { routes } from '../src/data/qualification-routes.js';
import { targets, runtimeFiles, validateRoutes, cleanUrl, validateManifest, json, read, auditRuntime, releaseErrors, validateBuild, validatePopupSizing } from '../scripts/lib.mjs';
import { packageBuild, archiveEntries } from '../scripts/package.mjs';

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
