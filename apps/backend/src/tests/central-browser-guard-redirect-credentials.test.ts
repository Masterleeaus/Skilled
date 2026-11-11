import {it,expect} from "vitest";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-credentials",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL.replace("https://central.example.test","https://operator:secret@central.example.test")});const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);});
