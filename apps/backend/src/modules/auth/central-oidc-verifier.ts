/** RS256 OIDC ID-token checks, adapted from Central's oidc-id-token.mjs. */
import {createPublicKey,verify as verifyRsa} from "node:crypto";
export type OidcPublicKey={kid:string;kty:string;alg?:string;use?:string;n:string;e:string};
export type VerifiedIdToken={issuer:string;subject:string;audience:string;nonce:string};
const B64=/^[A-Za-z0-9_-]+$/;
const decode=(s:string):Record<string,unknown>=>{
 if(!B64.test(s)||s.length>14000)throw Error("Invalid ID token");
 const obj:unknown=JSON.parse(Buffer.from(s,"base64url").toString("utf8"));
 if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("Invalid ID token");
 return obj as Record<string,unknown>;
};
export function verifyOidcIdToken(jwt:unknown,keys:readonly OidcPublicKey[],opts:{
 issuer:string;audience:string;nonce:string;nowSeconds:number;maxAgeSeconds?:number;
}):VerifiedIdToken{
 if(typeof jwt!=="string"||jwt.length>16384||!Array.isArray(keys)||keys.length>64)throw Error("Invalid ID token");
 const p=jwt.split(".");if(p.length!==3||p.some(x=>!B64.test(x)))throw Error("Invalid ID token");
 const head=decode(p[0]),body=decode(p[1]);
 if(head.alg!=="RS256"||typeof head.kid!=="string"||head.crit||head.jku||head.x5u||
    head.b64===false)throw Error("Invalid ID token");
 const matches=keys.filter(k=>k.kid===head.kid&&k.kty==="RSA"&&
  (!k.use||k.use==="sig")&&(!k.alg||k.alg==="RS256"));
 if(matches.length!==1)throw Error("Invalid ID token");
 let verified=false;
 try{verified=verifyRsa("RSA-SHA256",Buffer.from(p[0]+"."+p[1],"ascii"),
 createPublicKey({key:matches[0] as never,format:"jwk"}),Buffer.from(p[2],"base64url"));}catch{verified=false;}
 if(!verified)throw Error("Invalid ID token");
 const now=opts.nowSeconds,maxAge=opts.maxAgeSeconds??300,aud=body.aud;
 if(!Number.isSafeInteger(now)||!Number.isSafeInteger(maxAge)||maxAge<30||maxAge>900||
    body.iss!==opts.issuer||typeof body.sub!=="string"||!body.sub||
    body.nonce!==opts.nonce||!(aud===opts.audience||(Array.isArray(aud)&&aud.includes(opts.audience)))||
    (Array.isArray(aud)&&aud.length>1&&body.azp!==opts.audience)||
    (body.azp!==undefined&&body.azp!==opts.audience)||
    !Number.isSafeInteger(body.iat)||Number(body.iat)>now+60||Number(body.iat)<now-maxAge-60||
    !Number.isSafeInteger(body.exp)||Number(body.exp)<=now||
    (body.nbf!==undefined&&(!Number.isSafeInteger(body.nbf)||Number(body.nbf)>now+60)))
    throw Error("Invalid ID token");
 return {issuer:opts.issuer,subject:body.sub,audience:opts.audience,nonce:opts.nonce};
}
