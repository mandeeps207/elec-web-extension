// Reproduce ONLY the already approved Safari input in a clean CI checkout.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { zipSync, unzipSync } from 'fflate';
import { productionContent } from './build.mjs';
import { sizes, runtimeFiles, sha256, validateBuild } from './lib.mjs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
export const inputHash = '4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88';
export const inputDir = 'build/generated/safari-input';
export async function prepareInput() {
  const contents = { 'manifest.json': await readFile('manifests/safari.json') };
  // Normalize source manifest formatting, not runtime content.
  contents['manifest.json'] = Buffer.from(JSON.stringify(JSON.parse(contents['manifest.json']), null, 2) + '\n');
  for (const file of runtimeFiles) contents[file] = file.startsWith('data/') ? Buffer.from(productionContent()) : await readFile(`src/${file}`);
  for (const file of ['assets/logo.png', ...sizes.map(s => `assets/icons/icon-${s}.png`)]) contents[file] = await readFile(`src/${file}`);
  const entries = Object.fromEntries(Object.keys(contents).sort().map(n => [n, [contents[n], { mtime: new Date(2000, 0, 1), level: 0 }]]));
  const zip = zipSync(entries);
  assert.equal(sha256(zip), inputHash, 'Safari input differs from approved ZIP; STOP');
  // Verify the hash before extraction, then reject unexpected paths.
  for (const [name, bytes] of Object.entries(unzipSync(zip))) {
    assert(Object.hasOwn(contents, name) && !name.includes('..') && !name.includes('\\'));
    await mkdir(`${inputDir}/${name.split('/').slice(0, -1).join('/')}`, { recursive: true });
    await writeFile(`${inputDir}/${name}`, bytes);
  }
  await validateBuild(inputDir, 'safari', true);
  await writeFile('build/generated/safari-input.zip', zip);
  console.log(`PASS: Safari CI input ${inputHash}`);
  return zip;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepareInput();
