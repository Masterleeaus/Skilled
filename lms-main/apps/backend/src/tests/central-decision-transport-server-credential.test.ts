import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";
it("Central decision transport: server-credential",async()=>{const h=harness();await h.make()(principal);const [uri,init]=h.fetcher.mock.calls[0];expect(uri).toBe(h.config.endpoint);expect(init?.method).toBe("POST");expect(init?.redirect).toBe("error");expect((init?.headers as Record<string,string>)?.authorization).toBe("Bearer "+h.config.bearerToken);expect(JSON.stringify(init?.body)).not.toContain(h.config.bearerToken);});
