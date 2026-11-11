import {it,expect} from "vitest";
import { harness, principal } from "./central-verified-completion.fixture";
it("Central completion application mismatch",async()=>{const h=harness();h.oidc.complete.mockResolvedValue({...principal,applicationId:"other" as never});expect(await h.make()(h.callback)).toBeNull();expect(h.decide).not.toHaveBeenCalled();});
