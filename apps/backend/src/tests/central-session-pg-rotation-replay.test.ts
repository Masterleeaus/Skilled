import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: rotation-replay",async()=>withFixture(async f=>{const first=await f.store.create(f.a);await f.store.create(f.a,first.token);await expect(f.store.create(f.a,first.token)).rejects.toThrow();expect(await f.db.skilledCentralSession.count({where:{userId:f.a.userId}})).toBe(2);}));
