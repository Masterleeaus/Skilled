/** One production state object: encrypted Prisma write + atomic SQL consume. */
import type {PrismaClient} from "@prisma/client";
import {createPrismaOidcStateStore} from "./central-oidc-state-store";
import {createAtomicOidcStateReader} from "./central-oidc-state-sql";
import {hash} from "./central-oidc-crypto";
export function createDurableOidcState(db:PrismaClient,key:Buffer,clock=()=>Date.now()){
 if(!db?.skilledOidcLoginState||typeof db.$queryRaw!=="function"||!Buffer.isBuffer(key)||key.length!==32)
  throw new TypeError("Shared, trusted Prisma OIDC state store is required");
 const writer=createPrismaOidcStateStore(db,key,clock);
 const consume=createAtomicOidcStateReader(db,key,clock);
 return {
  save:writer.save,
  async consume(state:string,binding:string){
   const record=await consume(state,binding);
   if(!record)return null;
   if(!Number.isSafeInteger(record.expiresAt)||record.expiresAt<=clock())return null;
   return {...record,bindingHash:hash(binding)};
  }
 };
}
