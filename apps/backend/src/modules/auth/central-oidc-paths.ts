export const START="/auth/titan/academy/start";export const CALLBACK="/auth/titan/academy/callback";
export const BINDING="titan_academy_oidc_binding";
export function exactPath(raw:unknown):"start"|"callback"|null{
 if(typeof raw!=="string"||raw.length>2048)return null;
 const path=raw.split("?")[0];if(path!==START&&path!==CALLBACK)return null;
 try{if(new URL(raw,"https://skilled.invalid").pathname!==path)return null;}catch{return null;}
 return path===START?"start":"callback";
}