import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion central unavailable",async()=>{const h=harness();h.decide.mockRejectedValue(Error("central unavailable"));expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
