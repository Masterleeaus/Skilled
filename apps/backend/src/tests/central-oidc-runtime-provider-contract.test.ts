import {describe,it,expect} from "vitest";
import {createSkilledVerifiedOidcLogin} from "../modules/auth/central-oidc-verified-login";
describe("provider rejects unsafe inputs before network",()=>{
 it("requires exact HTTPS academy callback URI",()=>{
  expect(()=>createSkilledVerifiedOidcLogin({
   issuer:"https://id.example.test",clientId:"client",clientSecret:"a".repeat(40),
   redirectUri:"https://skilled.example.test/auth/titan/field/callback",
   store:{save:async()=>{},consume:async()=>null}
  })).toThrow();
 });
 it("rejects malformed correlation state and no authenticated token exchange",async()=>{
  const app=createSkilledVerifiedOidcLogin({
   issuer:"https://id.example.test",clientId:"client",clientSecret:"a".repeat(40),
   redirectUri:"https://skilled.example.test/auth/titan/academy/callback",
   store:{save:async()=>{},consume:async()=>null},
   fetcher:(async()=>{throw Error("Must not fetch");}) as typeof fetch
  });
  await expect(app.complete({browserBinding:"invalid",state:"bad",code:"bad"})).rejects.toThrow();
 });
});