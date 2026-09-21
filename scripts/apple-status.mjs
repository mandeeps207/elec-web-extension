// Read-only App Store Connect processing diagnosis. Never logs credentials or JWTs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const APPLE_ID = '6812432163';
const BUNDLE_ID = 'training.elec.qualification.checker';
const output = 'build/apple-artifacts/status/app-store-connect-status.json';
const enc = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const keyId = process.env.APPLE_API_KEY_ID;
const issuer = process.env.APPLE_API_ISSUER_ID;
const pem = process.env.APPLE_API_PRIVATE_KEY;
assert(/^[A-Z0-9]+$/.test(keyId || ''), 'Missing or invalid API key ID');
assert(/^[a-fA-F0-9-]{36}$/.test(issuer || ''), 'Missing or invalid API issuer ID');
assert(/^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----\s*$/.test(pem || ''), 'Missing or invalid API private key');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${enc({alg:'ES256',kid:keyId,typ:'JWT'})}.${enc({iss:issuer,iat:now-5,exp:now+600,aud:'appstoreconnect-v1'})}`;
const signature = sign('sha256', Buffer.from(unsigned), {key:createPrivateKey(pem),dsaEncoding:'ieee-p1363'}).toString('base64url');
const authorization = `Bearer ${unsigned}.${signature}`;

const safeRecord = row => ({id:row.id,type:row.type,attributes:Object.fromEntries(Object.entries(row.attributes || {}).filter(([key]) => ['version','uploadedDate','processingState','expired','expirationDate','minOsVersion','cfBundleIdentifier','cfBundleShortVersionString','cfBundleVersion','createdDate','platform','state'].includes(key)))});
async function query(name, pathname) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {headers:{Authorization:authorization}});
  let body; try { body = await response.json(); } catch { body = {}; }
  return {name,httpStatus:response.status,ok:response.ok,requestId:response.headers.get('x-request-id'),records:(body.data || []).map(safeRecord).filter(row => !row.attributes.cfBundleIdentifier || row.attributes.cfBundleIdentifier === BUNDLE_ID),errors:(body.errors || []).map(({status,code,title,detail}) => ({status,code,title,detail}))};
}
const queries = await Promise.all([
  query('processed builds', `/v1/builds?filter%5Bapp%5D=${APPLE_ID}&sort=-uploadedDate&limit=10&fields%5Bbuilds%5D=version,uploadedDate,processingState,expired,expirationDate,minOsVersion`),
  query('app build relationship', `/v1/apps/${APPLE_ID}/builds?limit=10`),
  query('build uploads', `/v1/buildUploads?filter%5BcfBundleIdentifier%5D=${encodeURIComponent(BUNDLE_ID)}&limit=10`)
]);
fs.mkdirSync('build/apple-artifacts/status',{recursive:true});
fs.writeFileSync(output, JSON.stringify({checkedAt:new Date().toISOString(),appAppleId:APPLE_ID,bundleId:BUNDLE_ID,queries},null,2)+'\n');
assert(queries[0].ok, 'Apple builds query failed; inspect sanitized status artifact');
console.log(`PASS: read-only App Store Connect status captured; processed build count ${queries[0].records.length}`);
