import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
it("real PostgreSQL Central sessions: unverified-account",async()=>withFixture(async f=>{const t=await f.store.create(f.a);await f.db.user.update({where:{id:f.a.userId},data:{isEmailVerified:false}});expect(await f.store.authenticate(t.token)).toBeNull();}));
