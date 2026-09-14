import { spawnSync } from 'node:child_process';
import { root, files } from './lib.mjs';
const names = (await Promise.all(['src', 'scripts', 'tests'].map(files))).flat().filter((file) => /\.(js|mjs)$/.test(file));
for (const file of names) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) { console.error(result.stderr); process.exit(1); }
}
console.log(`PASS: syntax checked ${names.length} JavaScript files.`);
