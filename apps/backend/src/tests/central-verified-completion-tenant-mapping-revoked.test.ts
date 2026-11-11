import {it,expect} from "vitest";
import {harness} from "./central-verified-completion.fixture";
it("Central completion tenant mapping revoked",async()=>{const h=harness();h.readers.findMappings.mockResolvedValue([]);expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
