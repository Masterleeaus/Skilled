import {it,expect} from "vitest";
import { harness, principal, json } from "./central-decision-transport.fixture";
it("Central decision transport: http-denied",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({error:"forbidden"},403));expect(await h.make()(principal)).toBeNull();});
