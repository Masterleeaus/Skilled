import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission rejects all-six-valid",()=>{expect(centralRuntimeEnabled(true,good())).toBe(true);});
