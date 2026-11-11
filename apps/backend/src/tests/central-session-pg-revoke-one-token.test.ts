import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: revoke-one-token",async()=>withFixture(async f=>{const a=await f.store.create(f.a),b=await f.store.create(f.b);expect(await f.store.revoke(a.token)).toBe(true);expect(await f.store.authenticate(a.token)).toBeNull();expect(await f.store.authenticate(b.token)).not.toBeNull();}));
