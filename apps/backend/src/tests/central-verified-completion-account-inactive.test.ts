import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion account inactive",async()=>{const h=harness();h.readers.findUser.mockResolvedValue({id:"user-a",role:"STUDENT",isActive:false,isEmailVerified:true,deletedAt:null});expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
