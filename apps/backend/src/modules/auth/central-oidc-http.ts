/** Unmounted, opt-in OIDC HTTP adapter. Inject ONLY a cryptographically verified
 * OIDC begin/complete implementation with durable one-use state and PKCE.
 * Central authorization must be carried by authenticated server-side transport.
 */
import {Router} from "express";
import {exactPath} from "./central-oidc-paths";
import {newBinding,setBinding,clearBinding,readBinding} from "./central-oidc-browser-binding";
import {parseCallback} from "./central-oidc-callback-input";
import {trustedRedirect,afterLogin} from "./central-oidc-redirect";
import {createOidcLimiter} from "./central-oidc-limiter";
import type {VerifiedCentralDecision} from "./central-verified-handoff";
type Principal=VerifiedCentralDecision["principal"];
type Decision=VerifiedCentralDecision["decision"];
export function createSkilledCentralOidcRouter(options:{
 enabled:boolean;login:{begin:(v:{browserBinding:string})=>Promise<{authorizationUrl:string}>;
 complete:(v:{browserBinding:string;code:string;state:string})=>Promise<Principal>};
 authorize:(principal:Principal)=>Promise<Decision|null>;
 handoff:(result:VerifiedCentralDecision)=>Promise<{cookie:string}|null>;
 trustedIdentityOrigins:readonly string[];afterLogin:string;
 limiter?:ReturnType<typeof createOidcLimiter>;
}){
 const after=afterLogin(options?.afterLogin);
 if(!after||typeof options?.login?.begin!=="function"||typeof options.login.complete!=="function"||
 typeof options.authorize!=="function"||typeof options.handoff!=="function"||
 !Array.isArray(options.trustedIdentityOrigins)||options.trustedIdentityOrigins.length===0)
 throw TypeError("Verified Central OIDC dependencies required");
 const limit=options.limiter??createOidcLimiter();
 const router=Router();
 router.use((req,res,next)=>{
  res.set("Cache-Control","no-store").set("X-Content-Type-Options","nosniff");
  if(options.enabled!==true){res.status(404).json({error:"not_found"});return;}
  if(!exactPath(req.originalUrl)){res.status(404).json({error:"not_found"});return;}
  if(req.method!=="GET"){res.status(405).set("Allow","GET").json({error:"method_not_allowed"});return;}
  next();
 });
 router.get("/start",async(req,res)=>{
  if(req.originalUrl.includes("?")){res.status(400).json({error:"unexpected_query"});return;}
  if(!limit.take(req.ip??"unknown")){res.status(429).json({error:"rate_limited"});return;}
  const binding=newBinding();
  try{const result=await options.login.begin({browserBinding:binding});
   const url=trustedRedirect(result.authorizationUrl,options.trustedIdentityOrigins);
   if(!url)throw Error("untrusted_redirect");
   res.set("Set-Cookie",setBinding(binding)).redirect(303,url);
  }catch{res.status(503).json({error:"login_unavailable"});}
 });
 router.get("/callback",async(req,res)=>{
  if(!limit.take(req.ip??"unknown")){res.status(429).json({error:"rate_limited"});return;}
  const input=parseCallback(req.originalUrl),binding=readBinding(req.headers.cookie);
  if(!input||!binding){res.set("Set-Cookie",clearBinding()).status(400).json({error:"invalid_callback"});return;}
  try{
   // complete must consume the state and validate the ID-token nonce/signature.
   const principal=await options.login.complete({...input,browserBinding:binding});
   if(!principal||principal.applicationId!=="academy"||!principal.issuer||!principal.subject){
    res.set("Set-Cookie",clearBinding()).status(401).json({error:"login_denied"});return;}
   const decision=await options.authorize(principal);
   if(!decision||decision.allowed!==true||decision.applicationId!=="academy"){
    res.set("Set-Cookie",clearBinding()).status(403).json({error:"account_not_authorised"});return;}
   const session=await options.handoff({principal,decision});
   if(!session||typeof session.cookie!=="string"||
    !/^academy_sid=[A-Za-z0-9_-]{43,128}; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=(?:[1-9][0-9]{1,4})$/.test(session.cookie)){
    res.set("Set-Cookie",clearBinding()).status(403).json({error:"account_not_authorised"});return;}
   res.set("Set-Cookie",[clearBinding(),session.cookie]).redirect(303,after);
  }catch{res.set("Set-Cookie",clearBinding()).status(401).json({error:"login_failed"});}
 });
 return router;
}