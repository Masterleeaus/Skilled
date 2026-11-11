import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: expired-token",async()=>withFixture(async f=>{const t=await f.store.create(f.a);await f.db.skilledCentralSession.updateMany({where:{userId:f.a.userId},data:{expiresAt:new Date(Date.now()-1000)}});expect(await f.store.authenticate(t.token)).toBeNull();}));
