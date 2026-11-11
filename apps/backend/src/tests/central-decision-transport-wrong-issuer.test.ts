import {it,expect} from "vitest";
import { harness, principal, envelope, json } from "./central-decision-transport.fixture";
it("Central decision transport: wrong-issuer",async()=>{const h=harness();h.fetcher.mockResolvedValue(json({...envelope(),issuer:"https://evil.example.test"}));expect(await h.make()(principal)).toBeNull();});
