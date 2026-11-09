import {describe,it,expect,beforeAll,afterAll} from "vitest";
import type {PrismaClient} from "@prisma/client";
import {randomBytes} from "node:crypto";
import {createDurableOidcState} from "../modules/auth/central-oidc-state-adapter";
import {createExpiredOidcStatePruner} from "../modules/auth/central-oidc-state-prune";
import {hash} from "../modules/auth/central-oidc-crypto";
const suite=process.env.SKILLED_OIDC_PG_TEST==="1"?describe:describe.skip;
suite("real PostgreSQL OIDC state is single-use across concurrent connections",()=>{
 let a:PrismaClient,b:PrismaClient;
 const key=Buffer.alloc(32,13);
 const state=()=>randomBytes(32).toString("base64url");
 const binding=()=>randomBytes(32).toString("base64url");
 const nonce=()=>randomBytes(32).toString("base64url");
 const expires=()=>Date.now()+180000;
 beforeAll(async()=>{const client=await import("@prisma/client");a=new client.PrismaClient();b=new client.PrismaClient();await a.$connect();await b.$connect()});
 afterAll(async()=>{await a.skilledOidcLoginState.deleteMany({});await a.$disconnect();await b.$disconnect()});
 it("one session stores no plaintext and consumes secrets once",async()=>{
  const s=state(),browser=binding(),n=nonce(),v=nonce(),due=expires();
  const store=createDurableOidcState(a,key);
  await store.save(s,{nonce:n,verifier:v,bindingHash:hash(browser),expiresAt:due});
  const row=await a.skilledOidcLoginState.findUnique({where:{stateHash:hash(s)}});
  expect(row?.sealedNonce).not.toContain(n);
  expect(row?.sealedVerifier).not.toContain(v);
  expect(await store.consume(s,browser)).toEqual({nonce:n,verifier:v,bindingHash:hash(browser),expiresAt:due});
  expect(await store.consume(s,browser)).toBeNull();
 });
 it("wrong browser cannot consume a state intended for another browser",async()=>{
  const s=state(),browser=binding(),other=binding();
  const store=createDurableOidcState(a,key),due=expires();
  await store.save(s,{nonce:nonce(),verifier:nonce(),bindingHash:hash(browser),expiresAt:due});
  expect(await store.consume(s,other)).toBeNull();
  expect(await store.consume(s,browser)).not.toBeNull();
 });
 it("two distinct Prisma connections cannot both consume the same state",async()=>{
  const s=state(),browser=binding(),due=expires(),n=nonce(),v=nonce();
  const first=createDurableOidcState(a,key),second=createDurableOidcState(b,key);
  await first.save(s,{nonce:n,verifier:v,bindingHash:hash(browser),expiresAt:due});
  const outcomes=await Promise.all([first.consume(s,browser),second.consume(s,browser)]);
  expect(outcomes.filter(Boolean)).toHaveLength(1);
  expect(await first.consume(s,browser)).toBeNull();
 });
 it("expired rows cannot be consumed and the scheduled pruner removes them",async()=>{
  const s=state(),browser=binding(),due=Date.now()+120000;
  let clock=Date.now();
  const writer=createDurableOidcState(a,key,()=>clock);
  await writer.save(s,{nonce:nonce(),verifier:nonce(),bindingHash:hash(browser),expiresAt:due});
  clock=due+1000;
  expect(await writer.consume(s,browser)).toBeNull();
  expect(await createExpiredOidcStatePruner(a,()=>new Date(clock))()).toBeGreaterThanOrEqual(1);
 });
 it("wrong AES state encryption key causes strict denial after state consumption",async()=>{
  const s=state(),browser=binding();
  await createDurableOidcState(a,key).save(s,{nonce:nonce(),verifier:nonce(),bindingHash:hash(browser),expiresAt:expires()});
  await expect(createDurableOidcState(b,Buffer.alloc(32,12)).consume(s,browser)).rejects.toThrow();
  expect(await createDurableOidcState(a,key).consume(s,browser)).toBeNull();
 });
});