import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('derives API authority from the verified local LMS user, never company role',async()=>{
 const f=fixture();
 f.database.companyMember.findUnique.mockResolvedValue({role:'OWNER'});
 f.database.user.findUnique.mockResolvedValue({id:'user-a',role:'STUDENT',isActive:true,isEmailVerified:true,deletedAt:null});
 const result=await f.resolve(verifiedInput());
 expect(result?.role).toBe('STUDENT');
 expect(result?.membershipRole).toBe('OWNER');
 expect(result?.companyId).toBe('company-a');
 expect(result).not.toHaveProperty('accessToken');
});
