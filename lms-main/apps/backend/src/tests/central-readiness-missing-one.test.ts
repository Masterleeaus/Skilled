import {it,expect} from "vitest";
import { centralRuntimeEnabled, CENTRAL_RUNTIME_CHECK_NAMES, without } from "./central-readiness-admission.fixture";
it("Central admission rejects missing-one",()=>{for(const name of CENTRAL_RUNTIME_CHECK_NAMES)expect(centralRuntimeEnabled(true,without(name))).toBe(false);});
