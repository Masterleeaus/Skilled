import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission rejects extra-key",()=>{expect(centralRuntimeEnabled(true,{...good(),skipReview:true})).toBe(false);});
