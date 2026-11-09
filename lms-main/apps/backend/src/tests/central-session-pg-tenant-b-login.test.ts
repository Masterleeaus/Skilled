import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
import {centralSessionDigest} from "../modules/auth/central-session-store";
it("real PostgreSQL Central sessions: tenant-b-login",async()=>withFixture(async f=>{const t=await f.store.create(f.b);expect(await f.store.authenticate(t.token)).toMatchObject({userId:f.b.userId,companyId:f.b.companyId,role:"TEACHER"});}));
