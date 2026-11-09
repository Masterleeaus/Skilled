import {describe,it,expect,vi} from "vitest";
import {createAtomicOidcStateReader} from "../modules/auth/central-oidc-state-sql";
describe("atomic read statement remains parameterized",()=>{
 it("supplies digest, digest and deadline as Prisma tagged template parameters",async()=>{
  const query=vi.fn(async()=>[]);
  const read=createAtomicOidcStateReader({$queryRaw:query} as never,Buffer.alloc(32),()=>1000);
  expect(await read("s".repeat(43),"b".repeat(43))).toBeNull();
  const sql=String(query.mock.calls[0][0]);
  expect(sql).toContain("DELETE FROM skilled_oidc_login_states");
  expect(sql).toContain("RETURNING");
  expect(query).toHaveBeenCalledOnce();
 });
});