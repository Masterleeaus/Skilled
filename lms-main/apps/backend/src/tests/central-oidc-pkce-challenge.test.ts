import {it,expect} from "vitest";
import {createHash} from "node:crypto";
import {createCentralOidcClient} from "../modules/auth/central/central-oidc";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
import {ISSUER,CLIENT_ID,CLIENT_SECRET,REDIRECT_URI,fetchWithDiscovery} from "./support/central-sso-fixtures";
it("uses S256 PKCE and one random verifier/nonce per browser login",async()=>{
 const store=createMemoryCentralStateStore();
 const oidc=createCentralOidcClient({settings:{issuer:ISSUER,clientId:CLIENT_ID,clientSecret:CLIENT_SECRET,redirectUri:REDIRECT_URI},store,verifyIdToken:async()=>{throw Error("unused")},fetcher:fetchWithDiscovery(async()=>{throw Error("unused")})});
 const a=new URL((await oidc.begin("a".repeat(43))).authorizationUrl),b=new URL((await oidc.begin("a".repeat(43))).authorizationUrl);
 expect(a.searchParams.get("code_challenge_method")).toBe("S256");
 expect(a.searchParams.get("response_type")).toBe("code");
 expect(a.searchParams.get("state")).not.toBe(b.searchParams.get("state"));
 expect(a.searchParams.get("nonce")).not.toBe(b.searchParams.get("nonce"));
 expect(a.searchParams.get("code_challenge")).not.toBe(b.searchParams.get("code_challenge"));
 expect(a.searchParams.get("code_challenge")?.length).toBe(43);
 expect(store.size()).toBe(2);
});
