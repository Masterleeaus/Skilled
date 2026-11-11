import {it,expect} from "vitest";
import { centralRuntimeEnabled, replace } from "./central-readiness-admission.fixture";
it("Central admission rejects key-substitution",()=>{expect(centralRuntimeEnabled(true,replace("logoutRehearsed","unverifiedCheck"))).toBe(false);});
