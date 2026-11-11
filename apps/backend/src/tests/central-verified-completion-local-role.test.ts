import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion local role",async()=>{const h=harness();h.readers.findUser.mockResolvedValue({id:"user-a",role:"TEACHER",isActive:true,isEmailVerified:true,deletedAt:null});const r=await h.make()(h.callback);expect(r?.identity.role).toBe("TEACHER");expect(h.issue).toHaveBeenCalledTimes(1);});
