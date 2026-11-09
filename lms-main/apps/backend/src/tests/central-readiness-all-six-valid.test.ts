import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission rejects all-six-valid",()=>{expect(centralRuntimeEnabled(true,good())).toBe(true);});
