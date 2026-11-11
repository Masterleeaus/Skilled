import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('rejects disabled, unverified or soft-deleted local accounts',async()=>{
 const f=fixture();
 for(const edit of [{isActive:false},{isEmailVerified:false},{deletedAt:new Date()},{id:'user-a',role:'GUEST'}]){
  f.database.user.findUnique.mockResolvedValue({
   id:'user-a',role:'STUDENT',isActive:true,isEmailVerified:true,deletedAt:null,...edit
  });
  expect(await f.resolve(verifiedInput())).toBeNull();
 }
 expect(f.database.user.findUnique).toHaveBeenCalledWith({
  where:{id:'user-a'},select:{id:true,role:true,isActive:true,isEmailVerified:true,deletedAt:true}
 });
});
