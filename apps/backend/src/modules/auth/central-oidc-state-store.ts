/** Shared PostgreSQL one-use state. A delete-before-return prevents replay across workers. */
import type {PrismaClient} from "@prisma/client";
import { hash, sealOidc } from "./central-oidc-crypto";
type Db=Pick<PrismaClient,"skilledOidcLoginState">;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
export type PendingState={nonce:string;verifier:string;bindingHash:string;expiresAt:number};
export function createPrismaOidcStateStore(db:Db,key:Buffer,clock=()=>Date.now()){
 if(!db?.skilledOidcLoginState||key?.length!==32)throw TypeError("OIDC state dependencies required");
 const aad=(stateHash:string,field:string)=>"academy|"+stateHash+"|"+field;
 return {
  async save(state:string,record:PendingState){
   const now=clock();
   if(!TOKEN.test(state)||!TOKEN.test(record?.nonce)||!TOKEN.test(record?.verifier)||
      !/^[a-f0-9]{64}$/.test(record.bindingHash)||!Number.isSafeInteger(record.expiresAt)||
      record.expiresAt<=now||record.expiresAt>now+600000)throw TypeError("Invalid OIDC state record");
   const digest=hash(state);
   await db.skilledOidcLoginState.create({data:{stateHash:digest,applicationId:"academy",
    bindingHash:record.bindingHash,sealedNonce:sealOidc(record.nonce,aad(digest,"nonce"),key),
    sealedVerifier:sealOidc(record.verifier,aad(digest,"verifier"),key),
    expiresAt:new Date(record.expiresAt)}});
  },
 };
}
