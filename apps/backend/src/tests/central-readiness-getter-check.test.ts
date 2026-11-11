import {it,expect} from "vitest";
import { centralRuntimeEnabled, good } from "./central-readiness-admission.fixture";
it("Central admission enforces getter-check",()=>{const v=good();Object.defineProperty(v,"proxyVerified",{get(){throw Error("should not execute getter")},enumerable:true});expect(centralRuntimeEnabled(true,v)).toBe(false);});
