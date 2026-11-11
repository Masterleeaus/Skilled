import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
import {centralSessionDigest} from "../modules/auth/central-session-store";
it("real PostgreSQL Central sessions: stored-hash-only",async()=>withFixture(async f=>{const t=await f.store.create(f.a);const row=await f.db.skilledCentralSession.findFirstOrThrow({where:{userId:f.a.userId}});expect(row.tokenHash).toBe(centralSessionDigest(t.token));expect(row.tokenHash).not.toBe(t.token);}));
