import test from 'node:test';
import assert from 'node:assert/strict';
import { json } from '../scripts/lib.mjs';
import { packageSafari, validateSafariManifest, submittedPackages } from '../scripts/safari.mjs';

test('Safari rejects foreign manifest capabilities, versions and remote CSP', async () => {
  const manifest = await json('manifests/safari.json');
  validateSafariManifest(manifest);
  for (const key of ['browser_specific_settings', 'key', 'update_url', 'permissions', 'host_permissions', 'background', 'content_scripts', 'externally_connectable']) assert.throws(() => validateSafariManifest({ ...manifest, [key]: {} }));
  assert.throws(() => validateSafariManifest({ ...manifest, version: '1.0.1' }));
  assert.throws(() => validateSafariManifest({ ...manifest, content_security_policy: { extension_pages: "script-src https://example.org" } }));
});
test('Safari ZIP deterministic and submitted Firefox/Chromium artifacts unchanged', async () => {
  const before = await submittedPackages();
  const first = await packageSafari();
  const second = await packageSafari();
  assert.deepEqual(first, second);
  assert.deepEqual(await submittedPackages(), before);
});
