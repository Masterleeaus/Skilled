import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission rejects null-evidence",()=>{expect(centralRuntimeEnabled(true,null)).toBe(false);});
