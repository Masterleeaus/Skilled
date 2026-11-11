import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: rotation",async()=>withFixture(async f=>{const first=await f.store.create(f.a);const second=await f.store.create(f.a,first.token);expect(await f.store.authenticate(first.token)).toBeNull();expect(await f.store.authenticate(second.token)).not.toBeNull();expect(await f.db.skilledCentralSession.count({where:{userId:f.a.userId}})).toBe(2);}));
