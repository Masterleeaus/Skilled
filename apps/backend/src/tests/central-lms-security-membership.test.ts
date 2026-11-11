import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('fails closed for revoked or malformed local tenant membership',async()=>{
 const f=fixture();
 f.database.companyMember.findUnique.mockResolvedValue(null);
 expect(await f.resolve(verifiedInput())).toBeNull();
 f.database.companyMember.findUnique.mockResolvedValue({role:null});
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.companyMember.findUnique).toHaveBeenCalledWith({
  where:{companyId_userId:{companyId:'company-a',userId:'user-a'}},select:{role:true}
 });
 expect(f.database.user.findUnique).not.toHaveBeenCalled();
});
