import {it,expect} from "vitest";
import { harness, principal, envelope } from "./central-decision-transport.fixture";
it("Central decision transport: oversized-response",async()=>{const h=harness();h.fetcher.mockResolvedValue(new Response(JSON.stringify({...envelope(),padding:"x".repeat(20000)}),{status:200,headers:{"content-type":"application/json"}}));expect(await h.make()(principal)).toBeNull();});
