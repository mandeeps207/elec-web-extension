import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { APP, EXT, VERSION, buildNumber, checkEntitlements, checkProfile, requireApproval, converterHelp, commandJson, command, correctTargetIdentifiers, verifyResolvedIdentifiers, TEAM, SKU, APPLE_ID, selectAppScheme, correctNativeIdentifier, importSigningIdentities, apiPrivateKey } from '../scripts/apple-ci.mjs';
import { prepareInput, inputHash } from '../scripts/apple-input.mjs';
// js-yaml is already pinned by package-lock.json through web-ext's dependency tree.
const { load } = createRequire(import.meta.url)('js-yaml');
const read = p => fs.readFileSync(p, 'utf8');

test('Registered Apple identity is assigned by product type to every configuration and compared case-sensitively', () => {
  assert.equal(TEAM, '3XPCC2X77K');
  assert.equal(SKU, 'ELEC-QUAL-CHECKER-MAC-002');
  assert.equal(APPLE_ID, '6812432163');
  const data = { objects: {} };
  const types = ['com.apple.product-type.application', 'com.apple.product-type.app-extension'];
  for (const [i, type] of types.entries()) {
    data.objects['t'+i] = { isa: 'PBXNativeTarget', productType: type, name: 'Misleading identical display name', buildConfigurationList: 'list'+i };
    data.objects['list'+i] = { buildConfigurations: ['Debug'+i, 'Release'+i, 'Custom'+i] };
    for (const name of ['Debug', 'Release', 'Custom']) data.objects[name+i] = { name, buildSettings: { PRODUCT_BUNDLE_IDENTIFIER: 'wrong', 'PRODUCT_BUNDLE_IDENTIFIER[sdk=macosx*]': 'wrong' } };
  }
  correctTargetIdentifiers(data);
  for (const [i, bundle] of [APP, EXT].entries()) for (const name of ['Debug', 'Release', 'Custom']) {
    const b = data.objects[name+i].buildSettings;
    assert.equal(b.PRODUCT_BUNDLE_IDENTIFIER, bundle);
    assert.equal(b['PRODUCT_BUNDLE_IDENTIFIER[sdk=macosx*]'], bundle);
    assert.equal(b.DEVELOPMENT_TEAM, TEAM);
  }
  const rows = types.map((productType, i) => ({ productType, bundle: [APP, EXT][i] }));
  verifyResolvedIdentifiers(rows);
  assert.throws(() => verifyResolvedIdentifiers([rows[0], { ...rows[1], bundle: EXT.replace('.extension', '.Extension') }]));
  assert.throws(() => verifyResolvedIdentifiers([rows[0], { ...rows[1], bundle: APP }]));
});

test('JSON commands parse stdout alone; stderr diagnostics never corrupt structured output', () => {
  const run = () => ({ status: 0, stdout: '[{"target":"App"}]\n', stderr: 'xcodebuild: WARNING: destination diagnostic\n' });
  assert.deepEqual(commandJson('settings', ['xcodebuild'], { run }), [{ target: 'App' }]);
  assert(command('text output', ['tool'], { run }).includes('WARNING'));
  assert.throws(() => commandJson('settings', ['tool'], { run: () => ({ status: 1, stdout: '{}', stderr: 'error' }) }), /failed/);
  assert.throws(() => commandJson('settings', ['tool'], { run: () => ({ status: 0, stdout: '{} trailing', stderr: '' }) }), SyntaxError);
});

test('Converter help accepts validated usage output on 64 and preserves failed probe evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elec-converter-help-'));
  const help = '--project-location --app-name --bundle-identifier --macos-only --copy-resources --no-open --no-prompt --swift';
  for (const status of [0, 64]) {
    assert.equal(converterHelp(dir, (tool, args) => {
      assert.equal(tool, 'xcrun');
      assert.deepEqual(args, ['safari-web-extension-converter', '--help']);
      return { status, stdout: '', stderr: help };
    }), help);
  }
  assert.throws(() => converterHelp(dir, () => ({ status: 64, stderr: 'Unknown command' })), /lacks/);
  assert.equal(read(path.join(dir, 'converter-help.txt')), 'Unknown command');
  assert.equal(JSON.parse(read(path.join(dir, 'converter-help-status.json'))).exitCode, 64);
  assert.throws(() => converterHelp(dir, () => ({ status: 72, stderr: help })), /help failed/);
  assert.throws(() => converterHelp(dir, () => ({ status: null, error: { code: 'ENOENT' } })), /help failed/);
});

test('Apple workflows dispatch only; unsigned has no secrets; upload defaults off behind protected signed job', () => {
  const diagnostic = load(read('.github/workflows/safari-diagnostic.yml'));
  const signed = load(read('.github/workflows/safari-app-store.yml'));
  for (const w of [diagnostic, signed]) {
    assert.deepEqual(Object.keys(w.on), ['workflow_dispatch']);
    assert.deepEqual(w.permissions, { contents: 'read' });
    for (const job of Object.values(w.jobs)) {
      assert.equal(job['runs-on'], 'macos-15');
      assert.equal(job.env.DEVELOPER_DIR, '/Applications/Xcode_26.3.app/Contents/Developer');
      for (const step of job.steps.filter(s => s.uses)) assert(/@[a-f0-9]{40}$/.test(step.uses));
      assert(job.steps.find(s => s.uses?.startsWith('actions/checkout@')).with['persist-credentials'] === false);
    }
  }
  assert(!read('.github/workflows/safari-diagnostic.yml').includes('secrets.'));
  assert.equal(signed.on.workflow_dispatch.inputs.upload_to_app_store.default, false);
  const job = signed.jobs.signed;
  assert.equal(job.environment, 'apple-production');
  const upload = job.steps.find(s => s.run?.includes('apple-ci.mjs upload'));
  assert.equal(upload.if, '${{ false && inputs.upload_to_app_store == true }}');
  assert(job.steps.find(s => s.run?.includes('apple-ci.mjs cleanup')).if === 'always()');
  const secretStep = job.steps.findIndex(s => s.env?.APPLE_DISTRIBUTION_P12_BASE64);
  assert(secretStep > job.steps.findIndex(s => s.run?.includes('diagnostic --approved')));
  for (const step of job.steps.filter(s => s.uses?.startsWith('actions/upload-artifact@'))) {
    assert.equal(step.if, 'success()');
    assert(step.with['retention-days'] <= 3);
    assert(step.with.path.split('\n').filter(Boolean).every(p => /^build\/apple-artifacts\/(diagnostic|signed)\/\*$/.test(p)));
  }
});
test('Apple identifiers, build numbers, encryption and signature assertions stay explicit', () => {
  assert.equal(APP, 'training.elec.qualification.checker');
  assert.equal(EXT, APP + '.extension');
  assert.equal(VERSION, '1.0.0');
  assert.equal(buildNumber('', '45', '2'), '45.2');
  for (const bad of ['0', '1;echo secret', '10000', '1.100', '1.0.0.1', '01', '-3']) assert.throws(() => buildNumber(bad));
  const src = read('scripts/apple-ci.mjs');
  for (const required of ['ITSAppUsesNonExemptEncryption = false', 'info.ITSAppUsesNonExemptEncryption, false', "'codesign', '--verify', '--deep', '--strict'", "'Contents/PlugIns'", "'com.apple.Safari.web-extension'", "'installerSigningCertificate'", "method: 'app-store-connect'", "'pkgutil', '--check-signature'", "'pkgutil', '--expand-full'"]) assert(src.includes(required), required);
  assert(!src.includes('allowProvisioningUpdates'));
  assert(src.includes('finally { cleanup(); }'));
  assert(src.includes("'delete-keychain'"));
  assert(src.includes('Resolved Bundle ID differs'));
  assert(src.includes('help.includes(flag)'));
});
test('Unreviewed conversion blocks signing; no fabricated approval', () => {
  assert.throws(() => requireApproval(undefined, { approved: false }), /Phase 1 has not been reviewed/);
  const approved = { approved: true, runUrl: 'https://github.com/example/repo/actions/runs/123', reviewedBy: 'Synthetic test reviewer', fingerprint: 'a'.repeat(64) };
  requireApproval({ fingerprint: approved.fingerprint }, approved);
  assert.throws(() => requireApproval({ fingerprint: 'b'.repeat(64) }, approved), /differs from reviewed/);
});
test('Entitlements reject network, storage, groups and debug capability', () => {
  const sandbox = { 'com.apple.security.app-sandbox': true };
  checkEntitlements(sandbox, APP);
  for (const key of ['com.apple.security.network.client', 'com.apple.security.network.server', 'com.apple.security.application-groups', 'com.apple.security.get-task-allow', 'keychain-access-groups']) assert.throws(() => checkEntitlements({ ...sandbox, [key]: true }, APP));
  assert.throws(() => checkEntitlements({ 'com.apple.security.app-sandbox': false }, APP));
  assert.throws(() => checkEntitlements({ ...sandbox, 'com.apple.application-identifier': 'OTHER.' + APP }, APP, 'TEAM000001', true));
});
test('Distribution profile rejects wrong bundle/team/certificate, wildcard, expiry and development profiles', () => {
  const team = 'TEAM000001', cert = Buffer.from('synthetic-test-certificate');
  const identity = createHash('sha1').update(cert).digest('hex').toUpperCase();
  const p = { TeamIdentifier: [team], Platform: ['OSX'], ExpirationDate: '2099-01-01T00:00:00Z', UUID: '11111111-1111-1111-1111-111111111111', DeveloperCertificates: [cert.toString('base64')], Entitlements: { 'com.apple.application-identifier': team + '.' + APP, 'com.apple.developer.team-identifier': team, 'beta-reports-active': true } };
  checkProfile(p, APP, team, identity);
  for (const patch of [{ TeamIdentifier: ['OTHER'] }, { ExpirationDate: '2000-01-01' }, { ProvisionedDevices: ['device'] }, { ProvisionsAllDevices: true }, { DeveloperCertificates: [] }, { Platform: ['iOS'] }]) assert.throws(() => checkProfile({ ...p, ...patch }, APP, team, identity));
  for (const patch of [{ 'com.apple.application-identifier': team + '.*' }, { 'get-task-allow': true }, { 'beta-reports-active': false }]) assert.throws(() => checkProfile({ ...p, Entitlements: { ...p.Entitlements, ...patch } }, APP, team, identity));
});
test('CI rebuild of hash-locked input does not require or modify ignored submitted ZIPs', async () => {
  const paths = ['dist/release-candidate/elec-training-qualification-checker-firefox-v1.0.0.zip', 'dist/release-candidate/elec-training-qualification-checker-chromium-v1.0.0.zip', 'dist/opera/elec-training-qualification-checker-opera-v1.0.0.zip', 'dist/safari/elec-training-qualification-checker-safari-v1.0.0-packager-input.zip'];
  const before = paths.filter(p => fs.existsSync(p)).map(p => [p, fs.readFileSync(p)]);
  const zip = await prepareInput();
  assert.equal(createHash('sha256').update(zip).digest('hex'), inputHash);
  for (const [p, bytes] of before) assert.deepEqual(fs.readFileSync(p), bytes);
});
test('Tracked/unignored candidate files contain no credential files or private key material', () => {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  for (const name of r.stdout.split('\0').filter(Boolean)) {
    assert(!/\.(?:p12|p8|pem|key|mobileprovision|provisionprofile|keychain(?:-db)?)$|(?:^|\/)\.env(?:\.|$)/i.test(name), `Credential path: ${name}`);
    if (!fs.existsSync(name) || !/\.(?:md|mjs|js|json|yml|html|css|txt)$/.test(name)) continue;
    const text = read(name);
    assert(!new RegExp('-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\\r\\n]+[A-Za-z0-9+/=]{20}').test(text), `Private key material: ${name}`);
  }
});

 test('App scheme need not enumerate its embedded extension dependency', () => {
 const p={app:{name:'App',dependencies:['dep'],buildPhases:['embed']},ext:{id:'ext',productReference:'product'},data:{objects:{dep:{target:'ext'},embed:{isa:'PBXCopyFilesBuildPhase',dstSubfolderSpec:13,files:['file']},file:{fileRef:'product'}}}};
 const candidates=[{name:'App scheme',settings:[{target:'App',buildSettings:{PRODUCT_TYPE:'com.apple.product-type.application'}}]},{name:'Extension scheme',settings:[{target:'Extension',buildSettings:{PRODUCT_TYPE:'com.apple.product-type.app-extension'}}]}];
 assert.equal(selectAppScheme(p,candidates),'App scheme');
 assert.throws(()=>selectAppScheme({...p,app:{...p.app,dependencies:[]}},candidates));
 assert.throws(()=>selectAppScheme({...p,app:{...p.app,buildPhases:[]}},candidates));
 });

test('Native Safari settings helper uses the exact corrected extension identifier', () => {
 assert.equal(correctNativeIdentifier('let extensionBundleIdentifier = "wrong.Extension"'), 'let extensionBundleIdentifier = "'+EXT+'"');
 assert.throws(()=>correctNativeIdentifier('no identifier'));
 assert.throws(()=>correctNativeIdentifier('let extensionBundleIdentifier = "a"; let extensionBundleIdentifier = "b"'));
});

test('Separate P12 imports use both exact secrets and distinct temporary files', () => {
 const decoded=[], imported=[];
 importSigningIdentities(file=>imported.push(file),(secret,file)=>{decoded.push([secret,file]);return file;});
 assert.deepEqual(decoded,[['APPLE_DISTRIBUTION_P12_BASE64','app-distribution.p12'],['APPLE_INSTALLER_DISTRIBUTION_P12_BASE64','installer-distribution.p12']]);
 assert.deepEqual(imported,decoded.map(v=>v[1]));
 const workflow=load(read('.github/workflows/safari-app-store.yml'));
 const env=workflow.jobs.signed.steps.find(s=>s.run==='node scripts/apple-ci.mjs signed').env;
 assert.deepEqual(Object.keys(env).sort(),['APPLE_TEAM_ID','APPLE_DISTRIBUTION_P12_BASE64','APPLE_INSTALLER_DISTRIBUTION_P12_BASE64','APPLE_CERTIFICATE_PASSWORD','APPLE_APP_PROVISION_PROFILE_BASE64','APPLE_EXTENSION_PROVISION_PROFILE_BASE64'].sort());
});
test('API key is original PEM, not Base64; invalid secret errors do not echo values', () => {
 const key=['-----BEGIN PRIVATE KEY-----','YWJjZA==','-----END PRIVATE KEY-----'].join('\n');
 assert.equal(apiPrivateKey(key),key);
 assert.throws(()=>apiPrivateKey(Buffer.from(key).toString('base64')),/original multiline P8/);
 assert.throws(()=>apiPrivateKey(undefined),/original multiline P8/);
});
