import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('rejects untrusted claim extensions and malformed top-level data before database access',async()=>{
 const f=fixture();
 for(const input of [null,{},[],{...verifiedInput(),email:'admin@elsewhere.test'}, {...verifiedInput(),role:'ADMIN'}, {...verifiedInput(),companyId:'company-a'}]){
  expect(await f.resolve(input)).toBeNull();
 }
 expect(f.database.company.findUnique).not.toHaveBeenCalled();
 expect(f.authoriseCentral).not.toHaveBeenCalled();
});
