import {it,expect} from "vitest";
import {isPlainHttpsUrl} from "../config/central-sso";
it("refuses non-TLS, credentials and query-bearing issuer URLs",()=>{
 for(const u of ["http://issuer.test","ftp://issuer.test","https://u:p@issuer.test","https://issuer.test/?next=evil","https://issuer.test/#fragment","javascript:alert(1)","invalid"])expect(isPlainHttpsUrl(u)).toBe(false);
 expect(isPlainHttpsUrl("https://issuer.test")).toBe(true);
});
