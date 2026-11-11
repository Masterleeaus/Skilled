import {it,expect} from "vitest";
import {harness,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP callback-iframe",async()=>{const h=harness();const r=await h.agent.get(callback).set("Cookie",initialCookie()).set("Sec-Fetch-Mode","navigate").set("Sec-Fetch-Dest","iframe");expect(r.status).toBe(401);expect(h.complete).not.toHaveBeenCalled();});
