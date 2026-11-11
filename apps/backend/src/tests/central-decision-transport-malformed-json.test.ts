import {it,expect} from "vitest";
import { harness, principal } from "./central-decision-transport.fixture";
it("Central decision transport: malformed-json",async()=>{const h=harness();h.fetcher.mockResolvedValue(new Response("{",{status:200,headers:{"content-type":"application/json"}}));expect(await h.make()(principal)).toBeNull();});
