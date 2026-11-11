import {it,expect} from "vitest";
import { harness, principal } from "./central-decision-transport.fixture";
it("Central decision transport: wrong-audience",async()=>{const h=harness();expect(await h.make()({...principal,audience:"other-app"})).toBeNull();expect(h.fetcher).not.toHaveBeenCalled();});
