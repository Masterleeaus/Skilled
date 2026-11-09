import {it,expect} from "vitest";
import {harness,ORIGIN,BINDING,STATE,TOKEN,URL,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP callback-success",async()=>{const h=harness();const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(303);expect(r.headers.location).toBe(ORIGIN+"/");expect(String(r.headers["set-cookie"])).toContain("academy_sid="+TOKEN);expect(h.complete).toHaveBeenCalledWith({browserBinding:BINDING,state:STATE,code:"valid-code-123"});});
