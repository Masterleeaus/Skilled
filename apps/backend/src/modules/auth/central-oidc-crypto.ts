/** Adapted to Skilled from Central's apps/control-api/src/oidc-state-crypto.mjs. */
import {createCipheriv,createDecipheriv,randomBytes,createHash} from "node:crypto";
export const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
export const challenge=(value:string)=>createHash("sha256").update(value).digest("base64url");
export function stateKey(encoded:unknown):Buffer{
 if(typeof encoded!=="string")throw TypeError("OIDC_STATE_KEY required");
 const key=Buffer.from(encoded,"base64");
 if(key.length!==32||key.toString("base64")!==encoded)throw TypeError("OIDC_STATE_KEY must be 32 base64 bytes");
 return key;
}
export function sealOidc(value:string,aad:string,key:Buffer):string{
 if(!value||!aad||key.length!==32)throw TypeError("invalid OIDC sealer input");
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);cipher.setAAD(Buffer.from(aad));
 const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
 return "v1."+Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString("base64url");
}
export function openOidc(value:string,aad:string,key:Buffer):string{
 if(typeof value!=="string"||!value.startsWith("v1.")||!aad||key.length!==32)throw Error("OIDC state rejected");
 const data=Buffer.from(value.slice(3),"base64url");if(data.length<29)throw Error("OIDC state rejected");
 const decipher=createDecipheriv("aes-256-gcm",key,data.subarray(0,12));
 decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(data.subarray(12,28));
 return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString("utf8");
}
