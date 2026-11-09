import {it,expect} from "vitest";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-untrusted-host",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL.replace("central.example.test","evil.example.test")});const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);expect(r.headers.location).toBeUndefined();expect(r.headers["set-cookie"]).toBeUndefined();});
