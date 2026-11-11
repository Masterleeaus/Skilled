import {it,expect} from "vitest";
import { harness, principal, decision } from "./central-decision-transport.fixture";
it("Central decision transport: valid",async()=>{const h=harness();const result=await h.make()(principal);expect(result).toEqual({issuer:principal.issuer,subject:principal.subject,decision});expect(h.fetcher).toHaveBeenCalledTimes(1);});
