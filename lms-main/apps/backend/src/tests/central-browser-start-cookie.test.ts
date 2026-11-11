import {it,expect} from "vitest";
import { harness, BINDING } from "./central-browser-lifecycle.fixture";
it("Central HTTP start-cookie",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/start");const c=String(r.headers["set-cookie"]);expect(c).toContain("academy_oidc_binding="+BINDING);expect(c).toContain("Secure");expect(c).toContain("HttpOnly");expect(c).toContain("SameSite=Lax");expect(c).toContain("Max-Age=300");});
