import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission rejects extra-key",()=>{expect(centralRuntimeEnabled(true,{...good(),skipReview:true})).toBe(false);});
