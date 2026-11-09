import {it,expect} from 'vitest';
import {externalCentralRef,validateCentralLmsBinding} from '../modules/auth/central-lms-contract';
it('never fabricates safe lookup keys from unsafe or conflicting identifiers',()=>{
 for(const subject of ['person|admin','user name','line\nfeed','', 'x'.repeat(181)])
  expect(externalCentralRef('https://identity.example',subject)).toBeNull();
 expect(externalCentralRef('https://identity.example','valid-subject')).toBe('https://identity.example|valid-subject');
});
it('requires strictly supplied operator mapping fields without privilege claims',()=>{
 const binding={issuer:'https://identity.example',subject:'u-1',companyRef:'tenant-1',userId:'local-1'};
 expect(validateCentralLmsBinding(binding)).toBe(true);
 for(const extras of [{role:'ADMIN'},{email:'someone@example.test'},{companyId:'foreign-company'}])
  expect(validateCentralLmsBinding({...binding,...extras})).toBe(false);
 expect(validateCentralLmsBinding({...binding,subject:'a|b'})).toBe(false);
});
