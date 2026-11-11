import {randomBytes} from "node:crypto";import {BINDING} from "./central-oidc-paths";
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
export const newBinding=()=>randomBytes(32).toString("base64url");
export function setBinding(token:string){
 if(!TOKEN.test(token))throw TypeError("Invalid OIDC binding");
 return `${BINDING}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`;
}
export const clearBinding=()=>`${BINDING}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
export function readBinding(header:unknown):string|null{
 if(typeof header!=="string"||header.length>8192)return null;
 const found:string[]=[];
 for(const pair of header.split(";")){const i=pair.indexOf("=");if(i>0&&pair.slice(0,i).trim()===BINDING)found.push(pair.slice(i+1).trim());}
 return found.length===1&&TOKEN.test(found[0])?found[0]:null;
}