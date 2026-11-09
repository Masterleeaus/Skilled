/** Ephemeral RSA keys and deterministic identity-token signatures; TEST ONLY. */
import {generateKeyPairSync,sign} from "node:crypto";
export const keyPair=generateKeyPairSync("rsa",{modulusLength:2048});
export const jwk={...keyPair.publicKey.export({format:"jwk"}),kid:"test-rsa-key",alg:"RS256",use:"sig"};
export const now=Date.parse("2026-11-09T03:00:00Z");
export const nowSeconds=Math.floor(now/1000);
export const issuer="https://id.example.test";
export const clientId="academy-test-client";
export const nonce="nonce-123456789";
export function jwt(overrides:Record<string,unknown>={},header:Record<string,unknown>={}){
 const h=Buffer.from(JSON.stringify({alg:"RS256",kid:"test-rsa-key",typ:"JWT",...header})).toString("base64url");
 const payload={iss:issuer,aud:clientId,sub:"central-user-0001",nonce,
 iat:nowSeconds,exp:nowSeconds+120,...overrides};
 const p=Buffer.from(JSON.stringify(payload)).toString("base64url");
 const sig=sign("RSA-SHA256",Buffer.from(h+"."+p),keyPair.privateKey).toString("base64url");
 return h+"."+p+"."+sig;
}
export function response(doc:unknown,status=200):Response{
 return {ok:status>=200&&status<300,redirected:false,status,text:async()=>JSON.stringify(doc)} as Response;
}
export function fakeFetch(doc:Record<string,unknown>={}):typeof fetch{
 return (async(url:RequestInfo|URL)=> {
  const u=String(url);
  if(u.endsWith(".well-known/openid-configuration"))return response({
   issuer,authorization_endpoint:issuer+"/authorize",token_endpoint:issuer+"/token",
   jwks_uri:issuer+"/jwks",...doc});
  if(u.endsWith("/jwks"))return response({keys:[jwk]});
  if(u.endsWith("/token"))return response({id_token:jwt()});
  throw Error("Unexpected network endpoint");
 }) as typeof fetch;
}
