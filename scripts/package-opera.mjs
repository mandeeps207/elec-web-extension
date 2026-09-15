import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { zipSync, unzipSync } from 'fflate';
import { root, json, put, sha256, validateBuild } from './lib.mjs';

// Derive only a store-name variant from the exact previously verified candidate.
// This does not promote candidate acceptance or bypass final release gates.
const input = 'dist/release-candidate/elec-training-qualification-checker-chromium-v1.0.0.zip';
const output = 'dist/opera/elec-training-qualification-checker-opera-v1.0.0.zip';
const directory = 'build/opera';
const bytes = await readFile(path.join(root, input));
const record = (await json('release-status.json')).candidatePackages.find(item => item.path.includes('-chromium-'));
assert.equal(sha256(bytes), record.sha256, 'Opera input must match the verified Chromium candidate');
const original = unzipSync(bytes);
assert.deepEqual(Object.keys(original).sort(), [...record.files].sort());
const manifest = JSON.parse(Buffer.from(original['manifest.json']).toString('utf8'));
const originalManifest = structuredClone(manifest);
manifest.name = 'UK Electrician Qualification Checker';
assert(manifest.name.length <= 45, 'Opera manifest name must not exceed 45 characters');
assert.equal(manifest.version, '1.0.0');
const changed = { ...original, 'manifest.json': new TextEncoder().encode(JSON.stringify(manifest, null, 2) + '\n') };
assert.deepEqual({ ...manifest, name: originalManifest.name }, originalManifest, 'Only the name may change');
for (const [name, data] of Object.entries(changed)) {
  assert(!name.includes('..') && !name.startsWith('/') && !name.includes('\\'));
  await put(`${directory}/${name}`, data);
}
await validateBuild(directory, 'chromium', true);
const entries = Object.fromEntries(Object.entries(changed).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, data]) => [name, [data, { mtime: new Date(2000, 0, 1), level: 0 }]]));
const zip = zipSync(entries);
assert.deepEqual(zipSync(entries), zip, 'Opera packaging must be deterministic');
const extracted = unzipSync(zip);
assert.deepEqual(Object.keys(extracted).sort(), [...record.files].sort());
for (const [name, data] of Object.entries(extracted)) {
  assert.deepEqual(data, changed[name]);
  if (name !== 'manifest.json') assert.deepEqual(data, original[name], `Runtime changed: ${name}`);
}
await put(output, zip);
await put('test-results/opera-package-results.json', JSON.stringify({ input, inputSha256: sha256(bytes), output, sha256: sha256(zip), bytes: zip.length, name: manifest.name, nameLength: manifest.name.length, version: manifest.version, onlyManifestNameChanged: true, runtimeFilesIdentical: true, files: Object.keys(extracted).sort(), status: 'Opera-specific upload artifact derived from the tested candidate; outstanding manual acceptance is unchanged.' }, null, 2) + '\n');
console.log(`PASS: Opera name ${manifest.name.length}/45 characters; only manifest.name changed; 12-file archive validated.\n${output}\nSHA256 ${sha256(zip)}`);
