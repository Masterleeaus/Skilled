import {describe,it,expect,vi} from "vitest";
import {createAtomicOidcStateReader} from "../modules/auth/central-oidc-state-sql";
import {hash,sealOidc} from "../modules/auth/central-oidc-crypto";
describe("PostgreSQL OIDC state atomic DELETE RETURNING",()=>{
 const key=Buffer.alloc(32,7),state="s".repeat(43),binding="b".repeat(43),digest=hash(state);
 const makeRow=()=>({
  stateHash:digest,bindingHash:hash(binding),expiresAt:new Date(5000),
  sealedNonce:sealOidc("n".repeat(43),"academy|"+digest+"|nonce",key),
  sealedVerifier:sealOidc("v".repeat(43),"academy|"+digest+"|verifier",key)
 });
 it("consumes a matched row and decrypts both distinct fields",async()=>{
  const query=vi.fn(async()=>[makeRow()]);
  const consumed=await createAtomicOidcStateReader({$queryRaw:query} as never,key,()=>1000)(state,binding);
  expect(consumed).toEqual({nonce:"n".repeat(43),verifier:"v".repeat(43),expiresAt:5000});
  expect(query).toHaveBeenCalledOnce();
 });
 it("rejects missing, malformed and already consumed state",async()=>{
  const query=vi.fn(async()=>[]);
  const reader=createAtomicOidcStateReader({$queryRaw:query} as never,key,()=>1000);
  expect(await reader(state,binding)).toBeNull();expect(await reader("bad",binding)).toBeNull();
  expect(query).toHaveBeenCalledOnce();
 });
 it("rejects a changed encrypted field rather than granting access",async()=>{
  const row=makeRow();row.sealedNonce=row.sealedVerifier;
  const reader=createAtomicOidcStateReader({$queryRaw:async()=>[row]} as never,key,()=>1000);
  await expect(reader(state,binding)).rejects.toThrow();
 });
});