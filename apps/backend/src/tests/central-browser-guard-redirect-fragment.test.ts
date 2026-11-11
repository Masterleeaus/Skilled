import {it,expect} from "vitest";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-fragment",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL+"#token"});const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);});
