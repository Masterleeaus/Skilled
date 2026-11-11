import {it,expect} from "vitest";
import { harness } from "./central-verified-completion.fixture";
it("Central completion success",async()=>{const h=harness();const result=await h.make()(h.callback);expect(result?.identity).toEqual({userId:"user-a",companyId:"company-a",role:"STUDENT"});expect(result?.cookie).toContain("HttpOnly");expect(h.issue).toHaveBeenCalledTimes(1);});
