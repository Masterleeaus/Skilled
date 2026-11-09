import {randomBytes} from "node:crypto";
import {challenge,hash} from "./central-oidc-crypto";
export function createOidcChallenge(){
 const state=randomBytes(32).toString("base64url");
 const nonce=randomBytes(32).toString("base64url");
 const verifier=randomBytes(32).toString("base64url");
 return {state,nonce,verifier,codeChallenge:challenge(verifier)};
}
export const browserBindingHash=(binding:string)=>hash(binding);
