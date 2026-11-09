import {it,expect} from "vitest";
import {harness,ORIGIN,BINDING,STATE,TOKEN,URL,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP start-redirect",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(302);expect(r.headers.location).toBe(URL);expect(h.begin).toHaveBeenCalledWith(BINDING);});
