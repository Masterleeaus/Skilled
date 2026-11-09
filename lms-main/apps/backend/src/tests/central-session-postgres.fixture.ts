/** Database-backed two-tenant Central session fixture, confined to disposable CI Postgres.
 * Every scenario gets unique identities; cleanup never touches other fixtures.
 */
import {randomUUID} from "node:crypto";
import {PrismaClient} from "@prisma/client";
import {createSkilledCentralSessionStore} from "../modules/auth/central-session-store";
export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export async function createFixture(){
 const db=new PrismaClient();
 await db.$connect();
 const id=randomUUID();
 const a={userId:"user-"+id,companyId:"company-a-"+id,centralOrganisationId:"org-a-"+id,localAccountId:"account-a-"+id};
 const b={userId:"user-b-"+id,companyId:"company-b-"+id,centralOrganisationId:"org-b-"+id,localAccountId:"account-b-"+id};
 let allowed=true;
 try{
  await db.user.createMany({data:[a,b].map((x,i)=>({
   id:x.userId,email:"central-"+id+"-"+i+"@example.test",passwordHash:"test-not-a-real-password",
   fullName:"Central Fixture",role:i===0?"STUDENT":"TEACHER",isActive:true,isEmailVerified:true
  }))});
  await db.company.createMany({data:[a,b].map((x,i)=>({id:x.companyId,name:"Tenant "+(i+1)}))});
  await db.companyMember.createMany({data:[a,b].map(x=>({companyId:x.companyId,userId:x.userId,role:"LEARNER"}))});
  await db.centralCompanyLink.createMany({data:[a,b].map(x=>({
   centralOrganisationId:x.centralOrganisationId,localAccountId:x.localAccountId,companyId:x.companyId,state:"verified"
  }))});
 }catch(error){await db.$disconnect();throw error}
 let sequence=0;
 const verify=async()=>allowed;
 const make=(client:PrismaClient=db)=>createSkilledCentralSessionStore(client,verify,{
  randomToken:()=>String(++sequence).padStart(64,"a"),ttlSeconds:3600
 });
 const store=make();
 const dispose=async()=>{
  try{
   await db.skilledCentralSession.deleteMany({where:{userId:{in:[a.userId,b.userId]}}});
   await db.centralCompanyLink.deleteMany({where:{companyId:{in:[a.companyId,b.companyId]}}});
   await db.companyMember.deleteMany({where:{companyId:{in:[a.companyId,b.companyId]}}});
   await db.company.deleteMany({where:{id:{in:[a.companyId,b.companyId]}}});
   await db.user.deleteMany({where:{id:{in:[a.userId,b.userId]}}});
  }finally{await db.$disconnect()}
 };
 return {db,a,b,store,make,setCentral:(v:boolean)=>{allowed=v},dispose};
}
export async function withFixture<T>(work:(f:Fixture)=>Promise<T>):Promise<T>{
 if(process.env.SKILLED_CENTRAL_SESSION_PG_TEST!=="1")throw Error("Real PostgreSQL security tests require disposable CI DB");
 const fixture=await createFixture();
 try{return await work(fixture)}finally{await fixture.dispose()}
}
