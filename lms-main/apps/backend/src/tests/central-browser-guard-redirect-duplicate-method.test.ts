import {it,expect} from "vitest";
import {createCentralBrowserLifecycle} from "../modules/auth/central-browser-lifecycle";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-duplicate-method",async()=>{const h=harness();h.begin.mockResolvedValue({authorizationUrl:URL+"&code_challenge_method=plain"});expect((await h.agent.get("/auth/titan/academy/start")).status).toBe(503);});
