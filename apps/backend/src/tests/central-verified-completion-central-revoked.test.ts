import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion central revoked",async()=>{const h=harness();h.readers.isCentralAccessCurrent.mockResolvedValue(false);expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
