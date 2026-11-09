import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission rejects array-evidence",()=>{expect(centralRuntimeEnabled(true,[true,true,true,true,true,true])).toBe(false);});
