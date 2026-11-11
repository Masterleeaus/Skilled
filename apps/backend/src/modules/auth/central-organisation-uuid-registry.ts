/** Operator-controlled mapping: Central RLS UUID vs externally verified Logto org ID. */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPAQUE=/^[A-Za-z0-9._:-]{8,128}$/;
export function parseCentralOrganisationRegistry(raw:unknown):ReadonlyMap<string,string>{
 if(typeof raw!=="string"||raw.length<2||raw.length>65536)throw TypeError("Trusted Central organisation registry required");
 let parsed:unknown;
 try{parsed=JSON.parse(raw)}catch{throw TypeError("Invalid Central organisation registry")}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw TypeError("Invalid Central organisation registry");
 const entries=Object.entries(parsed);
 if(entries.length<1||entries.length>500)throw TypeError("Empty or oversized Central organisation registry");
 const map=new Map<string,string>(),uuidSet=new Set<string>();
 for(const [logtoId,uuid] of entries){
  if(!OPAQUE.test(logtoId)||typeof uuid!=="string"||!UUID.test(uuid)||uuidSet.has(uuid.toLowerCase()))
   throw TypeError("Invalid or ambiguous Central organisation mapping");
  map.set(logtoId,uuid);uuidSet.add(uuid.toLowerCase());
 }
 return map;
}
