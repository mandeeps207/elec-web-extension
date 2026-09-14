import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { zipSync, unzipSync } from 'fflate';
import { build } from './build.mjs';
import { root, targets, files, put, json, requireRelease, validateBuild } from './lib.mjs';

export function archiveEntries(bytes) {
  const entries = unzipSync(bytes);
  assert(entries['manifest.json'], 'Manifest must be at archive root');
  assert(Object.keys(entries).every((name) => !name.includes('..') && !name.startsWith('/') && !name.includes('\\')));
  return entries;
}
function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  assert.equal(result.status, 0, `Required check failed: node ${args.join(' ')}`);
}
export async function packageBuild(release = false, candidate = false) {
  release ||= candidate;
  const mode = candidate ? 'release-candidate' : release ? 'release' : 'development';
  if (release) await requireRelease(candidate);
  await build(release, candidate);
  if (release) {
    runNode(['scripts/validate.mjs', candidate ? '--candidate' : '--release', '--built']);
    runNode(['scripts/syntax.mjs']);
    runNode(['--test', 'tests/core.test.mjs']);
    runNode(['node_modules/web-ext/bin/web-ext.js', 'lint', '--source-dir', `build/${mode}/firefox`, '--warnings-as-errors']);
    runNode(['scripts/browser-test.mjs', candidate ? '--candidate' : '--release']);
  }
  const version = (await json('package.json')).version;
  for (const target of targets) {
    const directory = `build/${mode}/${target}`;
    const expected = await validateBuild(directory, target, release);
    const entries = {};
    for (const name of await files(directory)) {
      entries[name.slice(directory.length + 1)] = [new Uint8Array(await readFile(path.join(root, name))), { mtime: new Date(2000, 0, 1), level: 0 }];
    }
    const zip = zipSync(entries);
    const unpacked = archiveEntries(zip);
    assert.deepEqual(Object.keys(unpacked).sort(), expected.sort());
    for (const [name, [bytes]] of Object.entries(entries)) assert.deepEqual(unpacked[name], bytes);
    const filename = `dist/${candidate ? 'release-candidate/' : release ? '' : 'development/'}elec-training-qualification-checker-${target}-v${version}${candidate ? '-release-candidate' : release ? '' : '-development'}.zip`;
    await put(filename, zip);
    console.log(`Packaged and verified ${filename}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  packageBuild(process.argv.includes('--release'), process.argv.includes('--candidate')).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
