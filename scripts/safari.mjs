import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { zipSync, unzipSync } from 'fflate';
import { root, json, read, put, files, sha256, sizes, runtimeFiles, validateManifest, validateBuild, validateRoutes } from './lib.mjs';
import { productionContent } from './build.mjs';

export const safariDirectory = 'build/release-candidate/safari';
export const safariZip = 'dist/safari/elec-training-qualification-checker-safari-v1.0.0-packager-input.zip';
export function validateSafariManifest(manifest) {
  validateManifest(manifest, 'safari', '1.0.0');
  assert.equal(manifest.name, 'UK Electrician Qualification Checker');
  assert(manifest.description.length <= 132);
  assert.deepEqual(Object.keys(manifest).sort(), ['manifest_version', 'name', 'version', 'description', 'homepage_url', 'action', 'content_security_policy', 'icons'].sort());
  assert.equal(manifest.action.default_popup, 'popup/popup.html');
}
export async function submittedPackages() {
  const status = await json('release-status.json');
  const hashes = {};
  for (const target of ['firefox', 'chromium']) {
    const file = `dist/release-candidate/elec-training-qualification-checker-${target}-v1.0.0.zip`;
    const bytes = await readFile(path.join(root, file));
    const hash = sha256(bytes);
    assert.equal(hash, status.candidatePackages.find(a => a.path.includes(`-${target}-`)).sha256, 'Submitted artifact changed; stop');
    hashes[file] = hash;
  }
  return hashes;
}
async function inputs() {
  const hashes = await submittedPackages();
  const archives = await Promise.all(Object.keys(hashes).map(async file => unzipSync(await readFile(path.join(root, file)))));
  const original = archives[1];
  for (const name of Object.keys(original).filter(n => n !== 'manifest.json')) assert.deepEqual(original[name], archives[0][name], `Firefox/Chromium runtime mismatch: ${name}`);
  const state = await json('release-status.json');
  assert.equal(sha256(await read('src/data/qualification-routes.js')), state.approvedContentSha256);
  validateRoutes();
  assert.equal((await json('package.json')).version, '1.0.0');
  assert.equal(productionContent(), Buffer.from(original['data/qualification-routes.js']).toString());
  for (const file of runtimeFiles.filter(f => f !== 'data/qualification-routes.js')) assert.deepEqual(await readFile(path.join(root, 'src', file)), Buffer.from(original[file]));
  for (const name of ['logo.png', ...sizes.map(s => `icons/icon-${s}.png`)]) {
    const bytes = await readFile(path.join(root, 'src/assets', name));
    assert.equal(sha256(bytes), state.assetHashes[name]);
    assert.deepEqual(bytes, Buffer.from(original[`assets/${name}`]));
  }
  return { hashes, original };
}
export async function validateSafari() {
  const { hashes, original } = await inputs();
  const manifest = await json(`${safariDirectory}/manifest.json`);
  validateSafariManifest(manifest);
  const sourceManifest = await json('manifests/safari.json');
  assert.deepEqual(manifest, sourceManifest);
  const expected = await validateBuild(safariDirectory, 'safari', true);
  for (const name of expected.filter(n => n !== 'manifest.json')) assert.deepEqual(await readFile(path.join(root, safariDirectory, name)), Buffer.from(original[name]));
  assert.deepEqual(await submittedPackages(), hashes);
  return expected;
}
export async function buildSafari() {
  const { original } = await inputs();
  validateSafariManifest(await json('manifests/safari.json'));
  const absolute = path.resolve(root, safariDirectory);
  assert(absolute.startsWith(path.resolve(root, 'build/release-candidate') + path.sep));
  await rm(absolute, { recursive: true, force: true });
  for (const [name, bytes] of Object.entries(original)) {
    assert(!name.includes('..') && !name.startsWith('/') && !name.includes('\\'));
    if (name !== 'manifest.json') await put(`${safariDirectory}/${name}`, bytes);
  }
  await put(`${safariDirectory}/manifest.json`, JSON.stringify(await json('manifests/safari.json'), null, 2) + '\n');
  await validateSafari();
  console.log(`PASS: built ${safariDirectory}; all 11 non-manifest files identical to submitted packages`);
}
export async function packageSafari() {
  await buildSafari();
  const expected = await validateSafari();
  const entries = {};
  for (const file of await files(safariDirectory)) entries[file.slice(safariDirectory.length + 1)] = [new Uint8Array(await readFile(path.join(root, file))), { mtime: new Date(2000, 0, 1), level: 0 }];
  const zip = zipSync(entries);
  const extracted = unzipSync(zip);
  assert.deepEqual(Object.keys(extracted).sort(), expected.sort());
  for (const [name, data] of Object.entries(extracted)) assert.deepEqual(data, entries[name][0]);
  await put(safariZip, zip);
  console.log(`PASS: ${safariZip}\nSHA256 ${sha256(zip)}`);
  return zip;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2];
  if (command === 'build') await buildSafari();
  else if (command === 'validate') { await validateSafari(); console.log('PASS: Safari manifest, security, approved bytes and package allowlist'); }
  else if (command === 'package') await packageSafari();
  else throw new Error('Use build, validate or package');
}
