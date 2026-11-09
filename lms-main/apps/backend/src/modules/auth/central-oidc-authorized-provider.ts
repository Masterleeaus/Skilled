/** Real OIDC code/PKCE crypto wired to the durable PostgreSQL state store. */
import type {PrismaClient} from "@prisma/client";
import {createSkilledVerifiedOidcLogin} from "./central-oidc-verified-login";
import {createDurableOidcState} from "./central-oidc-state-adapter";
import type {SkilledOidcConfig} from "./central-oidc-config";
export function createConfiguredSkilledOidcProvider(config:SkilledOidcConfig,db:PrismaClient,
 opts:{fetcher?:typeof fetch;clock?:()=>number}={}){
 if(!config?.enabled)throw TypeError("OIDC disabled");
 const state=createDurableOidcState(db,config.stateKey,opts.clock);
 return createSkilledVerifiedOidcLogin({
  issuer:config.issuer,clientId:config.clientId,clientSecret:config.clientSecret,
  redirectUri:config.redirectUri,store:state,fetcher:opts.fetcher,clock:opts.clock
 });
}
