import {describe,it,expect} from "vitest";
import {createDurableOidcState} from "../modules/auth/central-oidc-state-adapter";
describe("atomic OIDC store adapter dependencies",()=>{
 it("refuses to silently replace SQL consume with plain Prisma deleteMany",()=>{
  expect(()=>createDurableOidcState({skilledOidcLoginState:{create:async()=>({})}} as never,Buffer.alloc(32))).toThrow();
 });
 it("rejects absent or short state encryption key",()=>{
  expect(()=>createDurableOidcState({skilledOidcLoginState:{},$queryRaw:async()=>[]} as never,Buffer.alloc(16))).toThrow();
 });
});