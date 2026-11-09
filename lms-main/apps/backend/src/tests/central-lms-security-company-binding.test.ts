import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('requires a live trusted Central company binding matching local company ID',async()=>{
 const f=fixture();
 f.resolveCompanyBinding.mockResolvedValue('company-other');
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.academyExternalIdentity.findUnique).not.toHaveBeenCalled();
 f.resolveCompanyBinding.mockResolvedValue('company-a');
 f.database.company.findUnique.mockResolvedValue({id:'another-company'});
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.company.findUnique).toHaveBeenCalledWith({where:{externalRef:'external-company-a'},select:{id:true}});
 expect(f.database.user.findUnique).not.toHaveBeenCalled();
});
