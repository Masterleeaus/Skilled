/**
 * Optional Skilled-local Central session status/logout HTTP surface.
 * Factory only, NOT mounted by default. The OIDC login/callback route is owned
 * by Central's verified OIDC adapter and is intentionally absent here.
 */
import { Router,type Request } from "express";
import { centralSessionClearCookie,parseCentralSessionCookie } from "./central-session-cookie";
import type { SessionIdentity } from "./central-session-store";

export type CentralHttpSessions={
  authenticate(token:string):Promise<SessionIdentity|null>;
  revoke(token:string):Promise<boolean>;
};
function exactOrigin(value:string):string{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash||u.pathname!=="/"||
      u.origin!==value)throw new TypeError("Central logout requires exact HTTPS origin");
  return value;
}
function safeMutation(req:Request,origin:string){
  const requestOrigin=req.header("origin");
  const fetchSite=req.header("sec-fetch-site");
  return requestOrigin===origin&&fetchSite==="same-origin";
}
export function createSkilledCentralSessionHttp(options:{
  enabled:boolean;origin:string;sessions:CentralHttpSessions;
}){
  if(!options?.sessions||typeof options.sessions.authenticate!=="function"||
      typeof options.sessions.revoke!=="function")throw new TypeError("Session store required");
  // A feature flag must be explicitly true. No auto-enable or inferred readiness.
  const router=Router();
  router.use((_req,res,next)=>{
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Content-Type-Options","nosniff");
    if(options.enabled!==true){res.status(404).json({error:"not_found"});return;}
    next();
  });
  const origin=exactOrigin(options.origin);
  router.get("/session",async(req,res,next)=>{
    const token=parseCentralSessionCookie(req.headers.cookie);
    if(!token){res.status(401).json({error:"unauthenticated"});return;}
    try{
      const account=await options.sessions.authenticate(token);
      if(!account){res.status(401).json({error:"unauthenticated"});return;}
      res.status(200).json({authenticated:true,
        userId:account.userId,companyId:account.companyId,role:account.role});
    }catch(error){next(error);}
  });
  router.post("/logout",async(req,res,next)=>{
    if(!safeMutation(req,origin)){res.status(403).json({error:"origin_denied"});return;}
    const token=parseCentralSessionCookie(req.headers.cookie);
    if(!token){res.status(401).json({error:"unauthenticated"});return;}
    try{
      // Check current session before revocation: unknown tokens cannot revoke others.
      const identity=await options.sessions.authenticate(token);
      if(!identity){res.status(401).json({error:"unauthenticated"});return;}
      const revoked=await options.sessions.revoke(token);
      if(!revoked){res.status(503).json({error:"logout_unavailable"});return;}
      res.setHeader("Set-Cookie",centralSessionClearCookie());
      res.status(204).end();
    }catch(error){next(error);}
  });
  // Explicit denial for unexpected methods; no GET logout/CSRF side effect.
  router.all(["/session","/logout"],(_req,res)=>res.status(405).json({error:"method_not_allowed"}));
  return router;
}
