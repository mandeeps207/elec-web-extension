import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requiredSlots,installArtwork,resizeArtwork,artworkSource } from '../scripts/apple-artwork.mjs';
import {pngAudit} from '../scripts/apple-evidence.mjs';
test('Full-wordmark catalog reproduces all slot hashes without crop, alpha or upscale',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'elec-artwork-'));
 try{
 const catalog=path.join(dir,'Contents.json');fs.writeFileSync(catalog,JSON.stringify({images:requiredSlots}));
 const first=installArtwork(catalog),second=installArtwork(catalog);
 assert.deepEqual(first,second);assert.deepEqual(first.slots,JSON.parse(fs.readFileSync('ci/safari-icon-baseline.json')).slots);
 const source=fs.readFileSync(artworkSource);assert.equal(pngAudit(source).width,1254);
 assert.throws(()=>resizeArtwork(source,2048),/Downsampling/);
 // Identity resize preserves every RGB pixel, including background and canvas edges.
 const before=[],after=[];pngAudit(source,row=>before.push(row));pngAudit(resizeArtwork(source,1254),row=>after.push(row));assert.deepEqual(before,after);
 fs.writeFileSync(catalog,JSON.stringify({images:requiredSlots.slice(1)}));assert.throws(()=>installArtwork(catalog),/Unexpected macOS catalog/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
