import {it,expect} from "vitest";
import { harness, sessionCookie } from "./central-browser-lifecycle.fixture";
it("Central HTTP logout-cross-origin",async()=>{const h=harness();const r=await h.agent.post("/auth/titan/academy/logout").set("Origin","https://evil.example.test").set("Cookie",sessionCookie());expect(r.status).toBe(403);expect(h.revoke).not.toHaveBeenCalled();});
