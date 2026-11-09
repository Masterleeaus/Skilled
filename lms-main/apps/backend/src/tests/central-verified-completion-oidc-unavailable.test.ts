import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion oidc unavailable",async()=>{const h=harness();h.oidc.complete.mockRejectedValue(Error("OIDC offline"));expect(await h.make()(h.callback)).toBeNull();expect(h.decide).not.toHaveBeenCalled();});
