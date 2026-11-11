import {describe,it,expect} from "vitest";
import {sanitizedOidcFields} from "../modules/auth/central-oidc-secret-guard";
describe("OIDC sanitized audit fields",()=>{
 it("removes secret, code, nonce, subject and email data",()=>{
  const safe=sanitizedOidcFields({status:"denied",loginState:"secret",token:"abcdef",
   subject:"private",clientSecret:"private",email:"private",count:2,enabled:true});
  expect(safe).toEqual({status:"denied",count:2,enabled:true});
 });
 it("refuses control characters and long field contents",()=>{
  expect(sanitizedOidcFields({reason:"unexpected\nerror",input:"x".repeat(500)})).toEqual({});
 });
});