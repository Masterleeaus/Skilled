import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission enforces symbol-injection",()=>{const v=good();Object.defineProperty(v,Symbol("override"),{value:true});expect(centralRuntimeEnabled(true,v)).toBe(false);});
