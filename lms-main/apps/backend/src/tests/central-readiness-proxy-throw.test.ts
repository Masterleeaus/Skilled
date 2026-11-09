import {it,expect} from "vitest";
import {centralRuntimeEnabled,CENTRAL_RUNTIME_CHECK_NAMES,good,without,replace} from "./central-readiness-admission.fixture";
it("Central admission enforces proxy-throw",()=>{const v=new Proxy(good(),{ownKeys(){throw Error("unsafe proxy")}});expect(centralRuntimeEnabled(true,v)).toBe(false);});
