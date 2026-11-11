import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: tenant-a-login",async()=>withFixture(async f=>{const t=await f.store.create(f.a);expect(await f.store.authenticate(t.token)).toMatchObject({userId:f.a.userId,companyId:f.a.companyId,role:"STUDENT"});}));
