import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission enforces nonenumerable-check",()=>{const v=good();Object.defineProperty(v,"proxyVerified",{value:true,enumerable:false});expect(centralRuntimeEnabled(true,v)).toBe(true);});
