import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion session unavailable",async()=>{const h=harness();h.issue.mockRejectedValue(Error("db down"));expect(await h.make()(h.callback)).toBeNull();expect(h.issue).toHaveBeenCalledTimes(1);});
