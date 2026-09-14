import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { zipSync, unzipSync } from 'fflate';
import { root, read, json, files, runtimeFiles, sizes, sha256, put } from '../scripts/lib.mjs';

const statePath = 'test-results/mozilla-source-work.json';
const sourceZip = 'dist/source/elec-training-qualification-checker-firefox-v1.0.0-source.zip';
const reference = 'dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0.zip';
const inputs = [...runtimeFiles.map(f => `src/${f}`), 'manifests/firefox.json', 'src/assets/logo.png', ...sizes.map(s => `src/assets/icons/icon-${s}.png`)];
const extra = ['package.json', 'package-lock.json', 'scripts/firefox-reproduce.mjs', 'scripts/lib.mjs', 'scripts/production-content.mjs', 'reproduction.json', 'REVIEWER-BUILD.md', 'RIGHTS.md', 'LICENSES/fflate.txt'];
const inventory = [...inputs, ...extra].sort();
const command = process.argv[2];

if (command === 'stage') {
  const stage = await mkdtemp(path.join(os.tmpdir(), 'elec-mozilla-source-'));
  const write = async (name, bytes) => { const target = path.join(stage, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes); };
  const submitted = await readFile(path.join(root, reference));
  const recorded = (await json('release-status.json')).candidatePackages.find(a => a.path.includes('-firefox-'));
  assert.equal(sha256(submitted), recorded.sha256);
  const inputSha256 = {};
  for (const name of inputs) { const bytes = await readFile(path.join(root, name)); inputSha256[name] = sha256(bytes); await write(name, bytes); }
  // Retain the original validators; omit unrelated release/account/private-record logic.
  const library = await read('scripts/lib.mjs');
  const minimalLibrary = library.slice(0, library.indexOf('export async function sourceDigest()')) + library.slice(library.indexOf('export function validatePopupSizing('));
  await write('scripts/lib.mjs', minimalLibrary.replace("export const targets = ['firefox', 'chromium'];", "export const targets = ['firefox'];"));
  const build = await read('scripts/build.mjs');
  const serializer = build.slice(build.indexOf('export function productionContent()'), build.indexOf('export async function build('));
  await write('scripts/production-content.mjs', "import { routes, links, copy } from '../src/data/qualification-routes.js';\n\n" + serializer);
  await write('scripts/firefox-reproduce.mjs', await read('reviewer/firefox-reproduce.mjs'));
  await write('package.json', JSON.stringify({ name: 'elec-training-firefox-reviewer-source', version: '1.0.0', private: true, type: 'module', license: 'UNLICENSED', engines: { node: '22.19.0', npm: '10.9.3' }, scripts: { build: 'node scripts/firefox-reproduce.mjs build', validate: 'node scripts/firefox-reproduce.mjs validate', package: 'node scripts/firefox-reproduce.mjs package', compare: 'node scripts/firefox-reproduce.mjs compare' }, devDependencies: { fflate: '0.8.3' } }, null, 2) + '\n');
  const reproducedZip = 'dist/elec-training-qualification-checker-firefox-v1.0.0.zip';
  const outputSha256 = Object.fromEntries(Object.entries(unzipSync(submitted)).sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => [name, sha256(bytes)]));
  await write('reproduction.json', JSON.stringify({ version: '1.0.0', firefoxId: 'qualification-checker@elec.training', referenceArtifact: path.basename(reference), submittedZipSha256: sha256(submitted), reproducedZip, inputSha256, outputSha256 }, null, 2) + '\n');
  await write('LICENSES/fflate.txt', await readFile(path.join(root, 'node_modules/fflate/LICENSE')));
  await write('RIGHTS.md', `# Rights and dependency notices\n\nThis archive is supplied for Mozilla source review and local reproduction. No first-party open-source license or copyright notice was present in the supplied repository. This reviewer archive does not grant a new general redistribution license or assign copyright ownership. First-party code and Elec Training artwork remain subject to their existing rights. The supplied logo/icons are used as the approved Elec Training branding.\n\nThe only npm dependency needed here is fflate 0.8.3, an MIT-licensed build-time ZIP library. Its complete notice is included in LICENSES/fflate.txt and installed with npm ci. No npm dependency is bundled in the extension runtime. Node/npm have their own upstream licenses. The UNLICENSED package metadata means this source archive is not offered under an open-source license; it does not describe the fflate license.\n`);
  await write('REVIEWER-BUILD.md', `# Firefox 1.0.0 reviewer reproduction\n\nThis source archive corresponds exactly to ${path.basename(reference)}, SHA256 ${sha256(submitted)}. It is a local release candidate; no submission or final manual-acceptance status is asserted.\n\n## Environment\n\nUse Node.js 22.19.0 and npm 10.9.3 (the npm version shipped with that Node release). Install Node from https://nodejs.org/en/download/archive/v22.19.0 and confirm with node --version and npm --version. Tested on Windows x64 with PowerShell. The scripts use portable Node filesystem APIs, no shell-specific build commands or native add-ons; other operating systems have not been tested for this handoff. No Firefox installation is needed to reproduce or validate the package.\n\n## Commands from the extracted archive root\n\n1. Clean dependency installation: npm ci --ignore-scripts --no-audit --no-fund\n2. Firefox production build: npm run build\n3. Validation: npm run validate\n4. Packaging: npm run package\n5. Hash comparison: npm run compare\n6. Optional direct byte comparison: node scripts/firefox-reproduce.mjs compare "PATH-TO-SUBMITTED-FIREFOX-ZIP"\n\nOutput: ${reproducedZip}. Build files: build/firefox/. The reference currently has the production filename in the release-candidate folder. It matches the previously recorded candidate hash; this reproduction does not change its acceptance status. Filenames outside the ZIP do not affect its bytes. Every generated file hash and the complete ZIP hash must match reproduction.json. No metadata, timestamp or hash differences are expected. ZIP entries are sorted, stored uncompressed with fflate 0.8.3, and use the fixed local calendar timestamp 2000-01-01 00:00:00. File permissions/host paths are not copied into the ZIP.\n\n## Build explanation\n\nOriginal src files, assets and the Firefox source manifest are byte-for-byte copies from the project. The production-content serializer is copied unchanged from the original build script. The validator module retains the original route, runtime-security, sizing, manifest, asset and package-allowlist checks; unrelated release/account approval machinery is omitted. The Firefox-only adapter uses the original copy/serialization/manifest ordering and ZIP options. It replaces the source manifest's temporary ID with qualification-checker@elec.training, adds the supplied icon mappings, and serializes display fields from readable qualification data while omitting internal review/state/uncertainty fields and the development notice. Popup source files and assets are copied without modification. No minifier, remote builder, transpiler or generated image service is used.\n\nThe focused package.json and npm-generated lockfile contain only the required ZIP dependency. Chromium tooling, browser-download tools and private approval records are not needed for reproduction and are excluded. The validation command checks source syntax/security, source input hashes, the 12-file runtime allowlist, all asset bytes and all expected output hashes. Packaging extracts its own archive and compares every entry before accepting the final ZIP hash. Hash checks supplement readable-source inspection; they do not replace it.\n\nInternet access is needed only for the initial npm dependency download (unless cached). No environment variables, credentials, private registries or external services are needed to build after installation. At runtime the extension needs no network services, credentials or environment variables: routes run locally, without storage/analytics or background requests. User-clicked links open the public Elec Training website separately. No dependency install hooks are required.\n\nSee RIGHTS.md and LICENSES/fflate.txt. This archive contains no browser binaries, node_modules, private chat evidence, approval records, other-browser artifacts or test screenshots.\n`);
  await put(statePath, JSON.stringify({ stage, sourceZip, reference, inventory }, null, 2) + '\n');
  console.log(`STAGE=${stage}`);
} else if (command === 'pack') {
  const state = await json(statePath);
  const entries = {};
  for (const name of inventory) {
    const bytes = await readFile(path.join(state.stage, name));
    if (/\.(md|txt|js|mjs|json)$/.test(name)) assert(!/backlink|written client chat|yes thats fine|use the existing one|client-authorization|publicationAuthorization|\.env\b/i.test(bytes.toString()), `Excluded private material in ${name}`);
    entries[name] = [new Uint8Array(bytes), { mtime: new Date(2000, 0, 1), level: 0 }];
  }
  const zipped = zipSync(entries);
  assert.deepEqual(Object.keys(unzipSync(zipped)).sort(), inventory);
  await put(sourceZip, zipped);
  const extraction = await mkdtemp(path.join(os.tmpdir(), 'elec-mozilla-clean-'));
  for (const [name, bytes] of Object.entries(unzipSync(zipped))) {
    const target = path.resolve(extraction, name);
    assert(target.startsWith(path.resolve(extraction) + path.sep));
    await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
  }
  await put(statePath, JSON.stringify({ ...state, extraction, sourceZipSha256: sha256(zipped), sourceZipBytes: zipped.length }, null, 2) + '\n');
  console.log(`SOURCE_ZIP=${sourceZip}\nCLEAN_EXTRACTION=${extraction}\nFILES=${inventory.length}`);
} else throw new Error('Use stage or pack');
