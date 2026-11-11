import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('requires exact external issuer|subject record and company linkage, never email fallback',async()=>{
 const f=fixture();
 f.database.academyExternalIdentity.findUnique.mockResolvedValue({userId:'user-a',companyId:'foreign-company'});
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.companyMember.findUnique).not.toHaveBeenCalled();
 f.database.academyExternalIdentity.findUnique.mockResolvedValue(null);
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.academyExternalIdentity.findUnique).toHaveBeenCalledWith({
  where:{service_externalUserRef:{service:'titan-central',externalUserRef:'https://identity.example|subject-42'}},
  select:{userId:true,companyId:true}
 });
});
