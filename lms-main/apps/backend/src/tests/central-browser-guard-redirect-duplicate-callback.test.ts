import {it,expect} from "vitest";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-duplicate-callback",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL+"&redirect_uri=https://evil.example.test"});expect((await h.agent.get("/auth/titan/academy/start")).status).toBe(503);});
