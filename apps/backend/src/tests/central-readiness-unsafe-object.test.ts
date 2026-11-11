import {it,expect} from "vitest";
import { centralRuntimeEnabled } from "./central-readiness-admission.fixture";
it("Central admission enforces unsafe-object",()=>{for(const x of [new Date(),new Map(),()=>true,42,"all-ready"])expect(centralRuntimeEnabled(true,x)).toBe(false);});
