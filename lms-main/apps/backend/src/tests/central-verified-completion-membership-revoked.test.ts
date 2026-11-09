import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion membership revoked",async()=>{const h=harness();h.readers.isMember.mockResolvedValue(false);expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
