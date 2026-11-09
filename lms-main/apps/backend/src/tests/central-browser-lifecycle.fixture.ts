import {vi} from "vitest";
import express from "express";
import request from "supertest";
import {createCentralBrowserLifecycle} from "../modules/auth/central-browser-lifecycle";
import {centralSessionSetCookie} from "../modules/auth/central-session-cookie";
export const ORIGIN="https://skilled.example.test";
export const BINDING="b".repeat(43);
export const STATE="s".repeat(43);
export const TOKEN="t".repeat(64);
export const URL="https://central.example.test/authorize?response_type=code&code_challenge_method=S256&state="+STATE+"&nonce="+"n".repeat(43);
export const callback="/auth/titan/academy/callback?state="+STATE+"&code=valid-code-123";
export const identity={userId:"user-a",companyId:"company-a",role:"STUDENT" as const,centralOrganisationId:"org-a",localAccountId:"account-a"};
export function harness(){
 const begin=vi.fn(async()=>({authorizationUrl:URL}));
 const complete=vi.fn(async()=>({cookie:centralSessionSetCookie(TOKEN),expiresAt:new Date(Date.now()+3600000),identity}));
 const authenticate=vi.fn(async()=>identity);
 const revoke=vi.fn(async()=>true);
 const deps={origin:ORIGIN,begin,complete,authenticate,revoke,generateBinding:()=>BINDING};
 const app=express();app.use("/auth/titan/academy",createCentralBrowserLifecycle(deps));
 const agent=request(app);
 return {app,agent,deps,begin,complete,authenticate,revoke};
}
export function initialCookie(){return "academy_oidc_binding="+BINDING;}
export function sessionCookie(){return "academy_sid="+TOKEN;}
