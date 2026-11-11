import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: role-injection",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),decision:{...decision,role:"ADMIN"}}));expect(await h.make()(principal)).toBeNull();});
