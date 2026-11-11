import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: unauthorised-decision",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),decision:{...decision,allowed:false}}));expect(await h.make()(principal)).toBeNull();});
