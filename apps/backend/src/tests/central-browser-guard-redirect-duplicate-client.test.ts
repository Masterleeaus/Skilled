import {it,expect} from "vitest";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-duplicate-client",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL+"&client_id=evil"});const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);});
