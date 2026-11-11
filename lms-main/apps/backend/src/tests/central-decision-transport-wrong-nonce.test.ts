import {it,expect} from "vitest";
import { harness, principal, envelope, json } from "./central-decision-transport.fixture";
it("Central decision transport: wrong-nonce",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),requestId:"A".repeat(32)}));expect(await h.make()(principal)).toBeNull();});
