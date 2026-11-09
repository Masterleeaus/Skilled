import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: wrong-subject",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),subject:"attacker-user"}));expect(await h.make()(principal)).toBeNull();});
