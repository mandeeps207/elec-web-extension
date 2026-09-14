import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { zipSync, unzipSync } from 'fflate';
import { root, read, json, put, files, sizes, runtimeFiles, sha256, validateRoutes, validateManifest, auditRuntime, validateBuild } from './lib.mjs';
import { productionContent } from './production-content.mjs';

const directory = 'build/firefox';
const metadata = await json('reproduction.json');
const output = metadata.reproducedZip;

async function validateSources() {
  for (const [name, digest] of Object.entries(metadata.inputSha256)) {
    assert.equal(sha256(await readFile(path.join(root, name))), digest, `Changed reproduction input: ${name}`);
  }
  validateRoutes();
  validateManifest(await json('manifests/firefox.json'), 'firefox', '1.0.0');
  for (const file of runtimeFiles) auditRuntime(file, await read(`src/${file}`));
  for (const file of [...runtimeFiles.map(f => `src/${f}`), ...await files('scripts')].filter(f => f.endsWith('.js') || f.endsWith('.mjs'))) {
    const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
    assert.equal(result.status, 0, `Syntax error: ${file}`);
  }
}

async function build() {
  await validateSources();
  const absolute = path.resolve(root, directory);
  assert(absolute.startsWith(path.resolve(root, 'build') + path.sep));
  await rm(absolute, { recursive: true, force: true });
  for (const file of runtimeFiles) await put(`${directory}/${file}`, await read(`src/${file}`));
  const manifest = await json('manifests/firefox.json');
  manifest.icons = Object.fromEntries(sizes.map(size => [size, `assets/icons/icon-${size}.png`]));
  manifest.action.default_icon = { 16: manifest.icons[16], 32: manifest.icons[32] };
  manifest.browser_specific_settings.gecko.id = metadata.firefoxId;
  await put(`${directory}/data/qualification-routes.js`, productionContent());
  for (const name of ['logo.png', ...sizes.map(size => `icons/icon-${size}.png`)]) {
    await put(`${directory}/assets/${name}`, await readFile(path.join(root, 'src/assets', name)));
  }
  await put(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  await validate();
  console.log(`PASS: Firefox production build in ${directory}`);
}

async function validate() {
  await validateSources();
  const names = await validateBuild(directory, 'firefox', true);
  assert.deepEqual(names.sort(), Object.keys(metadata.outputSha256).sort());
  for (const name of names) assert.equal(sha256(await readFile(path.join(root, directory, name))), metadata.outputSha256[name], `Output differs: ${name}`);
  console.log('PASS: source syntax/security, production manifest/assets, 12-file allowlist and every expected output hash');
}

async function packageFirefox() {
  await validate();
  const entries = {};
  for (const name of await files(directory)) {
    entries[name.slice(directory.length + 1)] = [new Uint8Array(await readFile(path.join(root, name))), { mtime: new Date(2000, 0, 1), level: 0 }];
  }
  const zip = zipSync(entries);
  const extracted = unzipSync(zip);
  assert.deepEqual(Object.keys(extracted).sort(), Object.keys(metadata.outputSha256).sort());
  for (const [name, [bytes]] of Object.entries(entries)) assert.deepEqual(extracted[name], bytes);
  assert.equal(sha256(zip), metadata.submittedZipSha256, 'ZIP bytes differ from reference artifact');
  await put(output, zip);
  console.log(`PASS: ${output}\nSHA256 ${sha256(zip)}`);
}

const command = process.argv[2];
if (command === 'build') await build();
else if (command === 'validate') await validate();
else if (command === 'package') await packageFirefox();
else if (command === 'compare') {
  const bytes = await readFile(path.join(root, output));
  assert.equal(sha256(bytes), metadata.submittedZipSha256);
  if (process.argv[3]) assert.deepEqual(bytes, await readFile(path.resolve(process.argv[3])), 'Byte comparison failed');
  console.log(`PASS: reproduced ZIP matches expected SHA256${process.argv[3] ? ' and supplied artifact byte-for-byte' : ''}`);
} else throw new Error('Use build, validate, package, or compare [path-to-submitted-zip]');
