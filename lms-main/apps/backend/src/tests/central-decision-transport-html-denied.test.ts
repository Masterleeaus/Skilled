import {it,expect} from "vitest";
import {harness,principal,envelope,json} from "./central-decision-transport.fixture";
it("Central decision transport: html-denied",async()=>{const h=harness();h.fetcher.mockResolvedValue(json(envelope(),200,{"content-type":"text/html"}));expect(await h.make()(principal)).toBeNull();});
