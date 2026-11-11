import {it,expect} from "vitest";
import {harness,URL as AUTH_URL} from "./central-browser-lifecycle.fixture";
it("rejects redirect-cross-callback",async()=>{const h=harness();const u=new URL(AUTH_URL);u.searchParams.set("redirect_uri","https://evil.example.test/callback");h.begin.mockResolvedValue({authorizationUrl:u.href});expect((await h.agent.get("/auth/titan/academy/start")).status).toBe(503);});
