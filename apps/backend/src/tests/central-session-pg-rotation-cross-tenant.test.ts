import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: rotation-cross-tenant",async()=>withFixture(async f=>{const a=await f.store.create(f.a),b=await f.store.create(f.b);await expect(f.store.create(f.b,a.token)).rejects.toThrow();expect(await f.store.authenticate(a.token)).not.toBeNull();expect(await f.store.authenticate(b.token)).not.toBeNull();}));
