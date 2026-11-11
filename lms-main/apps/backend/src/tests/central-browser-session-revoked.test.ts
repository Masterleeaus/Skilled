import {it,expect} from "vitest";
import { harness, sessionCookie } from "./central-browser-lifecycle.fixture";
it("Central HTTP session-revoked",async()=>{const h=harness();h.authenticate.mockResolvedValue(null as never);const r=await h.agent.get("/auth/titan/academy/session").set("Cookie",sessionCookie());expect(r.status).toBe(401);});
