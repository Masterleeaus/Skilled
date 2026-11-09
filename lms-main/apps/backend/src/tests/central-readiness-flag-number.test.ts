import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission rejects flag-number",()=>{expect(centralRuntimeEnabled(1,good())).toBe(false);});
