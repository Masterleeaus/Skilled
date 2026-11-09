import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: network-outage",async()=>{const h=harness();h.fetcher.mockRejectedValue(Error("network unavailable"));expect(await h.make()(principal)).toBeNull();});
