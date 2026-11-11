import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission rejects flag-undefined",()=>{expect(centralRuntimeEnabled(undefined,good())).toBe(false);});
