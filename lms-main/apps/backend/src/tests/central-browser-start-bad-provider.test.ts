import {it,expect} from "vitest";
import {harness,ORIGIN,BINDING,STATE,TOKEN,URL,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP start-bad-provider",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:"https://central.example.test/authorize?response_type=token"});const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);expect(r.headers["set-cookie"]).toBeUndefined();});
