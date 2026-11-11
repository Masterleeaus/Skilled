# Skilled link assertions for Central (issue #163)

Wire contract: Central `docs/LINKING.md` and `packages/control-plane/src/link-assertion.ts`.
Code: `apps/backend/src/modules/auth/central-link-assertion.ts`. Tests: `apps/backend/src/tests/central-link-assertion*.test.ts`.

## What the signer does

`signSkilledCentralLinkAssertion` issues a compact EdDSA JWS with header `{alg:"EdDSA", typ:"titan-link+jwt", kid}`
and claims `iss:"lms"`, `aud:"titan-central"`, `sub`, `org`, `lu`, `la`, `nonce`, `iat`, `exp`. Lifetime is at most 300 seconds (default 120).
The signer signs only after three checks pass: the Central organisation maps to the company, the local account belongs to the user and company,
and the user is an active verified member. Any failure throws `LinkAssertionDenied` and nothing is signed.
The claims contain no email, name, company or role.

## Configuration (operator only)

| Name | Meaning |
| --- | --- |
| `SKILLED_CENTRAL_LINK_SIGNING_KEY` | Base64 of the Ed25519 private key in PKCS#8 DER form. Empty or absent means signing is unavailable. |
| `SKILLED_CENTRAL_LINK_SIGNING_KID` | Key identifier, placed in the header. Must match the public key that the operator gives to Central. |

`loadCentralLinkSigningOptions` refuses non-Ed25519 keys and bad identifiers. Its error messages never include key material.
The private key is not in this repository. Central holds only the public key, in its own configuration.

## Verification evidence

- `src/tests/fixtures/central-link-assertion-vectors/LMS-LA-V01.json` holds a token signed by this signer and the public key only.
  Central's `LinkAssertionVerifier` accepted it when it was recorded (result: `productId: "lms"`).
- `src/tests/central-link-assertion-vector.test.ts` checks the signature, the exact header and claims, the claim rules, and the key loader.
- Central's own tests generate their keys at run time. They have no fixed vectors yet. Central issue #71 is expected to provide shared vectors.
  When it does, replace `LMS-LA-V01.json` with those vectors.

## Open

- Central must register the LMS public key and key ID, with a `notBefore` window, before any live link can be made. This is an owner and Central operator task.
- The signer is not mounted on any route. Its live use depends on the account-link workflow in Central issue #37.
