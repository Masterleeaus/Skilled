import express from "express";import request from "supertest";
import {describe,it,expect,vi} from "vitest";
import {createCentralRuntimeRouter} from "../modules/auth/central-runtime-router";
describe("composed OIDC and session HTTP surface",()=>{
 it("disabled by default even with injected dependencies",async()=>{
  const login={begin:vi.fn(async()=>({authorizationUrl:"https://id.example.test/auth"})),
   complete:vi.fn(async()=>({issuer:"https://id.example.test",audience:"academy-client",subject:"central-user-0001",applicationId:"academy" as const}))};
  const app=express();
  app.use(createCentralRuntimeRouter({enabled:false,origin:"https://skilled.example.test",afterLogin:"/dashboard",
   trustedIdentityOrigins:["https://id.example.test"],oidc:login,
   decide:async()=>null,handoff:async()=>null,
   sessions:{authenticate:async()=>null,revoke:async()=>false}}));
  expect((await request(app).get("/auth/titan/academy/start")).status).toBe(404);
  expect((await request(app).get("/auth/titan/academy/session")).status).toBe(404);
  expect(login.begin).not.toHaveBeenCalled();
 });
});