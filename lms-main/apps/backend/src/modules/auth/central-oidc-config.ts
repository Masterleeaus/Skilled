/** Strict server-only OIDC configuration, off by default. */
export type SkilledOidcConfig={
 enabled:boolean;issuer:string;clientId:string;clientSecret:string;redirectUri:string;
 jwksOrigin:string;stateKey:Buffer;
};
const HTTPS=/^https:\/\/[^\s/?#]+$/;
export function parseSkilledOidcConfig(vars:Record<string,string|undefined>):SkilledOidcConfig|null{
 if(vars.SKILLED_CENTRAL_OIDC_ENABLED!=="true")return null;
 const issuer=vars.SKILLED_CENTRAL_OIDC_ISSUER??"";
 const clientId=vars.SKILLED_CENTRAL_OIDC_CLIENT_ID??"";
 const clientSecret=vars.SKILLED_CENTRAL_OIDC_CLIENT_SECRET??"";
 const redirectUri=vars.SKILLED_CENTRAL_OIDC_REDIRECT_URI??"";
 const keyEncoded=vars.SKILLED_CENTRAL_OIDC_STATE_KEY??"";
 const key=Buffer.from(keyEncoded,"base64");
 if(!HTTPS.test(issuer)||!clientId||clientId.length>256||clientSecret.length<32||
  !keyEncoded||key.length!==32||key.toString("base64")!==keyEncoded)
  throw TypeError("Skilled OIDC configuration incomplete");
 const provider=new URL(issuer);
 if(provider.username||provider.password||provider.search||provider.hash||
    provider.pathname!=="/"||provider.hostname.length===0)
   throw TypeError("OIDC issuer must be a credential-free HTTPS origin");
 const target=new URL(redirectUri);
 if(target.protocol!=="https:"||target.username||target.password||target.search||target.hash||
  target.pathname!=="/auth/titan/academy/callback")
  throw TypeError("Registered OIDC callback must use exact HTTPS Academy path");
 return {enabled:true,issuer,clientId,clientSecret,redirectUri,jwksOrigin:new URL(issuer).origin,stateKey:key};
}
