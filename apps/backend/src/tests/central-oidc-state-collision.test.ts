import {it,expect} from "vitest";
import {createMemoryCentralStateStore} from "../modules/auth/central/central-state";
it("rejects duplicate state inserts rather than replacing a browser binding",async()=>{
 const store=createMemoryCentralStateStore(),r={nonce:"n",verifier:"v",bindingHash:"original",expiresAt:Date.now()+60000};
 await store.save("same",r,60000);
 await expect(store.save("same",{...r,bindingHash:"attacker"},60000)).rejects.toThrow("collision");
 expect((await store.consume("same"))?.bindingHash).toBe("original");
});
