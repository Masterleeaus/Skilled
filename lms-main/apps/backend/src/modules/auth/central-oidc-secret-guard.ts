/** No secrets in audit telemetry or error response payloads. */
const SECRET=/token|secret|nonce|verifier|cookie|code|state|authorization|password|subject|email/i;
export function sanitizedOidcFields(input:Record<string,unknown>){
 const safe:Record<string,string|number|boolean>={};
 for(const [key,value] of Object.entries(input)){
  if(SECRET.test(key))continue;
  if(typeof value==="string"){if(value.length>100||/\p{Cc}/u.test(value))continue;safe[key]=value;}
  else if(typeof value==="boolean"||typeof value==="number"&&Number.isFinite(value))safe[key]=value;
 }
 return safe;
}
