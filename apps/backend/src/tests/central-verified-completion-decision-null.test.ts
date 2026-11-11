import {it,expect} from "vitest";
import { harness } from "./central-verified-completion.fixture";
it("Central completion decision null",async()=>{const h=harness();h.decide.mockResolvedValue(null as never);expect(await h.make()(h.callback)).toBeNull();expect(h.issue).not.toHaveBeenCalled();});
