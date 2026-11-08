#!/usr/bin/env node
/** Execute private playback service with mocked JWT/MinIO and real byte streams. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ts;
try {ts = require(resolve(root,'apps/backend/node_modules/typescript'));}
catch {ts = require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{encoding:'utf8'}).trim()))));}
const source = readFileSync(resolve(root,'apps/backend/src/modules/courses/video-playback.service.ts'), 'utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
let checks=0; const check=(condition,msg)=>{assert.ok(condition,msg);checks++;};
class AppError extends Error { constructor(msg, status){super(msg);this.status=status;} }
let signedClaims, verificationOptions;
const fakeJwt={sign:(claims,secret,opts)=>{check(opts.expiresIn==='1h','One hour grant TTL');check(opts.algorithm==='HS256','HS256 signing');signedClaims=claims;return 'grant';},
  verify:(token,secret,opts)=>{verificationOptions=opts;if(token!=='grant')throw Error('invalid');return signedClaims;}};
const original=Buffer.from('0123456789ABCDEF');
let lastOperation, requested;
const client={
 statObject:async(_bucket,key)=>{lastOperation='stat';check(key==='videos/012abc.mp4','Private object validated');return {size:original.length};},
 getPartialObject:async(_bucket,_key,start,len)=>{lastOperation='partial';requested={start,len};return Readable.from([original.subarray(start,start+len)]);},
 getObject:async()=>{lastOperation='full';return Readable.from([original]);},
};
const module={exports:{}};
new Function('require','module','exports',compiled)((id)=>{
 if(id==='jsonwebtoken')return {__esModule:true,default:fakeJwt};
 if(id==='crypto')return require('node:crypto');
 if(id==='stream/promises')return require('node:stream/promises');
 if(id.endsWith('config/env'))return {env:{JWT_ACCESS_SECRET:'012345678901234567890123456789ab'}};
 if(id.endsWith('config/minio'))return {minioClient:client,MINIO_BUCKET:'academy-private'};
 if(id.endsWith('utils/AppError'))return {AppError};
 throw Error('Unexpected import '+id);
},module,module.exports);
const {createPlaybackGrant,verifyPlaybackGrant,resolveByteRange,streamPrivateVideo,PLAYBACK_COOKIE_PATH,playbackCookiePath}=module.exports;
check(PLAYBACK_COOKIE_PATH==='/api/courses/lessons','Playback cookie root remains stable');
check(playbackCookiePath('lesson-1')==='/api/courses/lessons/lesson-1/video/stream','Grant cookie is scoped to its lesson stream');
check(playbackCookiePath('lesson-1')!==playbackCookiePath('lesson-2'),'Independent lessons have independent cookie paths');
for(const lesson of ['', '../other', 'x/y', 'x; Path=/']){
  assert.throws(()=>playbackCookiePath(lesson),e=>e.status===400);checks++;
}

check(createPlaybackGrant('l-1','u-1')==='grant','Signed grant generated');
check(verifyPlaybackGrant('grant','l-1')==='u-1','Valid lesson-bound grant');
check(verificationOptions.algorithms[0]==='HS256','Verify fixes allowed algorithms');
await assert.rejects(async()=>verifyPlaybackGrant('garbage','l-1'),e=>e.status===401);checks++;
await assert.rejects(async()=>verifyPlaybackGrant('grant','l-2'),e=>e.status===403);checks++;
check(resolveByteRange(undefined,16).end===15,'Full object range');
check(resolveByteRange('bytes=4-7',16).end===7,'Inclusive range');
check(resolveByteRange('bytes=4-',16).end===15,'Open ended range');
check(resolveByteRange('bytes=-4',16).start===12,'Suffix range');
check(resolveByteRange('bytes=0-999',16).end===15,'Range capped to object length');
for(const input of ['bytes=20-21','bytes=9-1','bytes=0-2,4-6','bytes=-0','invalid','bytes=1.2-4','bytes=9999999999999999999-']){
 check(resolveByteRange(input,16)===null,`Reject invalid range ${input}`);
}
class MockResponse extends Writable {
 constructor(){super();this.headers={};this.parts=[];this.statusCode=200;this.ended=false;}
 setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;}
 status(n){this.statusCode=n;return this;}
 _write(chunk,_enc,cb){this.parts.push(Buffer.from(chunk));cb();}
 end(...args){this.ended=true;return super.end(...args);}
 get body(){return Buffer.concat(this.parts).toString();}
}
async function run(method,range){const res=new MockResponse();await streamPrivateVideo({method,headers:range?{range}:{}},res,'videos/012abc.mp4');return res;}
let res=await run('GET','bytes=2-5');
check(res.statusCode===206,'Partial status 206');
check(res.body==='2345','Exact partial byte sequence');
check(res.headers['content-range']==='bytes 2-5/16','Correct Content-Range');
check(res.headers['content-length']==='4','Correct Content-Length');
check(requested.start===2&&requested.len===4,'MinIO receives bounded read');
check(res.headers['cache-control']==='private, no-store','No public caching');
check(res.headers['referrer-policy']==='no-referrer','No referrer leakage');
res=await run('GET');check(res.body===original.toString(),'Full body streamed');check(lastOperation==='full','Full MinIO stream used');
res=await run('GET','bytes=-3');check(res.body==='DEF','Suffix range streams correctly');
res=await run('HEAD','bytes=0-3');check(res.statusCode===206&&res.body===''&&res.headers['content-length']==='4','HEAD only sends headers');
res=await run('GET','bytes=50-55');check(res.statusCode===416&&res.headers['content-range']==='bytes */16','Unsatisfiable range returns 416');
await assert.rejects(()=>run('GET','bytes=0-1').then(()=>streamPrivateVideo({method:'GET',headers:{}},new MockResponse(),'certificates/private.pdf')),e=>e.status===404);checks++;
const route=readFileSync(resolve(root,'apps/backend/src/modules/courses/module.routes.ts'),'utf8');
check(route.includes('await authorizedVideoForUser(req.params.lessonId, userId)'), 'Every stream validates database access');
check(route.includes('httpOnly: true'), 'Grant stored HttpOnly');
check(route.includes('sameSite: "strict"'), 'Cookie same-site strict');
check(route.includes('maxAge: 60 * 60 * 1000'), 'Cookie expiry matches grant expiry');
check(route.includes('path: playbackCookiePath(req.params.lessonId)'), 'Response uses per-lesson path');
check(!route.includes('getVideoPresignedUrl'), 'No presigned internal object URL exposed');
console.log(`PASS: ${checks} executable private-video grants, range streaming and access-control assertions`);
