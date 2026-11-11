import {describe,it,expect} from "vitest";
import {createExpiredOidcStatePruner} from "../modules/auth/central-oidc-state-prune";
describe("OIDC state expiry pruning",()=>{
 it("deletes only records at or before the current time",async()=>{
  let where:unknown;const prune=createExpiredOidcStatePruner({skilledOidcLoginState:{
   deleteMany:async(args:unknown)=>{where=args;return {count:2}}
  }} as never,()=>new Date(3000));
  expect(await prune()).toBe(2);expect(where).toEqual({where:{expiresAt:{lte:new Date(3000)}}});
 });
 it("rejects a broken clock",async()=>await expect(createExpiredOidcStatePruner({skilledOidcLoginState:{}} as never,
 ()=>new Date("invalid"))()).rejects.toThrow());
});