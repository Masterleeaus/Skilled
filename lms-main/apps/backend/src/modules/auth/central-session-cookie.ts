/**
 * Fixed, host-only session cookie for a Skilled-owned Central-derived session.
 * Does not hold a Logto/ID token. Use only on HTTPS (including local TLS tests).
 */
export const CENTRAL_SESSION_COOKIE = "__Host-academy_sid";
export const CENTRAL_SESSION_TTL_SECONDS = 3600;
const TOKEN=/^[A-Za-z0-9_-]{43,128}$/;
export function validCentralSessionToken(value:unknown):value is string{
  return typeof value==="string" && TOKEN.test(value);
}
export function parseCentralSessionCookie(header:unknown):string|null{
  if(typeof header!=="string"||header.length>8192)return null;
  let token:string|null=null;
  for(const part of header.split(";")){
    const index=part.indexOf("=");
    if(index<1)continue;
    const key=part.slice(0,index).trim();
    if(key!==CENTRAL_SESSION_COOKIE)continue;
    const candidate=part.slice(index+1).trim();
    if(token!==null||!validCentralSessionToken(candidate))return null; // duplicates fail closed
    token=candidate;
  }
  return token;
}
export function centralSessionSetCookie(token:string,maxAgeSeconds=3600):string{
  if(!validCentralSessionToken(token)||!Number.isInteger(maxAgeSeconds)||
      maxAgeSeconds<60||maxAgeSeconds>86400)throw new TypeError("Invalid Skilled session cookie");
  return `${CENTRAL_SESSION_COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
export function centralSessionClearCookie():string{
  return `${CENTRAL_SESSION_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
}
