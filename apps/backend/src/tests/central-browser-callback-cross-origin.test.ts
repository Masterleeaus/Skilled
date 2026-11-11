import {it,expect} from "vitest";
import {harness,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP callback-cross-origin",async()=>{const h=harness();const r=await h.agent.get(callback).set("Cookie",initialCookie()).set("Origin","https://evil.example.test");expect(r.status).toBe(401);expect(h.complete).not.toHaveBeenCalled();});
