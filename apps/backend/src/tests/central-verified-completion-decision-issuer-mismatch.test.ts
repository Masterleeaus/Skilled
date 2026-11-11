import {it,expect} from "vitest";
import {harness,principal,decision} from "./central-verified-completion.fixture";
it("Central completion decision issuer mismatch",async()=>{const h=harness();h.decide.mockResolvedValue({issuer:"https://attacker.example.test",subject:principal.subject,decision});expect(await h.make()(h.callback)).toBeNull();expect(h.readers.findMappings).not.toHaveBeenCalled();});
