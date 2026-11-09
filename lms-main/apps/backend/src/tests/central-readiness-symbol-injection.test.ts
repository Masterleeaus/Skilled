import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission enforces symbol-injection",()=>{const v=good();Object.defineProperty(v,Symbol("override"),{value:true});expect(centralRuntimeEnabled(true,v)).toBe(false);});
