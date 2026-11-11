import {CALLBACK} from "./central-oidc-paths";
const VALUE=/^[A-Za-z0-9._~-]{8,512}$/;
export function parseCallback(raw:unknown):{code:string;state:string}|null{
 if(typeof raw!=="string"||raw.length>2048)return null;
 try{const u=new URL(raw,"https://skilled.invalid");if(u.pathname!==CALLBACK)return null;
  if([...u.searchParams.keys()].sort().join(",")!=="code,state")return null;
  const code=u.searchParams.get("code"),state=u.searchParams.get("state");
  return code&&state&&VALUE.test(code)&&VALUE.test(state)?{code,state}:null;
 }catch{return null;}
}