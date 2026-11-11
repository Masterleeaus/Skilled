import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('refuses all unsafe partial resolutions when a trusted dependency throws',async()=>{
 const fail=['company','academyExternalIdentity','companyMember','user'] as const;
 for(const table of fail){
  const f=fixture();
  f.database[table].findUnique.mockRejectedValue(new Error(table+' unavailable'));
  expect(await f.resolve(verifiedInput())).toBeNull();
 }
 const f=fixture();
 f.resolveCompanyBinding.mockRejectedValue(new Error('mapping down'));
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.user.findUnique).not.toHaveBeenCalled();
});
