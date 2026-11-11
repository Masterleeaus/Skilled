import {it,expect} from "vitest";
import {createRedisCentralStateStore,type CentralRedisLike} from "../modules/auth/central/central-state";
it("refuses malformed or structurally invalid stored state",async()=>{
 for(const raw of ["not-json","{}","[]",'{"nonce":12,"verifier":"v","bindingHash":"h","expiresAt":100}']){
  const redis:CentralRedisLike={set:async()=>"OK",getdel:async()=>raw};
  expect(await createRedisCentralStateStore(redis).consume("digest")).toBeNull();
 }
});
