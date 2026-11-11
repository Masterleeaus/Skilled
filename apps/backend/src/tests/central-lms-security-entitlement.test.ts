import {it,expect} from 'vitest';
import {fixture,verifiedInput} from './central-lms-security.fixture';
it('denies Central entitlement errors, rejection or unverified truthy results',async()=>{
 const f=fixture();
 f.authoriseCentral.mockResolvedValue(false);
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.company.findUnique).not.toHaveBeenCalled();
 f.authoriseCentral.mockRejectedValue(new Error('Central unavailable'));
 expect(await f.resolve(verifiedInput())).toBeNull();
 expect(f.database.user.findUnique).not.toHaveBeenCalled();
});
