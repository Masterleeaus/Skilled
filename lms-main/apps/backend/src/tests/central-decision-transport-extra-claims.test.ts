import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: extra-claims",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),role:"ADMIN"}));expect(await h.make()(principal)).toBeNull();});
