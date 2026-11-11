import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('accepts only a canonical HTTPS issuer with no embedded credentials or query',async()=>{
 const f=fixture();
 for(const issuer of ['http://identity.example','javascript:alert(1)','https://person:pw@identity.example','https://identity.example/?x=1','https://identity.example/#fragment','']){
  expect(await f.resolve({...verifiedInput(),issuer})).toBeNull();
 }
 expect(f.database.company.findUnique).not.toHaveBeenCalled();
});
