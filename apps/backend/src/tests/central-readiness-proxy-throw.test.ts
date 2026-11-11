import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission enforces proxy-throw",()=>{const v=new Proxy(good(),{ownKeys(){throw Error("unsafe proxy")}});expect(centralRuntimeEnabled(true,v)).toBe(false);});
