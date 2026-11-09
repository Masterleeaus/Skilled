import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission enforces inherited-checks",()=>{const v=Object.create(good());expect(centralRuntimeEnabled(true,v)).toBe(false);});
