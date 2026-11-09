import {describe,it,expect,vi} from 'vitest';
import {createCentralLmsSessionIssuer} from '../modules/auth/central-lms-session';
const account={userId:'user-1',companyId:'company-1',companyRef:'ref-1',role:'STUDENT' as const,membershipRole:'LEARNER'};
const setup=(resolve: (selection:unknown)=>Promise<typeof account|null> = async()=>account,fail=false)=>{
 const updates=vi.fn(async()=>({count:fail?0:1}));
 const create=vi.fn(async()=>({id:'refresh'}));
 const transaction=vi.fn(async(fn:(tx:any)=>Promise<void>)=>fn({refreshToken:{updateMany:updates,create}}));
 return {issue:createCentralLmsSessionIssuer({resolve,transaction}),updates,create,transaction};
};
describe('LMS native revocable refresh issuance',()=>{
 it('requires fresh company and identity match before any session write',async()=>{
  const x=setup(async()=>null);
  expect(await x.issue({company:'forged'})).toBeNull();
  expect(x.transaction).not.toHaveBeenCalled();
 });
 it('rotates the previous refresh session atomically',async()=>{
  const x=setup();const issued=await x.issue({verified:true},'previous-refresh');
  expect(x.updates).toHaveBeenCalledWith(expect.objectContaining({
   where:expect.objectContaining({id:'previous-refresh',userId:'user-1',isRevoked:false}),
   data:{isRevoked:true}
  }));
  expect(x.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({
   userId:'user-1',deviceInfo:'titan-central-sso:company-1'
  })}));
  expect(issued?.companyId).toBe('company-1');
  expect(issued?.refreshToken.length).toBeGreaterThan(32);
 });
 it('denies issuance when prior token cannot be revoked',async()=>{
  const x=setup(undefined,true);
  expect(await x.issue({},'already-revoked')).toBeNull();
  expect(x.create).not.toHaveBeenCalled();
 });
});
