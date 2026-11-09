import {describe,it,expect} from 'vitest';
import {externalCentralRef,validateCentralLmsBinding} from '../modules/auth/central-lms-contract';
describe('LMS operator-controlled Central external ref',()=>{
 it('produces explicit issuer|subject key for offline provisioning',()=>{
  expect(externalCentralRef('https://issuer.example','sub-1')).toBe('https://issuer.example|sub-1');
 });
 it('rejects forged schemes, embedded pipes and unsafe identities',()=>{
  for(const bad of ['http://id.example','https://user:pass@id.example','https://id.example?x=1'])
   expect(externalCentralRef(bad,'user')).toBeNull();
  expect(externalCentralRef('https://issuer.example','foo|bar')).toBeNull();
  expect(externalCentralRef('https://issuer.example','foo bar')).toBeNull();
 });
 it('requires one exact organisation and learner mapping, no extra email/role claims',()=>{
  const good={issuer:'https://issuer.example',subject:'sub-1',companyRef:'ref',userId:'learner'};
  expect(validateCentralLmsBinding(good)).toBe(true);
  expect(validateCentralLmsBinding({...good,email:'user@example.org'})).toBe(false);
  expect(validateCentralLmsBinding({...good,companyRef:''})).toBe(false);
 });
});
