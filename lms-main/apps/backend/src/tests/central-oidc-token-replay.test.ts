import {it,expect} from "vitest";
import {createCentralOidcClient} from "../modules/auth/central/central-oidc";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
import {ISSUER,CLIENT_ID,CLIENT_SECRET,REDIRECT_URI} from "./support/central-sso-fixtures";
it("invalid callback state never reaches the token endpoint and cannot be replayed",async()=>{
 let calls=0;const store=createMemoryCentralStateStore(),client=createCentralOidcClient({settings:{issuer:ISSUER,clientId:CLIENT_ID,clientSecret:CLIENT_SECRET,redirectUri:REDIRECT_URI},store,verifyIdToken:async()=>{throw Error("not called")},fetcher:(async()=>{calls++;throw Error("not called")}) as typeof fetch});
 const start=new URL((await client.begin("a".repeat(43))).authorizationUrl);
 const original=start.searchParams.get("state")!;
 for(const s of [original+"x","not-a-state","b".repeat(43)])await expect(client.complete({state:s,code:"code",browserBinding:"a".repeat(43)})).rejects.toMatchObject({reason:"state_invalid"});
 expect(calls).toBe(0);expect(store.size()).toBe(1);
});
