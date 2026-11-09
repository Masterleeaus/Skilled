import { vi } from 'vitest';
import { createCentralLmsAccountResolver } from '../modules/auth/central-lms-link';

/** Deliberately inert Prisma/entitlement doubles: never hit the database or Central network. */
export const fixedNow = Date.parse('2026-11-09T00:00:00.000Z');
export const verifiedInput = () => ({
  issuer:'https://identity.example', subject:'subject-42', companyRef:'external-company-a',
  verifiedAt:new Date(fixedNow).toISOString()
});
export function fixture() {
  const database = {
    company:{findUnique:vi.fn(async()=>({id:'company-a'}))},
    academyExternalIdentity:{findUnique:vi.fn(async()=>({userId:'user-a',companyId:'company-a'}))},
    companyMember:{findUnique:vi.fn(async()=>({role:'MANAGER'}))},
    user:{findUnique:vi.fn(async()=>({
      id:'user-a', role:'STUDENT', isActive:true, isEmailVerified:true, deletedAt:null
    }))}
  };
  const resolveCompanyBinding = vi.fn(async()=> 'company-a');
  const authoriseCentral = vi.fn(async()=> true);
  const resolve = createCentralLmsAccountResolver({
    database,resolveCompanyBinding,authoriseCentral,clock:()=>fixedNow
  });
  return {database,resolveCompanyBinding,authoriseCentral,resolve};
}
