/** Discovery never follows redirects or accepts an endpoint on an untrusted origin. */
export type OidcEndpoints={authorizationEndpoint:string;tokenEndpoint:string;jwksUri:string};
export async function discoverOidc(issuer:string,fetcher:typeof fetch=fetch):Promise<OidcEndpoints>{
 const base=new URL(issuer);
 if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash||
    base.pathname!=="/")throw TypeError("Exact HTTPS issuer required");
 const url=issuer+"/.well-known/openid-configuration";
 const response=await fetcher(url,{method:"GET",headers:{accept:"application/json"},
   redirect:"error",signal:AbortSignal.timeout(4000)});
 if(!response.ok||response.redirected)throw Error("OIDC discovery unavailable");
 const text=await response.text();if(Buffer.byteLength(text)>65536)throw Error("OIDC discovery oversized");
 const data:unknown=JSON.parse(text);
 if(!data||typeof data!=="object")throw Error("OIDC discovery invalid");
 const d=data as Record<string,unknown>;
 if(d.issuer!==issuer)throw Error("OIDC issuer mismatch");
 const endpoint=(raw:unknown)=>{if(typeof raw!=="string")throw Error("OIDC endpoint invalid");
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.origin!==base.origin||u.username||u.password||u.hash||u.search)
    throw Error("OIDC endpoint untrusted");
  return u.href;
 };
 return {authorizationEndpoint:endpoint(d.authorization_endpoint),
 tokenEndpoint:endpoint(d.token_endpoint),jwksUri:endpoint(d.jwks_uri)};
}
