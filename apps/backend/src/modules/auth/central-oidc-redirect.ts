export function trustedRedirect(raw:unknown,origins:readonly string[]):string|null{
 if(typeof raw!=="string"||raw.length>4096||!Array.isArray(origins)||!origins.length)return null;
 try{const u=new URL(raw);if(u.protocol!=="https:"||u.username||u.password||u.hash)return null;
 return origins.includes(u.origin)?u.href:null;}catch{return null}
}
export function afterLogin(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length>1024||!raw.startsWith("/")||raw.startsWith("//")||
 /[\\\p{Cc}]/u.test(raw))return null;
 try{const u=new URL(raw,"https://skilled.invalid");return u.origin==="https://skilled.invalid"?raw:null;}catch{return null}
}