import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeSwift, sourceHashes, canonicalProject, restrictCapabilities, verifyCapabilities, pngAudit } from '../scripts/apple-evidence.mjs';
const header = date => `//\n//  ViewController.swift\n//  App\n//\n//  Created by Anka on ${date}.\n//\n\nlet x = 1\n`;
const project = () => ({rootObject:'R',objects:{R:{isa:'PBXProject',targets:['T']},T:{isa:'PBXNativeTarget',buildSettings:{PRODUCT_BUNDLE_IDENTIFIER:'example.app',CURRENT_PROJECT_VERSION:'1.1'}}}});
test('Only exact leading generated date comment is normalized; executable Swift stays significant',()=>{
  assert.equal(normalizeSwift(header('9/15/26')),normalizeSwift(header('9/19/26')));
  for(const text of ['let s = """\n'+header('9/15/26')+'"""',header('9/15/26').replace('Created by','Other comment'), '/*\n'+header('9/15/26')+'*/']) assert.equal(normalizeSwift(text),text);
  const digest=text=>sourceHashes({'a.swift':Buffer.from(text)},'project',project());
  assert.deepEqual(digest(header('9/15/26')),digest(header('9/19/26')));
  assert.notDeepEqual(digest(header('9/15/26')),digest(header('9/15/26').replace('x = 1','x = 2')));
});
test('Complete evidence includes plist, entitlement, project settings and unexpected files',()=>{
  const files={'project':Buffer.from('placeholder'),'Info.plist':Buffer.from('false'),'App.entitlements':Buffer.from('sandbox'),'Catalog.json':Buffer.from('{}')};
  const p=project(), base=sourceHashes(files,'project',p);
  for(const f of ['Info.plist','App.entitlements','Catalog.json'])assert.notDeepEqual(base,sourceHashes({...files,[f]:Buffer.from('changed')},'project',p));
  assert.notDeepEqual(base,sourceHashes({...files,'unexpected.file':Buffer.from('new')},'project',p));
  for(const settings of [{PRODUCT_BUNDLE_IDENTIFIER:'other'},{ENABLE_OUTGOING_NETWORK_CONNECTIONS:'YES'}]){const q=project();Object.assign(q.objects.T.buildSettings,settings);assert.notDeepEqual(base,sourceHashes(files,'project',q));}
  const q=project();q.objects.R.extra='changed';assert.notDeepEqual(base,sourceHashes(files,'project',q));
  assert.throws(()=>sourceHashes({...files,'._metadata':Buffer.from('x')},'project',p));
});
test('Project graph IDs and CI build sequence are canonical but all settings remain represented',()=>{
  const a=project(),b={rootObject:'NEWROOT',objects:{NEWTARGET:a.objects.T,NEWROOT:{isa:'PBXProject',targets:['NEWTARGET']}}};
  assert.deepEqual(canonicalProject(a),canonicalProject(b));
  const c=project();c.objects.T.buildSettings.CURRENT_PROJECT_VERSION='5.1';assert.deepEqual(canonicalProject(a),canonicalProject(c));
  c.objects.UNRELATED={isa:'Unknown'};assert.throws(()=>canonicalProject(c),/Unreachable/);
});
test('Capability correction removes conditional overrides and retains sandbox',()=>{
  const s={ENABLE_OUTGOING_NETWORK_CONNECTIONS:'YES',ENABLE_USER_SELECTED_FILES:'readonly','ENABLE_USER_SELECTED_FILES[sdk=macosx*]':'readwrite'};
  restrictCapabilities(s);verifyCapabilities(s);
  for(const patch of [{ENABLE_APP_SANDBOX:'NO'},{ENABLE_OUTGOING_NETWORK_CONNECTIONS:'YES'},{ENABLE_USER_SELECTED_FILES:'readonly'}])assert.throws(()=>verifyCapabilities({...s,...patch}));
});
test('Approved icon dimensions, alpha padding and deterministic pixel audit',()=>{
  for(const n of [16,32,48,64,96,128]){const bytes=fs.readFileSync(`src/assets/icons/icon-${n}.png`),r=pngAudit(bytes);assert.equal(r.width,n);assert.equal(r.height,n);assert.equal(r.aspectRatio,1);assert(r.visiblePixels>0);assert.deepEqual(r,pngAudit(bytes));}
  const source=pngAudit(fs.readFileSync('src/assets/icons/icon-128.png'));assert.equal(source.edgeVisiblePixels,0);assert(source.transparentPixels>0);
  assert.throws(()=>pngAudit(Buffer.alloc(32)));
});

test('Mac artwork regression baseline contains all required slots with square pixels and transparency',()=>{
 const baseline=JSON.parse(fs.readFileSync('ci/safari-icon-baseline.json','utf8'));
 assert.deepEqual(baseline.slots.map(s=>s.slot).sort(),[16,32,128,256,512].flatMap(n=>[1,2].map(s=>n+'x'+n+'@'+s+'x')).sort());
 for(const slot of baseline.slots){assert.equal(slot.width,slot.height);assert.equal(slot.aspectRatio,1);assert(slot.visiblePixels>0&&slot.transparentPixels>0);assert(/^[a-f0-9]{64}$/.test(slot.sha256));}
});
