import {describe,it,expect} from "vitest";
import {discoverOidc} from "../modules/auth/central-oidc-discovery";
import {fakeFetch,issuer} from "./support/central-oidc-rsa-fixture";
describe("OIDC trusted metadata discovery",()=>{
 it("loads three configured endpoints from fixed issuer",async()=>{
  expect(await discoverOidc(issuer,fakeFetch())).toEqual({
   authorizationEndpoint:issuer+"/authorize",tokenEndpoint:issuer+"/token",jwksUri:issuer+"/jwks"});
 });
 it.each([
  {issuer:"https://evil.example.test"},
  {authorization_endpoint:"http://id.example.test/authorize"},
  {token_endpoint:"https://evil.example.test/token"},
  {jwks_uri:"https://id.example.test/jwks#fragment"},
 ])("rejects malicious metadata %j",async change=>await expect(discoverOidc(issuer,fakeFetch(change))).rejects.toThrow());
 it("rejects insecure issuer",async()=>await expect(discoverOidc("http://id.example.test",fakeFetch())).rejects.toThrow());
});