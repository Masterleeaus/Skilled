# Certificate verification

Covers issue #57: how certificates are verified publicly, and how certificates issued before the change keep working.

## What changed

| Area | Before | Now |
| --- | --- | --- |
| Verification key | `certificateNumber`, `LMS-YYYY-XXXXXXXX`, 32 random bits | `verificationToken`, 128 random bits, base64url, 22 characters |
| Public route | `GET /api/certificates/verify/:certificateNumber`, no rate limit | `GET /api/certificates/verify/:code`, 30 requests per 15 minutes per client IP |
| Response | `valid`, `studentName`, `courseTitle`, `issuedAt` | `valid`, `certificateNumber`, `courseTitle`, `issuedAt`. `studentName` only when the learner opts in |
| Caching | Not set | `Cache-Control: no-store` |

The PDF prints both the display number (`Certificate No:`) and the verification code (`Verification code:`). The verification code is the value to share or to type into the verify route.

## New certificates

`issueCertificate` generates `generateVerificationToken()` (16 bytes from `crypto.randomBytes`, encoded as base64url) and stores it in `certificates.verificationToken`, which has a unique index. The token is not derived from the learner, the course or the display number. Only the token is accepted for a new certificate. Its display number is not accepted by the verify route.

## Legacy certificates (`verificationToken` is NULL)

Migration `20261108140000_certificate_verification_token` adds the column without a backfill. Its plan:

- A legacy certificate keeps its number and stays valid. `verifyCertificate` matches `LMS-YYYY-XXXXXXXX` codes only on rows where `verificationToken IS NULL`.
- A legacy PDF does not print a token, so nothing is re-issued and no PDF is regenerated.
- The 32-bit number is still guessable. The rate limit on the route is the control for these rows. Accepting that risk is deliberate for backward compatibility.
- A learner who wants a token for a legacy certificate needs a re-issue. This is not built. It would be a separate task: it would generate a new certificate row and PDF, and the old number would then stop verifying.

## Name disclosure (opt-in)

`certificates.showNameOnVerify` defaults to `false`. A verify response includes `studentName` only when this flag is `true`. The learner sets it with:

`PATCH /api/certificates/:certificateId/verification-visibility` with body `{ "showNameOnVerify": true }` (student role, owner only).

Existing rows are `false`, so the migration stops disclosure of names by the public route straight away.

## Rate limit

`verifyLimiter` in `certificate.routes.ts` counts all requests to the verify route, including unknown codes, so guessing runs are throttled. The limiter uses the same `express-rate-limit` pattern as `auth.routes.ts`. The app's `trust proxy` setting is `loopback`, so the limit is keyed on the real client address when it is behind the local proxy.

## Tests

- `apps/backend/src/tests/certificate-verification.test.ts`: token length, format and uniqueness; PDF contains the token; response shape; opt-in; legacy lookup; owner-only toggle.
- `apps/backend/src/tests/certificate-verify-rate-limit.test.ts`: 30 requests allowed, the 31st returns 429.
