import {describe,it,expect} from "vitest";
import {centralSkilledDecisionEndpoint} from "../modules/auth/central-service-decision-endpoint";
describe("fixed Central service endpoint",()=>{
 it("builds only from trusted HTTPS origin",()=>{
  expect(centralSkilledDecisionEndpoint("https://central.example.test")).toBe(
   "https://central.example.test/v1/integrations/academy/decision");
 });
 for(const url of ["http://central.example.test","https://central.example.test/path","https://user:pass@central.example.test","https://central.example.test?x=y"]){
  it("rejects "+url,()=>expect(()=>centralSkilledDecisionEndpoint(url)).toThrow());
 }
});