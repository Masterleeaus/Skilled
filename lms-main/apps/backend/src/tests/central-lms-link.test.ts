import {describe,it,expect,vi} from 'vitest';
import {createCentralLmsAccountResolver} from '../modules/auth/central-lms-link';
const input={issuer:'https://issuer.example',subject:'sub-123',companyRef:'company-ref',verifiedAt:new Date().toISOString()};
const db=()=>({
 company:{findUnique:vi.fn(async()=>({id:'company-1'}))},
 academyExternalIdentity:{findUnique:vi.fn(async()=>({userId:'user-1',companyId:'company-1'}))},
 companyMember:{findUnique:vi.fn(async()=>({role:'LEARNER'}))},
 user:{findUnique:vi.fn(async()=>({id:'user-1',isActive:true,isEmailVerified:true,deletedAt:null}))}
});
const setup=(over:Record<string,unknown>={})=>{
 const database=db(),resolveCompanyBinding=vi.fn(async()=> 'company-1');
 const authoriseCentral=vi.fn(async()=>true);
 return {database,resolveCompanyBinding,authoriseCentral,resolve:createCentralLmsAccountResolver({
 database,resolveCompanyBinding,authoriseCentral,...over})};
};
describe('LMS current external identity, company, membership and learner status',()=>{
 it('requires matching company and local scoped membership',async()=>{
  const x=setup();
  expect(await x.resolve(input)).toEqual({userId:'user-1',companyId:'company-1',companyRef:'company-ref',role:'LEARNER'});
  expect(x.database.academyExternalIdentity.findUnique).toHaveBeenCalledWith({
   where:{service_externalUserRef:{service:'titan-central',externalUserRef:input.issuer+'|'+input.subject}},
   select:{userId:true,companyId:true}
  });
 });
 it('rejects wrong tenant mapping before local user lookup',async()=>{
  const x=setup({resolveCompanyBinding:async()=> 'other-company'});
  expect(await x.resolve(input)).toBeNull();
  expect(x.database.academyExternalIdentity.findUnique).not.toHaveBeenCalled();
 });
 it('requires live Central entitlement',async()=>{
  const x=setup({authoriseCentral:async()=>false});
  expect(await x.resolve(input)).toBeNull();
  expect(x.database.user.findUnique).not.toHaveBeenCalled();
 });
 it('rejects foreign company link, revoked member and inactive learner',async()=>{
  for(const field of ['identity','membership','user']){
   const x=setup();
   if(field==='identity')x.database.academyExternalIdentity.findUnique.mockResolvedValue({userId:'user-1',companyId:'other'});
   if(field==='membership')x.database.companyMember.findUnique.mockResolvedValue(null as any);
   if(field==='user')x.database.user.findUnique.mockResolvedValue({id:'user-1',isActive:false,isEmailVerified:true,deletedAt:null});
   expect(await x.resolve(input)).toBeNull();
  }
 });
 it('rejects forged claim fields, expired identity and failed database',async()=>{
  const x=setup();
  expect(await x.resolve({...input,email:'admin@example.org'})).toBeNull();
  expect(await x.resolve({...input,verifiedAt:'2020-01-01T00:00:00.000Z'})).toBeNull();
  x.database.company.findUnique.mockRejectedValue(new Error('db down'));
  expect(await x.resolve(input)).toBeNull();
 });
});
