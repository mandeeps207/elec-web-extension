import path from 'node:path';
import { rm, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { root, targets, sizes, runtimeFiles, read, json, put, requireRelease, validateRoutes, validateBuild } from './lib.mjs';
import { routes, links, copy } from '../src/data/qualification-routes.js';

// Only display data enters production. Approval records stay in the repository.
// The caller must pass requireRelease before writing any production output.
export function productionContent() {
  const { notice, draft, unresolvedHeading, resultHeading, ...text } = copy;
  const content = routes.map(({ id, label, heading, intro, steps, caveats, sources }) => ({ id, label, heading, intro, steps, caveats, sources }));
  return `export const links = ${JSON.stringify(links, null, 2)};\nexport const copy = ${JSON.stringify(text, null, 2)};\nexport const routes = ${JSON.stringify(content, null, 2)};\n`;
}

export async function build(release = false, candidate = false) {
  release ||= candidate;
  validateRoutes();
  if (release) await requireRelease(candidate);
  const mode = candidate ? 'release-candidate' : release ? 'release' : 'development';
  for (const target of targets) {
    const directory = `build/${mode}/${target}`;
    const absolute = path.resolve(root, directory);
    // Only this fixed generated directory may be removed, never a supplied path.
    if (!absolute.startsWith(path.resolve(root, 'build') + path.sep)) throw new Error('Unsafe build path');
    await rm(absolute, { recursive: true, force: true });
    for (const file of runtimeFiles) await put(`${directory}/${file}`, await read(`src/${file}`));
    const manifest = await json(`manifests/${target}.json`);
    manifest.icons = Object.fromEntries(sizes.map((size) => [size, `assets/icons/icon-${size}.png`]));
    manifest.action.default_icon = { 16: manifest.icons[16], 32: manifest.icons[32] };
    if (!release) {
      manifest.name = `[DEV] ${manifest.name}`;
      manifest.action.default_title = '[DEV] Elec Training — development preview';
    } else {
      const status = await json('release-status.json');
      if (target === 'firefox') manifest.browser_specific_settings.gecko.id = status.firefoxId;
      await put(`${directory}/data/qualification-routes.js`, productionContent());
    }
    await put(`${directory}/assets/logo.png`, await readFile(path.join(root, 'src/assets/logo.png')));
    for (const size of sizes) await put(`${directory}/assets/icons/icon-${size}.png`, await readFile(path.join(root, `src/assets/icons/icon-${size}.png`)));
    await put(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
    await validateBuild(directory, target, release);
    console.log(`Built ${directory}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build(process.argv.includes('--release'), process.argv.includes('--candidate')).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
