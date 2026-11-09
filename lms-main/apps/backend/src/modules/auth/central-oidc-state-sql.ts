/** Atomic DELETE RETURNING for OIDC state. SQL result must come from Prisma $queryRaw. */
import type {PrismaClient} from "@prisma/client";
import {hash,openOidc} from "./central-oidc-crypto";
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
type Row={stateHash:string;bindingHash:string;sealedNonce:string;sealedVerifier:string;expiresAt:Date};
export function createAtomicOidcStateReader(db:Pick<PrismaClient,"$queryRaw">,key:Buffer,clock=()=>Date.now()){
 if(typeof db?.$queryRaw!=="function"||key?.length!==32)throw TypeError("Atomic state adapter required");
 return async(state:string,binding:string)=>{
  if(!TOKEN.test(state)||!TOKEN.test(binding))return null;
  const stateHash=hash(state),bindingHash=hash(binding);
  // Bound SQL template parameters: never interpolate untrusted strings into SQL.
  const deleted=await db.$queryRaw<Row[]>`
    DELETE FROM skilled_oidc_login_states
    WHERE "stateHash" = ${stateHash}
      AND "applicationId" = 'academy'
      AND "bindingHash" = ${bindingHash}
      AND "expiresAt" > ${new Date(clock())}
    RETURNING "stateHash", "bindingHash", "sealedNonce", "sealedVerifier", "expiresAt"
  `;
  if(!Array.isArray(deleted)||deleted.length!==1)return null;
  const row=deleted[0],aad=(field:string)=>"academy|"+stateHash+"|"+field;
  return {nonce:openOidc(row.sealedNonce,aad("nonce"),key),
    verifier:openOidc(row.sealedVerifier,aad("verifier"),key),
    expiresAt:row.expiresAt.getTime()};
 };
}
