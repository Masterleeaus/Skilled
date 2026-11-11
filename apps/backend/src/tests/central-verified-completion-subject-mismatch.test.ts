import {it,expect} from "vitest";
import {harness,principal,decision} from "./central-verified-completion.fixture";
it("Central completion subject mismatch",async()=>{const h=harness();h.decide.mockResolvedValue({issuer:principal.issuer,subject:"another-user",decision});expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
