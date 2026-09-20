// Full-canvas area averaging: no crop, sharpening, background removal or upscale.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { zlibSync } from 'fflate';
import { pngAudit, hash } from './apple-evidence.mjs';
export const artworkSource = 'src/assets/icons/icon-1254.png';
export const artworkHash = '6117bd14e1cdc621bf4e84c5bf241267ed1c56562ce5ff75213893a62013d706';
export const requiredSlots = [16,32,128,256,512].flatMap(size => [1,2].map(scale => ({idiom:'mac',size:`${size}x${size}`,scale:`${scale}x`,filename:`icon-${size}@${scale}x.png`})));
function chunk(type, data) {
  const body=Buffer.concat([Buffer.from(type),data]); let crc=0xffffffff;
  for(const byte of body){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(data.length);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([length,body,checksum]);
}
export function resizeArtwork(bytes, size) {
  const rows=[]; const source=pngAudit(bytes,(row)=>rows.push(row));
  assert.equal(source.hasAlpha,false,'Approved artwork is opaque RGB');
  assert.equal(source.width,source.height); assert(Number.isInteger(size)&&size>0&&size<=source.width,'Downsampling only');
  const ratio=source.width/size, raw=Buffer.alloc(size*(size*3+1));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const sums=[0,0,0]; let total=0;
    for(let sy=Math.floor(y*ratio);sy<Math.ceil((y+1)*ratio);sy++)for(let sx=Math.floor(x*ratio);sx<Math.ceil((x+1)*ratio);sx++){
      const weight=(Math.min(sy+1,(y+1)*ratio)-Math.max(sy,y*ratio))*(Math.min(sx+1,(x+1)*ratio)-Math.max(sx,x*ratio));
      total+=weight;for(let c=0;c<3;c++)sums[c]+=rows[sy][sx*3+c]*weight;
    }
    for(let c=0;c<3;c++)raw[y*(size*3+1)+1+x*3+c]=Math.round(sums[c]/total);
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',Buffer.from(zlibSync(raw,{level:9}))),chunk('IEND',Buffer.alloc(0))]);
}
export function installArtwork(catalogPath) {
  const bytes=fs.readFileSync(artworkSource);assert.equal(hash(bytes),artworkHash,'Artwork changed: review source and baseline');
  const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
  assert.deepEqual(catalog.images.map(e=>`${e.idiom}:${e.size}@${e.scale}`).sort(),requiredSlots.map(e=>`${e.idiom}:${e.size}@${e.scale}`).sort(),'Unexpected macOS catalog');
  const cache=new Map(),slots=[];
  for(const entry of catalog.images){
    assert(entry.filename&&path.basename(entry.filename)===entry.filename);
    const size=Number(entry.size.split('x')[0])*Number(entry.scale.replace('x',''));
    if(!cache.has(size))cache.set(size,resizeArtwork(bytes,size));
    const output=cache.get(size);fs.writeFileSync(path.join(path.dirname(catalogPath),entry.filename),output);
    slots.push({slot:`${entry.size}@${entry.scale}`,...pngAudit(output)});
  }
  return {source:artworkSource,sourceAudit:pngAudit(bytes),slots,replacementRequired:false,compositionApproval:'User confirmed client intentionally selected full wordmark, including limited small-size legibility.',visualApproval:false,note:'Composition approved; final generated macOS presentation still requires review. Opaque background and full canvas preserved; no upscale.'};
}
