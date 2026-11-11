import {it,expect} from "vitest";
import { harness, principal } from "./central-verified-completion.fixture";
it("Central completion issuer mismatch",async()=>{const h=harness();h.oidc.complete.mockResolvedValue({...principal,issuer:"https://untrusted.example.test"});expect(await h.make()(h.callback)).toBeNull();expect(h.decide).not.toHaveBeenCalled();});
