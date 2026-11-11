import {it,expect} from "vitest";
import { harness, BINDING, URL } from "./central-browser-lifecycle.fixture";
it("Central HTTP start-redirect",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(302);expect(r.headers.location).toBe(URL);expect(h.begin).toHaveBeenCalledWith(BINDING);});
