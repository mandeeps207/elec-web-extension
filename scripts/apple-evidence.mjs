import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const forbiddenEntitlements = ['com.apple.security.network.client', 'com.apple.security.files.user-selected.read-only', 'com.apple.security.files.user-selected.read-write'];
export function restrictCapabilities(settings) {
  for (const [key, value] of Object.entries({ ENABLE_OUTGOING_NETWORK_CONNECTIONS: 'NO', ENABLE_USER_SELECTED_FILES: 'NO', ENABLE_APP_SANDBOX: 'YES' })) {
    for (const existing of Object.keys(settings)) if (existing === key || existing.startsWith(key + '[')) settings[existing] = value;
    settings[key] = value;
  }
}
export function verifyCapabilities(settings) {
  assert.equal(settings.ENABLE_APP_SANDBOX, 'YES');
  assert.equal(settings.ENABLE_OUTGOING_NETWORK_CONNECTIONS, 'NO');
  assert.equal(settings.ENABLE_USER_SELECTED_FILES, 'NO');
  for (const [k, v] of Object.entries(settings)) {
    if (k.startsWith('ENABLE_OUTGOING_NETWORK_CONNECTIONS[') || k.startsWith('ENABLE_USER_SELECTED_FILES[')) assert.equal(v, 'NO');
    if (k.startsWith('ENABLE_APP_SANDBOX[')) assert.equal(v, 'YES');
  }
}
export function normalizeSwift(text) {
  // Only Apple's exact leading comment header. Never touch comments in code,
  // string literals, block comments, or any non-date byte.
  return text.replace(/^(\/\/\r?\n\/\/  [^\r\n]+\.swift\r?\n\/\/  [^\r\n]+\r?\n\/\/\r?\n\/\/  Created by [^\r\n]+ on )\d{1,2}\/\d{1,2}\/\d{2,4}(\.\r?\n\/\/\r?\n)/, '$1<GENERATED-DATE>$2');
}
export function canonicalProject(project) {
  const ids = new Map(), objects = {};
  const reference = id => {
    if (!ids.has(id)) {
      const replacement = `OBJECT_${ids.size}`;
      ids.set(id, replacement);
      objects[replacement] = null;
      objects[replacement] = visit(project.objects[id]);
    }
    return ids.get(id);
  };
  const visit = value => {
    if (typeof value === 'string') return Object.hasOwn(project.objects, value) ? reference(value) : value;
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value).sort((a,b) => (a === 'attributes') - (b === 'attributes') || a.localeCompare(b))) {
        // PBX target-attribute dictionaries also use generated object IDs as keys.
        const mapped = Object.hasOwn(project.objects, key) ? reference(key) : key;
        result[mapped] = key === 'CURRENT_PROJECT_VERSION' ? '<CI-BUILD-NUMBER>' : visit(value[key]);
      }
      return result;
    }
    return value;
  };
  const rootObject = reference(project.rootObject);
  assert.equal(ids.size, Object.keys(project.objects).length, 'Unreachable generated project object; review required');
  const ordered = v => Array.isArray(v) ? v.map(ordered) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])) : v;
  return ordered({ ...visit(Object.fromEntries(Object.entries(project).filter(([k]) => !['objects', 'rootObject'].includes(k)))), rootObject, objects });
}
export function sourceHashes(entries, projectFile, project) {
  return Object.fromEntries(Object.keys(entries).sort().map(name => {
    assert(!/(?:^|\/)(?:\._|\.DS_Store)/.test(name), 'Unexpected Apple metadata file in generated tree');
    const bytes = name === projectFile ? JSON.stringify(canonicalProject(project)) : name.endsWith('.swift') ? normalizeSwift(entries[name].toString('utf8')) : entries[name];
    return [name, hash(bytes)];
  }));
}
// Strict PNG audit of converter artwork, not an image editor or visual approval.
export function pngAudit(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20), type = bytes[25];
  assert.equal(bytes[24], 8); assert([2, 6].includes(type), 'Unsupported PNG encoding: inspect artwork'); assert.equal(bytes[28], 0);
  assert(width > 0 && width <= 2048 && height > 0 && height <= 2048);
  const chunks = []; for (let p = 8; p < bytes.length;) { const n = bytes.readUInt32BE(p); if (bytes.toString('ascii', p+4, p+8) === 'IDAT') chunks.push(bytes.subarray(p+8, p+8+n)); p += n+12; }
  const raw = inflateSync(Buffer.concat(chunks)), channels = type === 6 ? 4 : 3, stride = width * channels;
  assert.equal(raw.length, height * (stride+1)); let previous = Buffer.alloc(stride), opaque = 0, transparent = 0, edgeOpaque = 0;
  for (let y=0; y<height; y++) {
    const filter=raw[y*(stride+1)], row=Buffer.from(raw.subarray(y*(stride+1)+1,(y+1)*(stride+1))); assert(filter<=4);
    for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=previous[x],c=x>=channels?previous[x-channels]:0;const p=a+b-c;const pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);row[x]=(row[x]+[0,a,b,Math.floor((a+b)/2),pa<=pb&&pa<=pc?a:pb<=pc?b:c][filter])&255;}
    for(let x=0;x<width;x++){const alpha=channels===4?row[x*4+3]:255;if(alpha===0)transparent++;else {opaque++;if(x===0||y===0||x===width-1||y===height-1)edgeOpaque++;}}
    previous=row;
  }
  return {width,height,aspectRatio:width/height,hasAlpha:channels===4,transparentPixels:transparent,visiblePixels:opaque,edgeVisiblePixels:edgeOpaque,sha256:hash(bytes)};
}
