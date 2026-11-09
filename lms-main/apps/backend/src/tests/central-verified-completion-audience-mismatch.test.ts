import {it,expect} from "vitest";
import {harness,principal,decision} from "./central-verified-completion.fixture";
it("Central completion audience mismatch",async()=>{const h=harness();h.oidc.complete.mockResolvedValue({...principal,audience:"other-app"});expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
