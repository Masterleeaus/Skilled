import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: membership-revoked",async()=>withFixture(async f=>{const t=await f.store.create(f.a);await f.db.companyMember.deleteMany({where:{userId:f.a.userId}});expect(await f.store.authenticate(t.token)).toBeNull();}));
