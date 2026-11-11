/** Production-capable OIDC code+PKCE core; not mounted or enabled without Central. */
import {createOidcChallenge,browserBindingHash} from "./central-oidc-pkce";
import {discoverOidc} from "./central-oidc-discovery";
import {createSkilledJwksReader} from "./central-oidc-jwks";
import {verifyOidcIdToken} from "./central-oidc-verifier";
type Pending={nonce:string;verifier:string;bindingHash:string;expiresAt:number};
export type OidcStateStore={
 save:(state:string,record:Pending)=>Promise<void>;
 consume:(state:string,binding:string)=>Promise<{nonce:string;verifier:string;expiresAt:number}|null>;
};
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
export function createSkilledVerifiedOidcLogin(options:{
 issuer:string;clientId:string;clientSecret:string;redirectUri:string;
 store:OidcStateStore;fetcher?:typeof fetch;clock?:()=>number;
}){
 const {issuer,clientId,clientSecret,redirectUri,store}=options;
 const fetcher=options.fetcher??fetch,clock=options.clock??Date.now;
 if(!/^https:\/\/[A-Za-z0-9.-]+(?::443)?$/.test(issuer)||
    typeof clientId!=="string"||!clientId||clientId.length>256||
    typeof clientSecret!=="string"||clientSecret.length<16||
    typeof redirectUri!=="string"||
    !redirectUri.startsWith("https://")||
    new URL(redirectUri).pathname!=="/auth/titan/academy/callback"||
    new URL(redirectUri).search!==""||new URL(redirectUri).hash!==""||
    typeof store?.save!=="function"||typeof store?.consume!=="function")
 throw TypeError("Trusted OIDC configuration required");
 async function boundedJson(response:Response){
  if(!response.ok||response.redirected)throw Error("OIDC provider unavailable");
  const body=await response.text();if(Buffer.byteLength(body)>65536)throw Error("OIDC response oversized");
  const parsed:unknown=JSON.parse(body);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("OIDC response invalid");
  return parsed as Record<string,unknown>;
 }
 return {
  async begin({browserBinding}:{browserBinding:string}){
   if(!TOKEN.test(browserBinding))throw Error("Invalid browser correlation");
   const {authorizationEndpoint}=await discoverOidc(issuer,fetcher);
   const {state,nonce,verifier,codeChallenge}=createOidcChallenge();
   await store.save(state,{nonce,verifier,bindingHash:browserBindingHash(browserBinding),expiresAt:clock()+300000});
   const url=new URL(authorizationEndpoint);
   for(const [key,value] of Object.entries({
    client_id:clientId,redirect_uri:redirectUri,response_type:"code",scope:"openid profile email",
    state,nonce,code_challenge:codeChallenge,code_challenge_method:"S256",
   }))url.searchParams.set(key,value);
   return {authorizationUrl:url.href};
  },
  async complete({browserBinding,code,state}:{browserBinding:string;code:string;state:string}){
   if(!TOKEN.test(browserBinding)||!TOKEN.test(state)||typeof code!=="string"||
      code.length<8||code.length>512||/[\r\n]/.test(code))throw Error("Invalid OIDC callback");
   const pending=await store.consume(state,browserBinding);
   if(!pending||pending.expiresAt<=clock()||!TOKEN.test(pending.nonce)||!TOKEN.test(pending.verifier))
     throw Error("Expired or replayed OIDC state");
   const {tokenEndpoint,jwksUri}=await discoverOidc(issuer,fetcher);
   const creds=Buffer.from(clientId+":"+clientSecret).toString("base64");
   const exchange=await fetcher(tokenEndpoint,{method:"POST",redirect:"error",
    headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json",
     Authorization:"Basic "+creds},
    body:new URLSearchParams({grant_type:"authorization_code",code,
     redirect_uri:redirectUri,code_verifier:pending.verifier}).toString(),
    signal:AbortSignal.timeout(5000)});
   const tokens=await boundedJson(exchange);
   if(typeof tokens.id_token!=="string")throw Error("OIDC ID token missing");
   const keys=await createSkilledJwksReader(jwksUri,fetcher)();
   const verified=verifyOidcIdToken(tokens.id_token,keys,{
    issuer,audience:clientId,nonce:pending.nonce,nowSeconds:Math.floor(clock()/1000)
   });
   return {issuer:verified.issuer,subject:verified.subject,audience:clientId,applicationId:"academy" as const};
  },
 };
}
