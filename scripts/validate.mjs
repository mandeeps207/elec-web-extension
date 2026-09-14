import { targets, runtimeFiles, read, json, validateRoutes, validateManifest, auditRuntime, validateBuild, releaseErrors, sha256, sourceDigest } from './lib.mjs';
try {
  validateRoutes();
  for (const target of targets) validateManifest(await json(`manifests/${target}.json`), target, (await json('package.json')).version);
  for (const file of runtimeFiles) auditRuntime(file, await read(`src/${file}`));
  console.log('PASS: five routes, source URLs, review metadata, manifests, zero permissions, runtime security audit.');
  if (process.argv.includes('--release')) {
    const errors = await releaseErrors();
    if (errors.length) throw new Error(`Release blocked:\n- ${errors.join('\n- ')}`);
    console.log('PASS: release gates.');
  } else {
    console.log('Development validation only. Release approval is NOT implied.');
  }
  if (process.argv.includes('--built')) {
    const release = process.argv.includes('--release');
    for (const target of targets) await validateBuild(`build/${release ? 'release' : 'development'}/${target}`, target, release);
    console.log('PASS: generated build allowlists, icons and manifests.');
  }
  if (process.argv.includes('--hashes')) {
    console.log('Content SHA256:', sha256(await read('src/data/qualification-routes.js')));
    console.log('Source SHA256:', await sourceDigest());
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
