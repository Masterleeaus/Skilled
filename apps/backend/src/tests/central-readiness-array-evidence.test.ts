import {it,expect} from "vitest";
import { centralRuntimeEnabled } from "./central-readiness-admission.fixture";
it("Central admission rejects array-evidence",()=>{expect(centralRuntimeEnabled(true,[true,true,true,true,true,true])).toBe(false);});
