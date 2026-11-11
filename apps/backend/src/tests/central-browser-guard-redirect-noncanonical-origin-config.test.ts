import {it,expect} from "vitest";
import {createCentralBrowserLifecycle} from "../modules/auth/central-browser-lifecycle";
import { harness } from "./central-browser-lifecycle.fixture";
it("rejects redirect-noncanonical-origin-config",async()=>{const h=harness();for(const origin of ["http://central.example.test","https://u:p@central.example.test","https://central.example.test/authorize","https://central.example.test?x=1"]){expect(()=>createCentralBrowserLifecycle({...h.deps,authorizationOrigin:origin})).toThrow();}});
