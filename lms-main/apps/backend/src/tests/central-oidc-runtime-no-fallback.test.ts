import {describe,it,expect} from "vitest";
import {createDurableOidcState} from "../modules/auth/central-oidc-state-adapter";
describe("no database fallbacks on OIDC replay state",()=>{
 it("does not return credentials after the atomic reader reports no row",async()=>{
  let createCount=0;
  const db={skilledOidcLoginState:{create:async()=>{createCount++;return {}}},
   $queryRaw:async()=>[]} as never;
  const store=createDurableOidcState(db,Buffer.alloc(32,2),()=>1000);
  expect(await store.consume("s".repeat(43),"b".repeat(43))).toBeNull();
  expect(createCount).toBe(0);
 });
});