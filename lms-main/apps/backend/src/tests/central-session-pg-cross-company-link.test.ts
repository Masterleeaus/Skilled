import {it,expect} from "vitest";
import {withFixture} from "./central-session-postgres.fixture";
import {centralSessionDigest} from "../modules/auth/central-session-store";
it("real PostgreSQL Central sessions: cross-company-link",async()=>withFixture(async f=>{await f.db.centralCompanyLink.updateMany({where:{companyId:f.a.companyId},data:{state:"revoked"}});await expect(f.store.create(f.a)).rejects.toThrow();expect(await f.db.skilledCentralSession.count({where:{userId:f.a.userId}})).toBe(0);}));
