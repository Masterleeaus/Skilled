import {it,expect} from "vitest";
import {centralSsoProblems} from "../config/central-sso";
it("has no configuration dependency when deliberately disabled",()=>{
 expect(centralSsoProblems({enabled:false,issuer:"",clientId:"",clientSecret:"",jwksUri:"",redirectUri:""})).toEqual([]);
 expect(centralSsoProblems({enabled:true,issuer:"",clientId:"",clientSecret:"",jwksUri:"",redirectUri:""}).length).toBeGreaterThanOrEqual(4);
});
