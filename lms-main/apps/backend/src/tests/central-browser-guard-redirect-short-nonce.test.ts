import {it,expect} from "vitest";
import {createCentralBrowserLifecycle} from "../modules/auth/central-browser-lifecycle";
import {harness,URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-short-nonce",async()=>{const h=harness();const u=new URL(URL);u.searchParams.set("nonce","short");h.begin.mockResolvedValue({authorizationUrl:u.href});expect((await h.agent.get("/auth/titan/academy/start")).status).toBe(503);});
