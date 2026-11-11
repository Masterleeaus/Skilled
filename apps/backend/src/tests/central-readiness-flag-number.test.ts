import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission rejects flag-number",()=>{expect(centralRuntimeEnabled(1,good())).toBe(false);});
