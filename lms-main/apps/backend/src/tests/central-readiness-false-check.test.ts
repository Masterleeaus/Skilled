import {it,expect} from "vitest";
import { centralRuntimeEnabled, CENTRAL_RUNTIME_CHECK_NAMES, good } from "./central-readiness-admission.fixture";
it("Central admission rejects false-check",()=>{for(const name of CENTRAL_RUNTIME_CHECK_NAMES)expect(centralRuntimeEnabled(true,{...good(),[name]:false})).toBe(false);});
