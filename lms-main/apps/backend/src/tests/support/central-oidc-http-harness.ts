import express from "express";
import request from "supertest";
import {vi} from "vitest";
import {createSkilledCentralOidcRouter} from "../modules/auth/central-oidc-http";
import type {VerifiedCentralDecision} from "../modules/auth/central-verified-handoff";
export const START="/auth/titan/academy/start";
export const CALLBACK="/auth/titan/academy/callback";
export const GOOD_QUERY="?state=statetoken123456&code=codetoken123456";
export const COOKIE="titan_academy_oidc_binding="+"a".repeat(43);
export const SESSION="academy_sid="+"b".repeat(64)+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600";
export const principal:VerifiedCentralDecision["principal"]={issuer:"https://id.example.test",audience:"academy-client",subject:"subject-123456",applicationId:"academy"};
export const decision:VerifiedCentralDecision["decision"]={
 allowed:true,applicationId:"academy",organisationId:"central-org-0001",localUserId:"skilled-user-0001",
 localAccountId:"skilled-account-0001",membershipRevision:1,entitlementRevision:1,linkRevision:1,
};
export function makeApp(changes:Record<string,any>={}){
 const login={
  begin:vi.fn(async()=>({authorizationUrl:changes.redirect??"https://id.example.test/authorize?client_id=academy"})),
  complete:vi.fn(async()=>{if(changes.completionError)throw Error("OIDC denied");return changes.principal??principal;}),
 };
 const authorize=vi.fn(async()=>changes.authorizeError?Promise.reject(new Error("Central offline")):
   (changes.authorized===false?null:changes.decision??decision));
 const handoff=vi.fn(async()=>changes.handoffError?Promise.reject(new Error("session unavailable")):
   (changes.sessionDenied?null:{cookie:changes.cookie??SESSION}));
 const app=express();
 app.use("/auth/titan/academy",createSkilledCentralOidcRouter({
  enabled:changes.enabled!==false,login,authorize,handoff,
  trustedIdentityOrigins:["https://id.example.test"],afterLogin:"/dashboard",
  ...(changes.limiter?{limiter:changes.limiter}:{}),
 }));
 return {app,login,authorize,handoff,request:()=>request(app)};
}
