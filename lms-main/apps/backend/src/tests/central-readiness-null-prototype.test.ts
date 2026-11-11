import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission enforces null-prototype",()=>{const v=Object.assign(Object.create(null),good());expect(centralRuntimeEnabled(true,v)).toBe(true);});
