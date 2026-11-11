import {it,expect} from "vitest";
import {harness,principal,decision} from "./central-verified-completion.fixture";
it("Central completion decision denied",async()=>{const h=harness();h.decide.mockResolvedValue({issuer:principal.issuer,subject:principal.subject,decision:{...decision,allowed:false as never}});expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
