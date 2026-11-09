import {it,expect} from "vitest";
import {harness,principal,envelope,json} from "./central-decision-transport.fixture";
it("Central decision transport: redirect-denied",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({error:"redirect"},302));expect(await h.make()(principal)).toBeNull();});
