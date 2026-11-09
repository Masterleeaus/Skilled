import {it,expect} from "vitest";
import {createCentralOidcClient} from "../modules/auth/central/central-oidc";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
import {ISSUER,CLIENT_ID,CLIENT_SECRET,REDIRECT_URI} from "./support/central-sso-fixtures";
it("refuses callback from a different browser before token network request",async()=>{
 let calls=0;const store=createMemoryCentralStateStore();
 const client=createCentralOidcClient({settings:{issuer:ISSUER,clientId:CLIENT_ID,clientSecret:CLIENT_SECRET,redirectUri:REDIRECT_URI},store,verifyIdToken:async()=>{throw Error("should not run")},fetcher:(async()=>{calls++;throw Error("should not fetch")}) as typeof fetch});
 const a=new URL((await client.begin("a".repeat(43))).authorizationUrl);
 await expect(client.complete({state:a.searchParams.get("state")!,code:"code",browserBinding:"b".repeat(43)})).rejects.toMatchObject({reason:"state_invalid"});
 expect(calls).toBe(0);expect(store.size()).toBe(0);
});
