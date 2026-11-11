import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: central-entitlement",async()=>withFixture(async f=>{const t=await f.store.create(f.a);f.setCentral(false);expect(await f.store.authenticate(t.token)).toBeNull();await expect(f.store.create(f.b)).rejects.toThrow();}));
