import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission rejects flag-string",()=>{expect(centralRuntimeEnabled("true",good())).toBe(false);});
