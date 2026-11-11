/** Per-worker fallback. Enforce global limits at the reverse proxy. */
export function createOidcLimiter(limit=20,windowMs=60000,clock=()=>Date.now()){
 if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(windowMs)||windowMs<1000)throw TypeError("Invalid limiter");
 const rows=new Map<string,{count:number,until:number}>();
 return {take(key:string){if(!key||key.length>200)return false;const now=clock();if(!Number.isFinite(now))return false;
  const row=rows.get(key);if(!row||row.until<=now){rows.set(key,{count:1,until:now+windowMs});return true;}
  if(row.count>=limit)return false;row.count++;return true;}};
}