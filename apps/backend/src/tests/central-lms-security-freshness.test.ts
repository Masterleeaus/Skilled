import {it,expect} from 'vitest';
import {fixture,verifiedInput,fixedNow} from './central-lms-security.fixture';
it('rejects stale or future-dated Central verification as a replay guard',async()=>{
 const f=fixture();
 for(const offset of [-120001,120001,-86400000,86400000]){
  expect(await f.resolve({...verifiedInput(),verifiedAt:new Date(fixedNow+offset).toISOString()})).toBeNull();
 }
 for(const invalid of ['not-a-timestamp','',42,null]){
  expect(await f.resolve({...verifiedInput(),verifiedAt:invalid})).toBeNull();
 }
 expect(f.database.user.findUnique).not.toHaveBeenCalled();
});
