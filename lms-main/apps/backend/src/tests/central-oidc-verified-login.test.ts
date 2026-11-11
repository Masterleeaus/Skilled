import {describe,it,expect} from "vitest";
import {createSkilledVerifiedOidcLogin} from "../modules/auth/central-oidc-verified-login";
import { fakeFetch, issuer, clientId, now, jwt, response } from "./support/central-oidc-rsa-fixture";
describe("full OIDC code-PKCE and verified callback composition",()=>{
 const binding="a".repeat(43);
 it("starts one-use state and signs user identity after code exchange",async()=>{
  type SavedPending={state:string;record:{nonce:string;verifier:string;bindingHash:string;expiresAt:number}};
  let saved:SavedPending|undefined,consumed=false;const fetcher=fakeFetch();
  const signingFetch=(async(url:RequestInfo|URL,init?:RequestInit)=>{
   if(String(url).endsWith("/token"))return response({id_token:jwt({nonce:saved!.record.nonce})});
   return fetcher(url,init);
  }) as typeof fetch;
  const client=createSkilledVerifiedOidcLogin({
   issuer,clientId,clientSecret:"secret-of-at-least-16-characters",
   redirectUri:"https://skilled.example.test/auth/titan/academy/callback",fetcher:signingFetch,clock:()=>now,
   store:{
    save:async(state,record)=>{saved={state,record};},
    consume:async(state,b)=>{expect(state).toBe(saved!.state);expect(b).toBe(binding);consumed=true;
     return {...saved!.record};}
   }
  });
  const begin=await client.begin({browserBinding:binding});
  const url=new URL(begin.authorizationUrl);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("nonce")).toBe(saved!.record.nonce);
  const principal=await client.complete({browserBinding:binding,code:"code-123456789",state:saved!.state});
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