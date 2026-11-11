/** Scheduled housekeeping only: never delete active state. */
import type {PrismaClient} from "@prisma/client";
export function createExpiredOidcStatePruner(db:Pick<PrismaClient,"skilledOidcLoginState">,clock=()=>new Date()){
 if(!db?.skilledOidcLoginState)throw TypeError("OIDC state table required");
 return async()=>{
  const at=clock();if(!Number.isFinite(at.getTime()))throw TypeError("Invalid OIDC pruning clock");
  const deleted=await db.skilledOidcLoginState.deleteMany({where:{expiresAt:{lte:at}}});
  return deleted.count;
 };
}
