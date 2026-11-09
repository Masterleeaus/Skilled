import {describe,it,expect} from "vitest";
import {createPrismaOidcStateStore} from "../modules/auth/central-oidc-state-store";
import {hash} from "../modules/auth/central-oidc-crypto";
describe("durable state writer never stores plaintext",()=>{
 it("encrypts nonce and PKCE and stores SHA256 state and browser digest",async()=>{
  let data:any;const clock=()=>1000;const writer=createPrismaOidcStateStore({skilledOidcLoginState:{
   create:async(v:unknown)=>{data=(v as any).data;return data}
  }} as never,Buffer.alloc(32,1),clock);
  await writer.save("s".repeat(43),{nonce:"n".repeat(43),verifier:"v".repeat(43),
   bindingHash:hash("b".repeat(43)),expiresAt:100000});
  expect(data.stateHash).toBe(hash("s".repeat(43)));expect(data.bindingHash).toBe(hash("b".repeat(43)));
  expect(JSON.stringify(data)).not.toContain("n".repeat(43));
  expect(JSON.stringify(data)).not.toContain("v".repeat(43));
 });
});