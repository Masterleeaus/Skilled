import {describe,it,expect} from "vitest";
import {fakePrisma,resetFakeDb,rows} from "./support/fake-prisma";
import {createPrismaOidcStateStore} from "../modules/auth/central-oidc-state-store";
import {hash} from "../modules/auth/central-oidc-crypto";
describe("Prisma OIDC one-use state persistence",()=>{
 it("persists SHA-256 state and sealed verifier/nonce only",async()=>{
  resetFakeDb();const key=Buffer.alloc(32,3);
  const store=createPrismaOidcStateStore(fakePrisma as never,key,()=>1000);
  await store.save("a".repeat(43),{nonce:"b".repeat(43),verifier:"c".repeat(43),bindingHash:hash("d".repeat(43)),expiresAt:5000});
  const result=rows("skilledOidcLoginState");
  expect(result).toHaveLength(1);expect(result[0].stateHash).toBe(hash("a".repeat(43)));
  expect(result[0].sealedVerifier).not.toContain("cccc");
  expect(result[0].sealedNonce).not.toContain("bbbb");
  expect(result[0].applicationId).toBe("academy");
 });
 it("rejects state already expired or invalid digest",async()=>{
  resetFakeDb();const store=createPrismaOidcStateStore(fakePrisma as never,Buffer.alloc(32),()=>1000);
  await expect(store.save("a".repeat(43),{nonce:"b".repeat(43),verifier:"c".repeat(43),bindingHash:"invalid",expiresAt:2000})).rejects.toThrow();
  await expect(store.save("a".repeat(43),{nonce:"b".repeat(43),verifier:"c".repeat(43),bindingHash:hash("x"),expiresAt:900})).rejects.toThrow();
 });
});