import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: negative-revision",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),decision:{...decision,entitlementRevision:-1}}));expect(await h.make()(principal)).toBeNull();});
