// macOS-only Apple tooling. No shell interpolation, automatic provisioning or review submission.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { installArtwork } from './apple-artwork.mjs';
import { restrictCapabilities, verifyCapabilities, forbiddenEntitlements, sourceHashes, pngAudit } from './apple-evidence.mjs';

export const TEAM = '3XPCC2X77K';
export const APP = 'training.elec.qualification.checker';
export const EXT = APP + '.extension';
export const SKU = 'ELEC-QUAL-CHECKER-MAC-002';
export const APPLE_ID = '6812432163';
export const VERSION = '1.0.0';
const INPUT_HASH = '4d8b5877385e29a3aa3136b9e9d8f7812d981be7811ca3704bba308efcbdcb88';
const base = path.resolve('build/generated/apple');
const output = path.resolve('build/apple-artifacts');
const privateDir = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'elec-apple-ci');
const keychain = path.join(privateDir, 'signing.keychain-db');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); };
const events = [];
let failedOperation = null;
export function converterHelp(directory, run = spawnSync) {
  const args = ['safari-web-extension-converter', '--help'];
  const result = run('xcrun', args, { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  const help = (result.stdout || '') + (result.stderr || '');
  // Help is an unsigned, secret-free probe. Preserve it even on failure.
  save(path.join(directory, 'converter-help.txt'), help);
  save(path.join(directory, 'converter-help-status.json'), { exitCode: result.status, signal: result.signal || null, launchError: result.error?.code || null });
  events.push({ operation: 'Converter help', exitCode: result.status });
  assert(!result.error && !result.signal && [0, 64].includes(result.status), 'Converter help failed; inspect converter-help.txt and converter-help-status.json');
  // Some Apple command-line help paths return EX_USAGE (64). The exit code alone
  // is insufficient: require the actual installed tool to advertise every flag.
  const flags = ['--project-location', '--app-name', '--bundle-identifier', '--macos-only', '--copy-resources', '--no-open', '--no-prompt', '--swift'];
  for (const flag of flags) assert(help.includes(flag), `Installed converter lacks ${flag}; inspect converter-help.txt`);
  return help;
}
export function command(label, args, { input, allowFailure = false, stdoutOnly = false, run = spawnSync } = {}) {
  const r = run(args[0], args.slice(1), { input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  // Never emit raw command arguments/stdout/stderr: signing tools can echo credentials/profiles.
  events.push({ operation: label, exitCode: r.status });
  if (r.status !== 0 && !allowFailure) {
    failedOperation = label;
    throw new Error(`${label} failed (exit ${r.status}); raw output withheld to protect signing material`);
  }
  return stdoutOnly ? (r.stdout || '') : (r.stdout || '') + (r.stderr || '');
}
export function commandJson(label, args, options = {}) {
  return JSON.parse(command(label, args, { ...options, stdoutOnly: true }));
}
function plist(file) { return commandJson('Read property list', ['plutil', '-convert', 'json', '-o', '-', file]); }
function profilePlist(file) {
  // Profile plists contain dates/data that plutil's JSON format cannot represent.
  const script = 'import plistlib,json,sys,datetime,base64\np=plistlib.load(open(sys.argv[1],"rb"))\nprint(json.dumps(p,default=lambda v:base64.b64encode(v).decode() if isinstance(v,bytes) else v.isoformat()+"Z" if isinstance(v,datetime.datetime) else str(v)))';
  return commandJson('Read profile privately', ['python3', '-c', script, file]);
}
function writePlist(file, value) {
  save(file, value);
  command('Write property list', ['plutil', '-convert', 'xml1', file]);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    assert(!e.isSymbolicLink(), 'Unexpected symlink in generated source');
    return e.isDirectory() ? walk(p) : [p];
  }).sort();
}
export function buildNumber(override = '', run = process.env.GITHUB_RUN_NUMBER, attempt = process.env.GITHUB_RUN_ATTEMPT) {
  const number = override || `${run}.${attempt}`;
  assert(/^[1-9]\d{0,3}(?:\.(?:0|[1-9]\d?)){0,2}$/.test(number), 'Build number must use Apple-compatible positive major (1-9999), minor/patch (0-99); set override if run counter exceeds limits');
  return number;
}
export function checkEntitlements(e, bundle, team, signed = false) {
  const allowed = ['com.apple.security.app-sandbox'];
  if (signed) allowed.push('com.apple.application-identifier', 'application-identifier', 'com.apple.developer.team-identifier');
  assert(Object.keys(e).every(k => allowed.includes(k)), 'Unexpected entitlement; inspect Phase 1 evidence before changing policy');
  assert.equal(e['com.apple.security.app-sandbox'], true, 'App sandbox is required');
  for (const k of ['com.apple.application-identifier', 'application-identifier']) if (k in e) assert.equal(e[k], `${team}.${bundle}`);
  if ('com.apple.developer.team-identifier' in e) assert.equal(e['com.apple.developer.team-identifier'], team);
}
export function checkProfile(p, bundle, team, identityHash) {
  assert.deepEqual(p.TeamIdentifier, [team]);
  assert(p.Platform?.some(v => ['OSX', 'macOS'].includes(v)), 'Not a macOS profile');
  assert(!p.ProvisionedDevices && !p.ProvisionsAllDevices, 'Development/ad-hoc/direct distribution profile rejected');
  assert(new Date(p.ExpirationDate) > new Date(), 'Expired provisioning profile');
  const e = p.Entitlements;
  assert.equal(e['com.apple.application-identifier'] || e['application-identifier'], `${team}.${bundle}`, 'Profile Bundle ID mismatch');
  assert(e['get-task-allow'] !== true && e['com.apple.security.get-task-allow'] !== true, 'Development profile rejected');
  assert.equal(e['com.apple.developer.team-identifier'], team);
  assert.equal(e['beta-reports-active'], true, 'Expected Mac App Store distribution profile');
  assert(p.DeveloperCertificates?.some(b64 => createHash('sha1').update(Buffer.from(b64, 'base64')).digest('hex').toUpperCase() === identityHash), 'Profile does not contain imported app distribution certificate');
  assert(/^[A-Fa-f0-9-]{36}$/.test(p.UUID), 'Invalid profile UUID');
}
export function requireApproval(report, a = readJson('ci/safari-diagnostic-approval.json')) {
  assert(a.approved === true && /^https:\/\/github\.com\/.+\/actions\/runs\/\d+$/.test(a.runUrl || '') && a.reviewedBy && /^[a-f0-9]{64}$/.test(a.fingerprint || ''), 'Phase 1 has not been reviewed; signing remains blocked');
  if (report) assert.equal(a.fingerprint, report.fingerprint, 'Generated structure/native code differs from reviewed Phase 1');
}
function projectData() {
  const projects = walk(base).filter(p => p.endsWith('.xcodeproj/project.pbxproj'));
  assert.equal(projects.length, 1, 'Expected exactly one generated Xcode project');
  const file = projects[0], data = plist(file), objects = data.objects;
  const targets = Object.entries(objects).filter(([, o]) => o.isa === 'PBXNativeTarget').map(([id, o]) => ({ id, ...o }));
  assert.equal(targets.length, 2, 'Expected precisely two native targets; stop on converter drift');
  const app = targets.find(t => t.productType === 'com.apple.product-type.application');
  const ext = targets.find(t => t.productType === 'com.apple.product-type.app-extension');
  assert(app && ext, 'Expected a containing application and embedded extension');
  return { file, project: path.dirname(file), data, targets, app, ext };
}
export function correctTargetIdentifiers(data) {
  const targets = Object.values(data.objects).filter(o => o.isa === 'PBXNativeTarget');
  assert.equal(targets.length, 2);
  for (const [type, bundle] of [['com.apple.product-type.application', APP], ['com.apple.product-type.app-extension', EXT]]) {
    const matches = targets.filter(t => t.productType === type);
    assert.equal(matches.length, 1, 'Each product type must identify exactly one target');
    const configs = data.objects[matches[0].buildConfigurationList].buildConfigurations.map(id => data.objects[id]);
    for (const name of ['Debug', 'Release']) assert(configs.some(c => c.name === name), `Missing ${name} configuration`);
    for (const c of configs) {
      for (const key of Object.keys(c.buildSettings)) if (key.startsWith('PRODUCT_BUNDLE_IDENTIFIER[')) c.buildSettings[key] = bundle;
      c.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = bundle;
      c.buildSettings.DEVELOPMENT_TEAM = TEAM;
      restrictCapabilities(c.buildSettings);
    }
  }
}
export function verifyResolvedIdentifiers(rows) {
  assert.equal(rows.length, 2);
  for (const [type, expected] of [['com.apple.product-type.application', APP], ['com.apple.product-type.app-extension', EXT]]) {
    const targets = rows.filter(r => r.productType === type);
    assert.equal(targets.length, 1);
    assert.equal(targets[0].bundle, expected, 'Resolved Bundle ID differs from the exact approved value');
  }
}
function xcodeArgs(p, scheme, configuration = 'Release') { return ['xcodebuild', '-project', p.project, '-scheme', scheme, '-configuration', configuration, '-destination', 'generic/platform=macOS']; }
function settings(p, scheme, configuration = 'Release') {
  // A scheme's settings need not enumerate dependency targets. Query each
  // product-type-identified target explicitly, including its configurations.
  return [p.app, p.ext].flatMap(target => commandJson('Inspect target build settings', ['xcodebuild', '-project', p.project, '-target', target.name, '-configuration', configuration, '-sdk', 'macosx', '-showBuildSettings', '-json']));
}
export function selectAppScheme(p, candidates) {
  const objects = p.data.objects;
  assert(p.app.dependencies.some(id => objects[id]?.target === p.ext.id), 'Containing app must depend on extension');
  assert(p.app.buildPhases.some(id => {
    const phase = objects[id];
    return phase?.isa === 'PBXCopyFilesBuildPhase' && Number(phase.dstSubfolderSpec) === 13 && phase.files.some(f => objects[f]?.fileRef === p.ext.productReference);
  }), 'Containing app must embed the extension product');
  const matches = candidates.filter(c => c.settings.some(row => row.buildSettings?.PRODUCT_TYPE === 'com.apple.product-type.application' && row.target === p.app.name));
  assert.equal(matches.length, 1, 'Expected exactly one containing-app scheme; inspect scheme-settings.json');
  return matches[0].name;
}
function topology(p, scheme, configuration = 'Release') {
  const result = settings(p, scheme, configuration).map(({ target, buildSettings: b }) => ({ target, configuration, bundle: b.PRODUCT_BUNDLE_IDENTIFIER, plist: b.INFOPLIST_FILE, entitlements: b.CODE_SIGN_ENTITLEMENTS, sandbox: b.ENABLE_APP_SANDBOX, network: b.ENABLE_OUTGOING_NETWORK_CONNECTIONS, userSelectedFiles: b.ENABLE_USER_SELECTED_FILES, platform: b.SUPPORTED_PLATFORMS, sdk: b.SDKROOT, productType: b.PRODUCT_TYPE, productName: b.FULL_PRODUCT_NAME, version: b.MARKETING_VERSION, buildNumber: b.CURRENT_PROJECT_VERSION }));
  return result.sort((a, b) => a.target.localeCompare(b.target));
}
function verifyResources(dir) {
  const manifests = walk(dir).filter(p => path.basename(p) === 'manifest.json');
  assert.equal(manifests.length, 1, 'Expected exactly one embedded WebExtension');
  const root = path.dirname(manifests[0]);
  const input = path.resolve('build/generated/safari-input');
  for (const source of walk(input)) assert.deepEqual(fs.readFileSync(path.join(root, path.relative(input, source))), fs.readFileSync(source), 'Approved WebExtension bytes changed');
  return root;
}
function safeGeneratedSource() {
  const deny = /\b(?:URLSession|NSURLConnection|CryptoKit|CommonCrypto|WKUserScript)\b|https?:\/\//;
  for (const f of walk(base).filter(p => /\.(swift|m|h)$/.test(p))) assert(!deny.test(fs.readFileSync(f, 'utf8')), 'Unexpected generated native networking/crypto; manual source review required');
}
export function correctNativeIdentifier(text) {
  const declaration = /let extensionBundleIdentifier\s*=\s*"[^"]+"/g;
  assert.equal([...text.matchAll(declaration)].length, 1, 'Expected one native Safari settings identifier declaration');
  return text.replace(declaration, `let extensionBundleIdentifier = "${EXT}"`);
}
function diagnostic() {
  assert.equal(process.platform, 'darwin', 'Apple converter requires macOS; not executed on Windows');
  assert(!fs.existsSync(base), 'Use a clean runner/generated directory');
  fs.mkdirSync(base, { recursive: true });
  const reportDir = path.join(output, 'diagnostic');
  fs.mkdirSync(reportDir, { recursive: true });
  const version = command('Xcode version', ['xcodebuild', '-version']).trim();
  assert.equal(version, 'Xcode 26.3\nBuild version 17C529', 'Pinned Xcode not installed; do not silently select another version');
  assert.equal(digest(fs.readFileSync('build/generated/safari-input.zip')), INPUT_HASH);
  const help = converterHelp(reportDir);
  command('Convert Safari resources', ['xcrun', 'safari-web-extension-converter', path.resolve('build/generated/safari-input'), '--project-location', base, '--app-name', 'UK Electrician Route Checker', '--bundle-identifier', APP, '--macos-only', '--copy-resources', '--no-open', '--no-prompt', '--swift']);
  // Preserve Apple's original generated source even when a suffix/structure check stops Phase 1.
  command('Snapshot converter output', ['tar', '-czf', path.join(reportDir, 'generated-project.tar.gz'), '-C', base, '.']);
  const p = projectData();
  const list = commandJson('List schemes', ['xcodebuild', '-list', '-json', '-project', p.project]);
  const schemes = list.project.schemes;
  const candidates = schemes.map(name => ({ name, settings: commandJson('Inspect scheme build settings', [...xcodeArgs(p, name), '-showBuildSettings', '-json']) }));
  save(path.join(reportDir, 'scheme-settings.json'), candidates);
  const scheme = selectAppScheme(p, candidates);
  const original = topology(p, scheme);
  save(path.join(reportDir, 'generated-structure.json'), { project: path.relative(base, p.project), schemes, selectedScheme: scheme, targets: original });
  correctTargetIdentifiers(p.data);
  for (const [target, expected] of [[p.app, APP], [p.ext, EXT]]) {
    const b = original.find(v => v.target === target.name);
    assert.equal(b.platform, 'macosx', 'Only macOS is permitted');
    assert(b.plist && !b.plist.includes('$'), 'Concrete Info.plist path required');
    const info = path.resolve(path.dirname(p.project), b.plist);
    assert(info.startsWith(base + path.sep));
    const value = plist(info);
    value.CFBundleIdentifier = '$(PRODUCT_BUNDLE_IDENTIFIER)';
    value.ITSAppUsesNonExemptEncryption = false;
    value.CFBundleShortVersionString = VERSION;
    value.CFBundleVersion = '$(CURRENT_PROJECT_VERSION)';
    writePlist(info, value);
    assert.equal(plist(info).ITSAppUsesNonExemptEncryption, false);
    if (b.entitlements) {
      const ent = path.resolve(path.dirname(p.project), b.entitlements);
      assert(ent.startsWith(base + path.sep));
      const entitlements = plist(ent);
      for (const key of forbiddenEntitlements) delete entitlements[key];
      checkEntitlements(entitlements, expected);
      writePlist(ent, entitlements);
    } else {
      // Xcode 26's observed template generates entitlements from build settings.
      assert.equal(b.sandbox, 'YES', 'Generated app sandbox must remain enabled');
    }
    const explicitEntitlements = path.join(path.dirname(info), 'ReviewedSandbox.entitlements');
    assert(!fs.existsSync(explicitEntitlements), 'Unexpected existing reviewed entitlement file');
    writePlist(explicitEntitlements, { 'com.apple.security.app-sandbox': true });
    checkEntitlements(plist(explicitEntitlements), expected);
    for (const id of p.data.objects[target.buildConfigurationList].buildConfigurations) {
      const settings = p.data.objects[id].buildSettings;
      settings.PRODUCT_BUNDLE_IDENTIFIER = expected;
      settings.MARKETING_VERSION = VERSION;
      settings.CURRENT_PROJECT_VERSION = buildNumber(process.env.BUILD_OVERRIDE || '', process.env.GITHUB_RUN_NUMBER || '1', process.env.GITHUB_RUN_ATTEMPT || '1');
      settings.SKIP_INSTALL = target === p.app ? 'NO' : 'YES';
      settings.CODE_SIGN_STYLE = 'Manual';
      settings.INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = 'NO';
      settings.ENABLE_APP_SANDBOX = 'YES';
      settings.CODE_SIGN_ENTITLEMENTS = path.relative(path.dirname(p.project), explicitEntitlements);
    }
  }
  writePlist(p.file, p.data);
  const controllers = walk(base).filter(f => f.endsWith('.swift') && /let extensionBundleIdentifier\s*=/.test(fs.readFileSync(f, 'utf8')));
  assert.equal(controllers.length, 1, 'Expected one containing-app Safari settings helper');
  save(controllers[0], correctNativeIdentifier(fs.readFileSync(controllers[0], 'utf8')));
  assert(fs.readFileSync(controllers[0], 'utf8').includes(`let extensionBundleIdentifier = "${EXT}"`));
  const corrected = Object.fromEntries(['Debug', 'Release'].map(c => [c, topology(p, scheme, c)]));
  for (const rows of Object.values(corrected)) verifyResolvedIdentifiers(rows);
  for (const c of ['Debug', 'Release']) for (const row of settings(p, scheme, c)) verifyCapabilities(row.buildSettings);
  save(path.join(reportDir, 'corrected-structure.json'), { project: path.relative(base, p.project), scheme, team: TEAM, containingBundleId: APP, extensionBundleId: EXT, sku: SKU, appleId: APPLE_ID, configurations: corrected });
  safeGeneratedSource();
  verifyResources(base);
  const nativeCatalogs = walk(base).filter(f => f.endsWith('AppIcon.appiconset/Contents.json'));
  assert.equal(nativeCatalogs.length, 1);
  const artworkAudit = installArtwork(nativeCatalogs[0]);
  const allEntries = Object.fromEntries(walk(base).map(f => [path.relative(base, f).split(path.sep).join('/'), fs.readFileSync(f)]));
  const nativeHashes = sourceHashes(allEntries, path.relative(base, p.file).split(path.sep).join('/'), p.data);
  const iconCatalogs = walk(base).filter(f => f.endsWith('AppIcon.appiconset/Contents.json'));
  assert.equal(iconCatalogs.length, 1);
  const catalog = readJson(iconCatalogs[0]);
  const slots = [];
  for (const entry of catalog.images) {
    assert.equal(entry.idiom, 'mac');
    assert(entry.filename && path.basename(entry.filename) === entry.filename);
    const [w,h] = entry.size.split('x').map(Number), scale = Number(entry.scale.replace('x',''));
    const audit = pngAudit(fs.readFileSync(path.join(path.dirname(iconCatalogs[0]), entry.filename)));
    assert.equal(w,h); assert.equal(audit.width,w*scale); assert.equal(audit.height,h*scale);
    assert(audit.visiblePixels === audit.width * audit.height && audit.transparentPixels === 0, 'Approved opaque full-canvas artwork required');
    slots.push({slot: `${entry.size}@${entry.scale}`, ...audit});
  }
  assert.deepEqual(slots.map(s=>s.slot).sort(), [16,32,128,256,512].flatMap(n=>[1,2].map(s=>`${n}x${n}@${s}x`)).sort());
  assert.deepEqual(slots, readJson('ci/safari-icon-baseline.json').slots, 'Generated icon pixels/padding differ from diagnostic baseline; inspect, do not silently accept or rescale');
  save(path.join(reportDir,'artwork-audit.json'), artworkAudit);
  const stableConfigurations = Object.fromEntries(Object.entries(corrected).map(([c, rows]) => [c, rows.map(({ buildNumber, ...row }) => row)]));
  const evidence = { xcode: version, converterHelpHash: digest(help), project: path.relative(base, p.project), scheme, configurations: stableConfigurations, nativeHashes, inputHash: INPUT_HASH, containingBundleId: APP, extensionBundleId: EXT, team: TEAM, sku: SKU, appleId: APPLE_ID };
  const report = { ...evidence, fingerprint: digest(JSON.stringify(evidence)), unsignedBuild: 'pending' };
  save(path.join(reportDir, 'diagnostic.json'), report);
  if (process.argv.includes('--approved')) requireApproval(report);
  command('Unsigned macOS build', [...xcodeArgs(p, scheme), '-derivedDataPath', path.join(base, 'DerivedData'), 'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO', 'build']);
  const productName = settings(p, scheme).find(v => v.target === p.app.name).buildSettings.FULL_PRODUCT_NAME;
  assert(productName?.endsWith('.app') && path.basename(productName) === productName, 'Unexpected app product name');
  const app = path.join(base, 'DerivedData/Build/Products/Release', productName);
  report.products = verifyProduct(app, false);
  const generatedEntitlements = walk(path.join(base,'DerivedData')).filter(f=>f.endsWith('.xcent'));
  for (const file of generatedEntitlements) {
    const entitlements = plist(file);
    for (const key of forbiddenEntitlements) assert(!Object.hasOwn(entitlements,key), 'Forbidden generated entitlement');
    assert.equal(entitlements['com.apple.security.app-sandbox'], true);
  }
  save(path.join(reportDir,'unsigned-entitlements.json'), { signingDisabled: true, explicitAppAndExtensionSandboxPlistsVerified: true, generatedXcent: generatedEntitlements.map(file=>({file:path.relative(base,file),entitlements:plist(file)})), signedArchiveAndExportChecks: 'Pending signed build; existing strict allowlist remains required' });
  report.resolvedConfigurations = corrected;
  report.unsignedBuild = 'PASS';
  save(path.join(reportDir, 'diagnostic.json'), report);
  // Project snapshot excludes DerivedData, build logs, profiles and credentials.
  command('Archive generated project', ['tar', '--exclude=DerivedData', '-czf', path.join(reportDir, 'generated-project.tar.gz'), '-C', base, '.']);
  save(path.join(base, 'state.json'), { scheme, appName: p.app.name, extensionName: p.ext.name });
  console.log('PASS: unsigned build and exact IDs; inspect diagnostic artifacts before authorizing signing');
}
function verifyProduct(app, signed, team) {
  assert(fs.existsSync(app), 'Containing app missing');
  const plugins = path.join(app, 'Contents/PlugIns');
  assert(fs.existsSync(plugins), 'Embedded .appex missing');
  const extensions = fs.readdirSync(plugins).filter(f => f.endsWith('.appex'));
  assert.equal(extensions.length, 1, 'Exactly one .appex required');
  const ext = path.join(plugins, extensions[0]);
  for (const [product, bundle] of [[app, APP], [ext, EXT]]) {
    const info = plist(path.join(product, 'Contents/Info.plist'));
    assert.equal(info.CFBundleIdentifier, bundle);
    assert.equal(info.CFBundleShortVersionString, VERSION);
    assert.equal(info.CFBundleVersion, buildNumber(process.env.BUILD_OVERRIDE || '', process.env.GITHUB_RUN_NUMBER || '1', process.env.GITHUB_RUN_ATTEMPT || '1'));
    assert.equal(info.ITSAppUsesNonExemptEncryption, false);
    if (product === ext) assert.equal(info.NSExtension?.NSExtensionPointIdentifier, 'com.apple.Safari.web-extension');
    if (signed) {
      command('Verify code signature', ['codesign', '--verify', '--deep', '--strict', product]);
      const meta = command('Inspect signing identity', ['codesign', '-dv', '--verbose=4', product]);
      assert(meta.includes(`TeamIdentifier=${team}`) && meta.includes('Authority=Apple Distribution:'), 'Wrong signing identity/team');
      const xml = command('Inspect signed entitlements', ['codesign', '-d', '--entitlements', ':-', product]);
      const start = xml.indexOf('<?xml'), end = xml.indexOf('</plist>') + 8;
      assert(start >= 0 && end > start);
      const ef = path.join(privateDir, 'signed-entitlements.plist');
      save(ef, xml.slice(start, end));
      checkEntitlements(plist(ef), bundle, team, true);
    }
  }
  verifyResources(ext);
  // Reject non-runtime private/development files; native templates are separately fingerprint-reviewed.
  for (const f of walk(app)) {
    assert(!/\.(?:p12|p8|pem|key|log|md)$|(?:^|[/\\])(?:node_modules|\.git|tests|internal|store-listings)(?:[/\\]|$)/i.test(f), 'Unexpected private/unrelated product file');
    if (/\.(?:html|css|js|json|strings)$/.test(f)) assert(!/\b(?:DEV|draft|placeholder|unapproved)\b|not for (?:public )?release|written client chat/i.test(fs.readFileSync(f, 'utf8')), 'Non-production/private presentation in generated product');
  }
  return { app: APP, extension: EXT, version: VERSION, encryption: false, signaturesVerified: signed };
}
function decodeSecret(name, filename) {
  assert(process.env[name], `Missing required secret ${name}`);
  assert(/^[A-Za-z0-9+/=\s]+$/.test(process.env[name]), `Invalid Base64 secret ${name}`);
  const dest = path.join(privateDir, filename);
  fs.writeFileSync(dest, Buffer.from(process.env[name], 'base64'), { mode: 0o600 });
  return dest;
}
export function importSigningIdentities(importFile, decode = decodeSecret) {
  for (const [name, filename] of [
    ['APPLE_DISTRIBUTION_P12_BASE64', 'app-distribution.p12'],
    ['APPLE_INSTALLER_DISTRIBUTION_P12_BASE64', 'installer-distribution.p12']
  ]) importFile(decode(name, filename));
}
export function apiPrivateKey(value) {
  assert(typeof value === 'string' && /^-----BEGIN PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]+\r?\n-----END PRIVATE KEY-----\s*$/.test(value), 'APPLE_API_PRIVATE_KEY must contain the original multiline P8 PEM, not Base64');
  return value.replaceAll('\r\n', '\n');
}
function signed() {
  const report = readJson(path.join(output, 'diagnostic/diagnostic.json'));
  requireApproval(report);
  assert.equal(report.unsignedBuild, 'PASS');
  assert.equal(process.env.BUILD_CONFIGURATION || 'Release', 'Release');
  const team = process.env.APPLE_TEAM_ID;
  assert.equal(team, TEAM, 'APPLE_TEAM_ID must match the registered team');
  assert(process.env.APPLE_CERTIFICATE_PASSWORD, 'Missing APPLE_CERTIFICATE_PASSWORD');
  fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  const state = readJson(path.join(base, 'state.json'));
  const p = projectData();
  const password = randomBytes(32).toString('hex');
  const oldKeychains = command('Read keychain search list', ['security', 'list-keychains', '-d', 'user']);
  save(path.join(privateDir, 'old-keychains.json'), [...oldKeychains.matchAll(/"([^"]+)"/g)].map(m => m[1]));
  try {
    command('Create temporary keychain', ['security', 'create-keychain', '-p', password, keychain]);
    command('Unlock temporary keychain', ['security', 'unlock-keychain', '-p', password, keychain]);
    command('Set keychain timeout', ['security', 'set-keychain-settings', '-lut', '3600', keychain]);
    importSigningIdentities(cert => command('Import distribution identity', ['security', 'import', cert, '-k', keychain, '-P', process.env.APPLE_CERTIFICATE_PASSWORD, '-T', '/usr/bin/codesign', '-T', '/usr/bin/productbuild', '-T', '/usr/bin/productsign']));
    command('Set key partition access', ['security', 'set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-k', password, keychain]);
    command('Select temporary keychain', ['security', 'list-keychains', '-d', 'user', '-s', keychain, ...readJson(path.join(privateDir, 'old-keychains.json'))]);
    const ids = command('Inspect distribution identities', ['security', 'find-identity', '-v', keychain]);
    const identities = [...ids.matchAll(/([A-F0-9]{40}) "([^"]+)"/g)].map(m => ({ hash: m[1], name: m[2] }));
    const appIds = identities.filter(v => v.name.startsWith('Apple Distribution:') && v.name.endsWith(`(${team})`));
    const installerIds = identities.filter(v => v.name.startsWith('3rd Party Mac Developer Installer:') && v.name.endsWith(`(${team})`));
    assert.equal(appIds.length, 1, 'Temporary keychain must contain exactly one Apple Distribution private-key identity for this team');
    assert.equal(installerIds.length, 1, 'Temporary keychain must contain one Mac Installer Distribution private-key identity for this team');
    const appIdentity = appIds[0], installer = installerIds[0];
    const profiles = {};
    for (const [target, bundle, secret] of [[p.app, APP, 'APPLE_APP_PROVISION_PROFILE_BASE64'], [p.ext, EXT, 'APPLE_EXTENSION_PROVISION_PROFILE_BASE64']]) {
      const encoded = decodeSecret(secret, `${target.id}.provisionprofile`);
      const decoded = path.join(privateDir, `${target.id}.plist`);
      command('Decode provisioning profile privately', ['security', 'cms', '-D', '-i', encoded, '-o', decoded]);
      const profile = profilePlist(decoded);
      checkProfile(profile, bundle, team, appIdentity.hash);
      profiles[bundle] = profile.UUID;
      // Xcode 26's recognized profile location; only our files are removed during cleanup.
      const installDir = path.join(os.homedir(), 'Library/Developer/Xcode/UserData/Provisioning Profiles');
      fs.mkdirSync(installDir, { recursive: true });
      const installed = path.join(installDir, profile.UUID + '.provisionprofile');
      assert(!fs.existsSync(installed), 'Refusing to overwrite an existing provisioning profile');
      const ledger = path.join(privateDir, 'installed-profiles.json');
      save(ledger, [...(fs.existsSync(ledger) ? readJson(ledger) : []), installed]);
      fs.copyFileSync(encoded, installed);
      for (const id of p.data.objects[target.buildConfigurationList].buildConfigurations) {
        Object.assign(p.data.objects[id].buildSettings, { DEVELOPMENT_TEAM: team, CODE_SIGN_STYLE: 'Manual', CODE_SIGN_IDENTITY: appIdentity.hash, PROVISIONING_PROFILE_SPECIFIER: profile.UUID, OTHER_CODE_SIGN_FLAGS: `--keychain ${keychain}` });
      }
    }
    writePlist(p.file, p.data);
    const after = topology(p, state.scheme);
    verifyResolvedIdentifiers(after);
    for (const row of after) {
      const info = plist(path.resolve(path.dirname(p.project), row.plist));
      assert.equal(info.ITSAppUsesNonExemptEncryption, false, 'Encryption declaration must be Boolean false before archive');
    }
    const archive = path.join(base, 'Safari.xcarchive');
    command('Archive signed macOS application', [...xcodeArgs(p, state.scheme), '-archivePath', archive, '-derivedDataPath', path.join(base, 'SignedDerivedData'), 'archive']);
    const apps = fs.readdirSync(path.join(archive, 'Products/Applications')).filter(n => n.endsWith('.app'));
    assert.equal(apps.length, 1);
    const metadata = verifyProduct(path.join(archive, 'Products/Applications', apps[0]), true, team);
    const exportHelp = command('Inspect export options', ['xcodebuild', '-help'], { allowFailure: true });
    for (const key of ['app-store-connect', 'installerSigningCertificate', 'provisioningProfiles', 'manageAppVersionAndBuildNumber']) assert(exportHelp.includes(key), `Installed Xcode export help lacks ${key}; stop`);
    const options = path.join(privateDir, 'ExportOptions.plist');
    writePlist(options, { method: 'app-store-connect', destination: 'export', signingStyle: 'manual', teamID: team, signingCertificate: appIdentity.hash, installerSigningCertificate: installer.hash, provisioningProfiles: profiles, manageAppVersionAndBuildNumber: false, stripSwiftSymbols: true });
    const exported = path.join(base, 'export');
    command('Export App Store package', ['xcodebuild', '-exportArchive', '-archivePath', archive, '-exportPath', exported, '-exportOptionsPlist', options]);
    const packages = walk(exported).filter(f => f.endsWith('.pkg'));
    assert.equal(packages.length, 1, 'Expected exactly one exported macOS .pkg');
    const sig = command('Verify installer signature', ['pkgutil', '--check-signature', packages[0]]);
    assert(sig.includes(installer.name), 'Exported package has wrong installer identity');
    const expanded = path.join(base, 'expanded-package');
    command('Inspect exported payload', ['pkgutil', '--expand-full', packages[0], expanded]);
    const exportedApps = walk(expanded).filter(f => f.endsWith('.app/Contents/Info.plist'));
    assert.equal(exportedApps.length, 1, 'Expected one application in exported installer');
    verifyProduct(path.resolve(exportedApps[0], '../..'), true, team);
    const dest = path.join(output, 'signed');
    fs.mkdirSync(dest, { recursive: true });
    const pkg = path.join(dest, 'elec-training-qualification-checker-macos-v1.0.0.pkg');
    fs.copyFileSync(packages[0], pkg);
    save(path.join(dest, 'metadata.json'), { ...metadata, build: buildNumber(process.env.BUILD_OVERRIDE), teamMatches: true, appStoreInstallerSignatureVerified: true, inputHash: INPUT_HASH });
    save(path.join(dest, 'sha256.txt'), `${digest(fs.readFileSync(pkg))}  ${path.basename(pkg)}\n`);
    save(path.join(dest, 'export-compliance.json'), { ITSAppUsesNonExemptEncryption: false, archiveVerified: true, exportVerified: true, appleExemptionGranted: false });
    // Raw archives include embedded profiles. Omit them from CI artifacts rather than altering signed products.
    save(path.join(dest, 'archive-report.json'), { archived: true, signedArchiveValidated: true, archivedArtifactOmitted: 'Avoid publishing embedded provisioning profiles separately; signed install package retains Apple-required embedded profiles.' });
    console.log('PASS: signed archive and exported .pkg verified; no Apple upload performed by build mode');
  } finally { cleanup(); }
}
function upload() {
  assert.equal(process.env.UPLOAD_AUTHORIZED, 'true', 'Explicit upload authorization required');
  requireApproval(readJson(path.join(output, 'diagnostic/diagnostic.json')));
  for (const key of ['APPLE_API_KEY_ID', 'APPLE_API_ISSUER_ID']) assert(process.env[key], `Missing ${key}`);
  assert(/^[A-Z0-9]+$/.test(process.env.APPLE_API_KEY_ID));
  assert(/^[a-fA-F0-9-]{36}$/.test(process.env.APPLE_API_ISSUER_ID));
  const pkg = path.join(output, 'signed/elec-training-qualification-checker-macos-v1.0.0.pkg');
  assert.equal(fs.readFileSync(path.join(output, 'signed/sha256.txt'), 'utf8').split(' ')[0], digest(fs.readFileSync(pkg)));
  fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  try {
    const key = path.join(privateDir, `AuthKey_${process.env.APPLE_API_KEY_ID}.p8`);
    fs.writeFileSync(key, apiPrivateKey(process.env.APPLE_API_PRIVATE_KEY), { mode: 0o600 });
    const help = command('Inspect upload tool', ['xcrun', 'altool', '--help'], { allowFailure: true });
    for (const flag of ['--validate-app', '--upload-app', '--apiKey', '--apiIssuer', 'API_PRIVATE_KEYS_DIR']) assert(help.includes(flag), `Installed altool lacks ${flag}; do not use guessed upload arguments`);
    // Apple's documented altool key search directory override; never place P8 inside the workspace.
    process.env.API_PRIVATE_KEYS_DIR = privateDir;
    const args = ['-f', pkg, '-t', 'macos', '--apiKey', process.env.APPLE_API_KEY_ID, '--apiIssuer', process.env.APPLE_API_ISSUER_ID, '--output-format', 'json'];
    command('Validate package with Apple', ['xcrun', 'altool', '--validate-app', ...args]);
    command('Upload package to Apple', ['xcrun', 'altool', '--upload-app', ...args]);
    save(path.join(output, 'signed/apple-upload.json'), { uploadCommandSucceeded: true, submittedForReview: false, note: 'Check App Store Connect for processing outcome; no raw Apple response published.' });
  } finally { delete process.env.API_PRIVATE_KEYS_DIR; cleanup(); }
}
function cleanup() {
  if (!fs.existsSync(privateDir)) return;
  if (process.platform === 'darwin') {
    const old = path.join(privateDir, 'old-keychains.json');
    if (fs.existsSync(old)) command('Restore keychains', ['security', 'list-keychains', '-d', 'user', '-s', ...readJson(old)], { allowFailure: true });
    if (fs.existsSync(keychain)) command('Delete temporary keychain', ['security', 'delete-keychain', keychain], { allowFailure: true });
  }
  const ledger = path.join(privateDir, 'installed-profiles.json');
  if (fs.existsSync(ledger)) for (const f of readJson(ledger)) {
    assert(path.resolve(f).startsWith(path.join(os.homedir(), 'Library/Developer/Xcode/UserData/Provisioning Profiles') + path.sep));
    fs.rmSync(f, { force: true });
  }
  assert(path.resolve(privateDir) === path.join(path.resolve(process.env.RUNNER_TEMP || os.tmpdir()), 'elec-apple-ci'));
  fs.rmSync(privateDir, { recursive: true, force: true });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  try {
    if (mode === 'approval') requireApproval();
    else if (mode === 'diagnostic') diagnostic();
    else if (mode === 'signed') { assert.equal(process.platform, 'darwin'); signed(); }
    else if (mode === 'upload') { assert.equal(process.platform, 'darwin'); upload(); }
    else if (mode === 'cleanup') cleanup();
    else throw new Error('Use approval, diagnostic, signed, upload or cleanup');
  } catch (e) {
    // Assertions involving secret-derived data may carry actual/expected values: do not dump error objects.
    console.error(mode === 'signed' || mode === 'upload' ? `Apple signing/upload validation failed during ${failedOperation || 'preflight validation'}; inspect operations report and signing setup. Raw secret-bearing output withheld.` : e.message);
    process.exitCode = 1;
  } finally {
    if (['diagnostic', 'signed', 'upload'].includes(mode)) save(path.join(output, mode === 'diagnostic' ? 'diagnostic/operations.json' : `signed/${mode}-operations.json`), events);
  }
}
