import {it,expect} from "vitest";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
it("removes a state on first read and never allows second consumption",async()=>{
 const store=createMemoryCentralStateStore();
 const record={nonce:"n",verifier:"v",bindingHash:"h",expiresAt:Date.now()+60000};
 await store.save("state-digest",record,60000);
 expect(await store.consume("state-digest")).toEqual(record);
 expect(await store.consume("state-digest")).toBeNull();
 expect(store.size()).toBe(0);
});
