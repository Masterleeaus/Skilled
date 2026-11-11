import {describe,it,expect,vi} from "vitest";
import {createSkilledJwksReader} from "../modules/auth/central-oidc-jwks";
import {fakeFetch,jwk,issuer,response} from "./support/central-oidc-rsa-fixture";
describe("OIDC trusted JWKS",()=>{
 it("fetches and caches valid key set",async()=>{
  const fetcher=vi.fn(fakeFetch());
  const read=createSkilledJwksReader(issuer+"/jwks",fetcher);
  expect(await read()).toEqual([jwk]);expect(await read()).toEqual([jwk]);expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it("refuses http, URLs with credentials and wrong host",()=>{
  expect(()=>createSkilledJwksReader("http://id.example.test/jwks")).toThrow();
  expect(()=>createSkilledJwksReader("https://user:pass@id.example.test/jwks")).toThrow();
 });
 it("rejects keyset over 64 entries",async()=>{
  const fetcher=(async()=>response({keys:Array.from({length:65},()=>jwk)})) as typeof fetch;
  await expect(createSkilledJwksReader(issuer+"/jwks",fetcher)()).rejects.toThrow();
 });
});