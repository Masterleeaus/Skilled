import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission enforces null-prototype",()=>{const v=Object.assign(Object.create(null),good());expect(centralRuntimeEnabled(true,v)).toBe(true);});
