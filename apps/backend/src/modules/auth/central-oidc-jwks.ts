/** Fixed HTTPS JWKS origin, bounded keyset. No URL from a token header. */
import type {OidcPublicKey} from "./central-oidc-verifier";
export function createSkilledJwksReader(url:string,fetcher:typeof fetch=fetch,clock=()=>Date.now()){
 const endpoint=new URL(url);
 if(endpoint.protocol!=="https:"||endpoint.username||endpoint.password||endpoint.hash||
    endpoint.search||endpoint.pathname==="/"||!url.startsWith(endpoint.origin+"/"))
   throw TypeError("Trusted HTTPS JWKS URL required");
 let cache:{until:number;keys:OidcPublicKey[]}|null=null;
 return async(force=false):Promise<OidcPublicKey[]>=>{
  if(!force&&cache&&clock()<cache.until)return cache.keys;
  const response=await fetcher(url,{method:"GET",headers:{accept:"application/json"},redirect:"error",
    signal:AbortSignal.timeout(4000)});
  if(!response.ok||response.redirected)throw Error("JWKS unavailable");
  const body=await response.text();
  if(Buffer.byteLength(body)>65536)throw Error("JWKS too large");
  const parsed:unknown=JSON.parse(body);
  if(!parsed||typeof parsed!=="object"||!Array.isArray((parsed as {keys?:unknown}).keys))throw Error("Invalid JWKS");
  const keys=(parsed as {keys:OidcPublicKey[]}).keys;
  if(keys.length>64||keys.some(k=>!k||typeof k.kid!=="string"||!k.kid))throw Error("Invalid JWKS");
  cache={keys:keys.filter(k=>k.kty==="RSA"&&(!k.alg||k.alg==="RS256")),until:clock()+60000};
  return cache.keys;
 };
}
