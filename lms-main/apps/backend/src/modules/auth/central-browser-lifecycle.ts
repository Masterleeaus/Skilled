/** Central browser session lifecycle. Deliberately NOT mounted in app.ts.
 * Mount ONLY at /auth/titan/academy after the Central decision API, issuer,
 * DB migrations, proxy and two-tenant acceptance tests have been verified.
 */
import { randomBytes } from "node:crypto";
import { Router, type Request } from "express";
import {allowOidcCallbackHeaders} from "./central-oidc-callback-origin";
import {centralSessionClearCookie,centralSessionSetCookie,parseCentralSessionCookie,CENTRAL_SESSION_TTL_SECONDS,validCentralSessionToken} from "./central-session-cookie";
import type {SessionIdentity} from "./central-session-store";

const CORRELATION="academy_oidc_binding";
const BIND=/^[A-Za-z0-9_-]{43}$/;
const COOKIE_OPTS="Path=/auth/titan/academy; Secure; HttpOnly; SameSite=Lax";
type Completion={cookie:string;expiresAt:Date;identity:unknown};
export type CentralBrowserDeps={
  origin:string;
  authorizationOrigin:string;
  begin:(binding:string)=>Promise<{authorizationUrl:string}>;
  complete:(v:{browserBinding:string;state:string;code:string})=>Promise<Completion|null>;
  authenticate:(token:unknown)=>Promise<SessionIdentity|null>;
  revoke:(token:unknown)=>Promise<boolean>;
  generateBinding?:()=>string;
};
function cookie(header:unknown,name:string):string|null{
 if(typeof header!=="string"||header.length>8192)return null;
 let value:string|null=null;
 for(const part of header.split(";")){
  const i=part.indexOf("=");
  if(i<0||part.slice(0,i).trim()!==name)continue;
  const candidate=part.slice(i+1).trim();
  if(value!==null||!BIND.test(candidate))return null;
  value=candidate;
 }
 return value;
}
const fail=(res:{status:(n:number)=>any;json:(v:unknown)=>unknown},status=401)=>
 res.status(status).json({success:false,message:"Central session unavailable"});
const isSameOrigin=(request:Request,origin:string)=>{
 const header=request.headers.origin;
 return typeof header==="string"&&header===origin;
};
export function createCentralBrowserLifecycle(deps:CentralBrowserDeps){
 if(!deps||typeof deps.begin!=="function"||typeof deps.complete!=="function"||
    typeof deps.authenticate!=="function"||typeof deps.revoke!=="function")
    throw new TypeError("Trusted Central lifecycle dependencies required");
 const parsed=new URL(deps.origin);
 if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.search||
    parsed.hash||parsed.pathname!=="/"||deps.origin!==parsed.origin)
    throw new TypeError("Exact HTTPS application origin required");
 const issuer=new URL(deps.authorizationOrigin);
 if(issuer.protocol!=="https:"||issuer.username||issuer.password||issuer.search||
    issuer.hash||issuer.pathname!=="/"||deps.authorizationOrigin!==issuer.origin)
    throw new TypeError("Exact trusted OIDC authorization origin required");
 const router=Router(),nextBinding=deps.generateBinding??(()=>randomBytes(32).toString("base64url"));
 router.use((_req,res,next)=>{res.setHeader("Cache-Control","no-store");res.setHeader("Pragma","no-cache");next()});
 router.get("/start",async(_req,res)=>{
  try{
   const binding=nextBinding();
   if(!BIND.test(binding))return fail(res,503);
   const result=await deps.begin(binding);
   const destination=new URL(result.authorizationUrl);
   if(destination.protocol!=="https:"||destination.origin!==deps.authorizationOrigin||
      destination.username||destination.password||destination.hash||
      destination.searchParams.get("response_type")!=="code"||
      destination.searchParams.get("code_challenge_method")!=="S256"||
      !BIND.test(destination.searchParams.get("state")??"")||
      !BIND.test(destination.searchParams.get("nonce")??"")||
      !BIND.test(destination.searchParams.get("code_challenge")??"")||
      destination.searchParams.getAll("state").length!==1||
      destination.searchParams.getAll("nonce").length!==1||
      destination.searchParams.getAll("code_challenge").length!==1||
      destination.searchParams.getAll("client_id").length!==1||
      destination.searchParams.getAll("redirect_uri").length!==1||
      destination.searchParams.getAll("response_type").length!==1||
      destination.searchParams.getAll("code_challenge_method").length!==1||
      destination.searchParams.get("redirect_uri")!==deps.origin+"/auth/titan/academy/callback")
     
     return fail(res,503);
   res.setHeader("Set-Cookie",CORRELATION+"="+binding+"; "+COOKIE_OPTS+"; Max-Age=300");
   res.redirect(302,destination.href);
  }catch{fail(res,503)}
 });
 router.get("/callback",async(req,res)=>{
  res.setHeader("Set-Cookie",CORRELATION+"=; "+COOKIE_OPTS+"; Max-Age=0");
  if(!allowOidcCallbackHeaders(req.headers as Record<string,string|string[]|undefined>))
    return fail(res);
  const binding=cookie(req.headers.cookie,CORRELATION);
  if(!binding||typeof req.query.state!=="string"||!BIND.test(req.query.state)||
     typeof req.query.code!=="string"||req.query.code.length<8||req.query.code.length>512)
    return fail(res);
  try{
   const session=await deps.complete({browserBinding:binding,state:req.query.state,code:req.query.code});
   if(!session||typeof session.cookie!=="string"||
      !(session.expiresAt instanceof Date)||!Number.isFinite(session.expiresAt.getTime())||
      session.expiresAt.getTime()<=Date.now())return fail(res);
   // The completion engine must never inject arbitrary response headers or cookies.
   const match=/^academy_sid=([A-Za-z0-9_-]{43,128}); Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=(\d+)$/.exec(session.cookie);
   if(!match||!validCentralSessionToken(match[1])||
      Number(match[2])<60||Number(match[2])>CENTRAL_SESSION_TTL_SECONDS||
      session.cookie!==centralSessionSetCookie(match[1],Number(match[2])))
     return fail(res);
   // Clear OIDC binding and set the tenant-bound opaque session, never the IdP token.
   res.setHeader("Set-Cookie",[CORRELATION+"=; "+COOKIE_OPTS+"; Max-Age=0",session.cookie]);
   return res.redirect(303,deps.origin+"/");
  }catch{return fail(res)}
 });
 router.get("/session",async(req,res)=>{
  const token=parseCentralSessionCookie(req.headers.cookie);
  if(!token)return fail(res);
  try{
   const identity=await deps.authenticate(token);
   if(!identity)return fail(res);
   return res.status(200).json({success:true,identity:{
    userId:identity.userId,companyId:identity.companyId,role:identity.role
   }});
  }catch{return fail(res)}
 });
 router.post("/logout",async(req,res)=>{
  if(!isSameOrigin(req,deps.origin))return fail(res,403);
  const token=parseCentralSessionCookie(req.headers.cookie);
  if(token){try{await deps.revoke(token)}catch{/* still clear local browser credential */}}
  res.setHeader("Set-Cookie",centralSessionClearCookie());
  return res.status(200).json({success:true});
 });
 return router;
}
