import {it,expect} from "vitest";
import {createRedisCentralStateStore,type CentralRedisLike} from "../modules/auth/central/central-state";
it("uses SET NX PX and GETDEL atomic one-time semantics on shared state",async()=>{
 const data=new Map<string,string>();let writes=0,reads=0;
 const redis:CentralRedisLike={set:async(k,v,px,ms,nx)=>{expect([px,nx]).toEqual(["PX","NX"]);expect(ms).toBe(60000);writes++;if(data.has(k))return null;data.set(k,v);return "OK";},getdel:async k=>{reads++;const value=data.get(k)??null;data.delete(k);return value}};
 const store=createRedisCentralStateStore(redis),record={nonce:"n",verifier:"v",bindingHash:"h",expiresAt:65000};
 await store.save("digest",record,60000);
 await expect(store.save("digest",record,60000)).rejects.toThrow("collision");
 expect(await store.consume("digest")).toEqual(record);
 expect(await store.consume("digest")).toBeNull();
 expect([writes,reads]).toEqual([2,2]);
});
