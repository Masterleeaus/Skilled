import {it,expect} from "vitest";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
it("expires a saved state even if no callback arrived",async()=>{
 let now=10;const store=createMemoryCentralStateStore(()=>now);
 await store.save("digest",{nonce:"n",verifier:"v",bindingHash:"h",expiresAt:110},100);
 now=111;expect(await store.consume("digest")).toBeNull();expect(store.size()).toBe(0);
});
