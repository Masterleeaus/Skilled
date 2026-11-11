import {describe,it,expect} from "vitest";
import {createConfiguredSkilledOidcProvider} from "../modules/auth/central-oidc-authorized-provider";
import {parseSkilledOidcConfig} from "../modules/auth/central-oidc-config";
describe("OIDC rollout switch",()=>{
 it("a disabled environment never returns a sign-in provider",()=>{
  const config=parseSkilledOidcConfig({SKILLED_CENTRAL_OIDC_ENABLED:"false"});expect(config).toBeNull();
  expect(()=>createConfiguredSkilledOidcProvider(config as never,{} as never)).toThrow();
 });
 it("enabled settings without database dependencies fail closed",()=>{
  expect(()=>createConfiguredSkilledOidcProvider({enabled:true,stateKey:Buffer.alloc(32),
   clientId:"client",clientSecret:"secret",issuer:"https://id.example.test",redirectUri:"https://skilled.example.test/auth/titan/academy/callback",
   jwksOrigin:"https://id.example.test"},{} as never)).toThrow();
 });
});