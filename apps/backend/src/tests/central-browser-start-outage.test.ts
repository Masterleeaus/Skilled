import {it,expect} from "vitest";
import { harness } from "./central-browser-lifecycle.fixture";
it("Central HTTP start-outage",async()=>{const h=harness();h.begin.mockRejectedValue(Error("provider offline"));const r=await h.agent.get("/auth/titan/academy/start");expect(r.status).toBe(503);expect(r.text).not.toContain("provider offline");});
