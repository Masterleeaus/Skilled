import {it,expect} from "vitest";
import {createCentralOidcClient} from "../modules/auth/central/central-oidc";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
import {ISSUER,CLIENT_ID,CLIENT_SECRET,REDIRECT_URI,fetchWithDiscovery} from "./support/central-sso-fixtures";
it("refuses an expired authorization code state with zero token calls",async()=>{
 let now=100000,calls=0;
 const client=createCentralOidcClient({settings:{issuer:ISSUER,clientId:CLIENT_ID,clientSecret:CLIENT_SECRET,redirectUri:REDIRECT_URI},store:createMemoryCentralStateStore(()=>now),clock:()=>now,stateTtlMs:60000,verifyIdToken:async()=>{throw Error("not called")},fetcher:fetchWithDiscovery(async()=>{calls++;throw Error("not called")})});
 const a=new URL((await client.begin("a".repeat(43))).authorizationUrl);now+=61000;
 await expect(client.complete({state:a.searchParams.get("state")!,code:"code",browserBinding:"a".repeat(43)})).rejects.toMatchObject({reason:"state_invalid"});
 expect(calls).toBe(0);
});
