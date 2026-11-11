import {it,expect} from "vitest";
import { centralRuntimeEnabled } from "./central-readiness-admission.fixture";
it("Central admission rejects null-evidence",()=>{expect(centralRuntimeEnabled(true,null)).toBe(false);});
