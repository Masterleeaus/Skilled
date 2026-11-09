import {describe,it,expect} from "vitest";
import {createSkilledVerifiedOidcLogin} from "../modules/auth/central-oidc-verified-login";
import {fakeFetch,issuer,clientId,nonce,now,jwt,response,jwk} from "./support/central-oidc-rsa-fixture";
describe("full OIDC code-PKCE and verified callback composition",()=>{
 const binding="a".repeat(43);
 it("starts one-use state and signs user identity after code exchange",async()=>{
  let saved:any=null,consumed=false;const fetcher=fakeFetch();
  const client=createSkilledVerifiedOidcLogin({
   issuer,clientId,clientSecret:"secret-of-at-least-16-characters",
   redirectUri:"https://skilled.example.test/auth/titan/academy/callback",fetcher,clock:()=>now,
   store:{
    save:async(state,record)=>{saved={state,record};},
    consume:async(state,b)=>{expect(state).toBe(saved.state);expect(b).toBe(binding);consumed=true;
     return {...saved.record,nonce};}
   }
  });
  const begin=await client.begin({browserBinding:binding});
  const url=new URL(begin.authorizationUrl);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("nonce")).toBe(saved.record.nonce);
  const principal=await client.complete({browserBinding:binding,code:"code-123456789",state:saved.state});
  expect(consumed).toBe(true);
  expect(principal).toEqual({issuer,subject:"central-user-0001",audience:clientId,applicationId:"academy"});
 });
 it("does not exchange code when the durable state is unavailable",async()=>{
  const client=createSkilledVerifiedOidcLogin({
   issuer,clientId,clientSecret:"secret-of-at-least-16-characters",
   redirectUri:"https://skilled.example.test/auth/titan/academy/callback",fetcher:fakeFetch(),clock:()=>now,
   store:{save:async()=>{},consume:async()=>null}
  });
  await expect(client.complete({browserBinding:binding,code:"code-123456789",state:"s".repeat(43)})).rejects.toThrow();
 });
});