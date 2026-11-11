import {it,expect} from "vitest";
import {centralSsoProblems, CENTRAL_SSO_CALLBACK_PATH} from "../config/central-sso";
import {ISSUER,CLIENT_ID,CLIENT_SECRET,JWKS_URI} from "./support/central-sso-fixtures";
it("enforces the single pre-registered HTTPS callback",()=>{
 const config={enabled:true,issuer:ISSUER,clientId:CLIENT_ID,clientSecret:CLIENT_SECRET,jwksUri:JWKS_URI,redirectUri:"https://skilled.example"+CENTRAL_SSO_CALLBACK_PATH};
 expect(centralSsoProblems(config)).toEqual([]);
 for(const redirectUri of ["http://skilled.example"+CENTRAL_SSO_CALLBACK_PATH,"https://skilled.example/auth/callback","https://skilled.example"+CENTRAL_SSO_CALLBACK_PATH+"?x=1"])
  expect(centralSsoProblems({...config,redirectUri})).not.toEqual([]);
});
