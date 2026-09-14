import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { routes, links } from '../src/data/qualification-routes.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const sizes = [16, 32, 48, 64, 96, 128];
export const targets = ['firefox', 'chromium'];
export const popupWidth = 380;
export const runtimeFiles = ['popup/popup.html', 'popup/popup.css', 'popup/popup.js', 'data/qualification-routes.js'];
export const read = (file) => readFile(path.join(root, file), 'utf8');
export const json = async (file) => JSON.parse(await read(file));
export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
export async function put(file, data) {
  const full = path.join(root, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}
export async function files(directory) {
  const result = [];
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Symlink prohibited: ${directory}/${entry.name}`);
    const name = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(name));
    else result.push(name);
  }
  return result.sort();
}
export function cleanUrl(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'elec.training');
  assert.equal(url.username + url.password + url.port + url.search + url.hash, '');
}
export function validateRoutes(data = routes) {
  assert.equal(data.length, 5);
  assert.deepEqual(data.map((r) => r.id).sort(), ['experienced', 'level-2', 'level-3', 'new', 'site-experience']);
  assert.equal(new Set(data.map((r) => r.label)).size, 5);
  assert.deepEqual(data.map((r) => r.label), ['I’m completely new', 'I’ve completed Level 2', 'I’ve completed Level 3', 'I’m currently gaining site experience', 'I’m an experienced electrician']);
  for (const route of data) {
    assert(['draft', 'resolved', 'unresolved'].includes(route.state));
    assert(route.intro.trim().length > 15);
    assert(route.steps.length > 0 || route.state === 'unresolved');
    for (const step of route.steps) assert(step.title.trim().length > 3 && step.explanation.trim().length > 15);
    assert(route.caveats.length > 0);
    assert(route.sources.length > 0);
    route.sources.forEach(cleanUrl);
    assert(['unapproved', 'approved'].includes(route.review.status));
    assert(/^\d{4}-\d{2}-\d{2}$/.test(route.review.lastReviewed));
  }
  links.forEach((link) => cleanUrl(link.url));
}
export function validateManifest(manifest, target, version) {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, version);
  assert.equal(manifest.action.default_popup, 'popup/popup.html');
  cleanUrl(manifest.homepage_url);
  const allowed = ['manifest_version', 'version', 'name', 'description', 'homepage_url', 'action', 'content_security_policy', 'icons'];
  if (target === 'firefox') allowed.push('browser_specific_settings');
  assert(Object.keys(manifest).every((key) => allowed.includes(key)), 'Unexpected manifest capability or field');
  assert.deepEqual(Object.keys(manifest.action).sort(), (manifest.action.default_icon ? ['default_icon', 'default_popup', 'default_title'] : ['default_popup', 'default_title']));
  assert.equal(manifest.content_security_policy.extension_pages, "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
  if (target === 'firefox') {
    assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions, { required: ['none'] });
    assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, '142.0');
    assert(manifest.name.length <= 45, 'Firefox name must be at most 45 characters');
    assert(manifest.browser_specific_settings.gecko.id);
  }
}
export async function sourceDigest() {
  const names = ['package.json', 'package-lock.json'];
  for (const dir of ['src', 'manifests', 'scripts', 'tests', 'store-listings', 'privacy']) names.push(...await files(dir));
  const hash = createHash('sha256');
  for (const name of names.sort()) { hash.update(name); hash.update(await readFile(path.join(root, name))); }
  return hash.digest('hex');
}
export async function releaseErrors(status, data = routes) {
  status ??= await json('release-status.json');
  const errors = [];
  for (const route of data) {
    if (route.review.status !== 'approved' || route.review.approvedBy !== 'Charanjit' || !/^\d{4}-\d{2}-\d{2}$/.test(route.review.approvedOn ?? '') || route.state !== 'resolved') errors.push(`Route ${route.id} requires Charanjit approval and resolution`);
  }
  for (const key of ['briefReviewed', 'officialBrandingApproved', 'screenshotsApproved', 'listingsApproved']) if (status[key] !== true) errors.push(`${key} is not confirmed`);
  if (!status.assetProvenance) errors.push('Official asset provenance is missing');
  for (const key of ['supportUrl', 'privacyUrl']) { try { cleanUrl(status[key]); } catch { errors.push(`${key} must be a confirmed clean Elec Training HTTPS URL`); } }
  if (!status.firefoxId || /invalid|placeholder|development/i.test(status.firefoxId) || !/^[^\s@]+@[^\s@]+$/.test(status.firefoxId)) errors.push('Confirm a permanent Firefox extension ID');
  for (const browser of ['firefox', 'chrome', 'edge', 'opera']) if (status.manualBrowsers?.[browser] !== true) errors.push(`Manual ${browser} test is not confirmed`);
  if (!status.charanjitSignOff) errors.push('Final Charanjit sign-off evidence is missing');
  if (status.approvedContentSha256 !== sha256(await read('src/data/qualification-routes.js'))) errors.push('Approved content hash is missing or stale');
  if (!status.validationEvidence || status.validatedSourceSha256 !== await sourceDigest()) errors.push('Validation evidence/source hash is missing or stale');
  for (const name of ['logo.png', ...sizes.map((size) => `icons/icon-${size}.png`)]) {
    const file = `src/assets/${name}`;
    try {
      const bytes = await readFile(path.join(root, file));
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      if (name.startsWith('icons/')) {
        const size = Number(name.match(/\d+/)[0]);
        assert.equal(bytes.readUInt32BE(16), size);
        assert.equal(bytes.readUInt32BE(20), size);
        assert(!bytes.equals(developmentIcon(size)), 'Development icon is not an official asset');
      }
      assert.equal(status.assetHashes?.[name], sha256(bytes));
    } catch { errors.push(`Missing, invalid or unapproved official PNG: ${file}`); }
  }
  return errors;
}
export async function requireRelease() {
  const errors = await releaseErrors();
  if (errors.length) throw new Error(`Release blocked:\n- ${errors.join('\n- ')}`);
}
export function validatePopupSizing(css) {
  // Intentionally narrow policy for this small, plain stylesheet. Require one
  // unconditional root sizing block; forbid later/media-query sizing overrides.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const sizing = /(?:^|;)\s*(?:width|min-width|max-width|inline-size|min-inline-size|max-inline-size)\s*:/i;
  let rootBlock = 0;
  for (const [, selector, declarations] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/(?:\bhtml\b|\bbody\b|:root|^\s*\*\s*(?:,|$))/.test(selector) || !sizing.test(declarations)) continue;
    assert.equal(selector.trim(), 'html, body', 'Root sizing must use the shared explicit html, body rule');
    assert.equal(++rootBlock, 1, 'Root sizing must not be overridden');
    assert.equal(declarations.replace(/\s+/g, ' ').trim(), `width: ${popupWidth}px; min-width: ${popupWidth}px; margin: 0;`, 'Popup roots need fixed pixel width/min-width, without viewport or percentage caps');
  }
  assert.equal(rootBlock, 1, 'Missing explicit safe root popup width');
  // A root block nested inside a media/support rule is not unconditional.
  const prefix = clean.slice(0, clean.indexOf('html, body'));
  assert.equal((prefix.match(/\{/g) ?? []).length, (prefix.match(/\}/g) ?? []).length, 'Root width must be unconditional');
  assert(!/overflow-x\s*:\s*(?:hidden|clip)/i.test(clean), 'Do not hide horizontal overflow');
  assert(!/overflow-wrap\s*:\s*anywhere|word-break\s*:\s*break-all/i.test(clean), 'Preserve normal word wrapping');
}
export function auditRuntime(name, text) {
  if (!/\.(?:js|html|css)$/.test(name)) return;
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|eval)\b|\bnew\s+Function\b|\.innerHTML\b|\.outerHTML\b|document\.write\b/.test(text), `Unsafe runtime API in ${name}`);
  assert(!/\b(?:chrome|browser)\s*\./.test(text), `Unexpected extension API in ${name}`);
  if (name.endsWith('.html')) {
    const scripts = [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0][1].trim(), 'type="module" src="popup.js"');
    assert.equal(scripts[0][2].trim(), '');
    assert(!/\son\w+\s*=|javascript:|<iframe|<object|<embed|<form/i.test(text));
    assert(!/(?:src|href)\s*=\s*["'](?:https?:|\/\/|data:)/i.test(text));
  }
  if (name.endsWith('.css')) {
    assert(!/@import|url\s*\(/i.test(text));
    if (name.endsWith('popup.css')) validatePopupSizing(text);
  }
  if (name.endsWith('.js')) assert(!/\bimport\s*\(|from\s*['"](?:https?:|\/\/)|importScripts/.test(text));
}
export async function validateBuild(directory, target, release = false) {
  const manifest = await json(`${directory}/manifest.json`);
  validateManifest(manifest, target, (await json('package.json')).version);
  const expected = ['manifest.json', ...runtimeFiles, ...sizes.map((size) => `assets/icons/icon-${size}.png`)];
  if (release) expected.push('assets/logo.png');
  const actual = (await files(directory)).map((name) => name.slice(directory.length + 1));
  assert.deepEqual(actual.sort(), expected.sort(), 'Unexpected/missing package files');
  for (const [size, name] of Object.entries(manifest.icons)) {
    assert.equal(name, `assets/icons/icon-${size}.png`);
    const bytes = await readFile(path.join(root, directory, name));
    assert.equal(bytes.readUInt32BE(16), Number(size));
    assert.equal(bytes.readUInt32BE(20), Number(size));
    if (release) assert(!bytes.equals(developmentIcon(Number(size))));
  }
  assert.deepEqual(Object.keys(manifest.icons).map(Number).sort((a, b) => a - b), sizes);
  assert.deepEqual(manifest.action.default_icon, { 16: manifest.icons[16], 32: manifest.icons[32] });
  for (const file of runtimeFiles) auditRuntime(file, await read(`${directory}/${file}`));
  const html = await read(`${directory}/popup/popup.html`);
  if (release) {
    assert(!/placeholder|development branding/i.test(html));
    assert(!/development/i.test(manifest.name));
    const content = await read(`${directory}/data/qualification-routes.js`);
    assert(!/unapproved|"state": "draft"|"state": "unresolved"/.test(content));
  } else assert(manifest.name.startsWith('[DEV] '));
  return actual;
}

// A deliberately plain DEV bitmap, not an approximation of the company logo.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const header = Buffer.alloc(4); header.writeUInt32BE(data.length);
  const footer = Buffer.alloc(4); footer.writeUInt32BE(crc32(body));
  return Buffer.concat([header, body, footer]);
}
export function developmentIcon(size) {
  const glyph = ['11001110101', '10101000101', '10101110101', '10101000101', '11001110010'];
  const pixels = Buffer.alloc(size * (size * 4 + 1));
  const scale = Math.max(1, Math.floor(size / 14));
  const left = Math.floor((size - 11 * scale) / 2), top = Math.floor((size - 5 * scale) / 2);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = Math.floor((x - left) / scale), gy = Math.floor((y - top) / scale);
    const foreground = glyph[gy]?.[gx] === '1';
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels.set(foreground ? [255, 255, 255, 255] : [72, 72, 72, 255], offset);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
