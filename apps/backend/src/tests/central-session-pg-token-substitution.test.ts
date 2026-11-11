import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: token-substitution",async()=>withFixture(async f=>{const t=await f.store.create(f.a);expect(await f.store.authenticate("z".repeat(64))).toBeNull();expect(await f.store.authenticate(t.token)).toMatchObject({companyId:f.a.companyId});}));
