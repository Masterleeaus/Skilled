/** Opt-in composition; this factory never mounts routes onto the production app. */
import {Router} from "express";
import {createSkilledCentralOidcRouter} from "./central-oidc-http";
import {createSkilledCentralSessionHttp} from "./central-session-http";
import type {VerifiedCentralDecision} from "./central-verified-handoff";
import type {CentralHttpSessions} from "./central-session-http";
type Identity=VerifiedCentralDecision["principal"];
type Decision=VerifiedCentralDecision["decision"];
export function createCentralRuntimeRouter(input:{
 enabled:boolean;origin:string;afterLogin:string;trustedIdentityOrigins:readonly string[];
 oidc:{begin:(x:{browserBinding:string})=>Promise<{authorizationUrl:string}>;
 complete:(x:{browserBinding:string;code:string;state:string})=>Promise<Identity>};
 decide:(identity:Identity)=>Promise<{issuer:string;subject:string;decision:Decision}|null>;
 handoff:(v:VerifiedCentralDecision)=>Promise<{cookie:string}|null>;
 sessions:CentralHttpSessions;
}){
 if(!input||typeof input.decide!=="function")throw TypeError("Central router dependencies missing");
 const router=Router();
 const authorize=async(identity:Identity)=>{
  const envelope=await input.decide(identity);
  if(!envelope||envelope.issuer!==identity.issuer||envelope.subject!==identity.subject)return null;
  return envelope.decision;
 };
 router.use("/auth/titan/academy",createSkilledCentralOidcRouter({
  enabled:input.enabled,login:input.oidc,authorize,handoff:input.handoff,
  trustedIdentityOrigins:input.trustedIdentityOrigins,afterLogin:input.afterLogin
 }));
 router.use("/auth/titan/academy",createSkilledCentralSessionHttp({
  enabled:input.enabled,origin:input.origin,sessions:input.sessions
 }));
 return router;
}