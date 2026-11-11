# Skilled Pass 10 — signed Central account linking

Issue: Skilled #71, coordinated with Central #37 / #29.

## What is implemented

The Skilled product-side signer `signSkilledCentralLinkAssertion` produces compact EdDSA/Ed25519 JWS assertions accepted by the contract in Central `packages/control-plane/src/link-assertion.ts`.

- `iss: lms`, `aud: titan-central`, `typ: titan-link+jwt`, named operator-controlled key `kid`
- Claims `sub` (verified Central/Logto subject), `org` (verified Central/Logto organisation), `lu` and `la` (local Skilled user/account), random replay nonce, `iat`, and `exp`.
- Maximum lifetime 300 seconds (default 120); IDs restricted to opaque non-email identifiers.
- Only after three independently verified server-side checks: trusted Central-to-local company mapping; local user/account ownership; and current active, verified user membership.
- Never signs a browser-provided company mapping, role, email or profile name. Does not log signing claims or private keys.

The private Ed25519 key MUST be supplied from a protected operator-managed secret source; never ship a test key or include the private key in any frontend bundle. Central must register only the matching public key and keep the server-side nonce store.

## Test evidence

Twenty-six positive and negative cases plus distinct random nonce, signature tampering, and backend failure tests run in GitHub Actions. Additional suites retest previously delivered Central local account resolution and scoped-identity checks.

## Intentional boundaries

This module is an unmounted service capability, not a public HTTP route. No database migration, live account linking, callback registration or end-user SSO is asserted.

Central already owns the verified durable link lifecycle in `titan.local_account_links` and its link assertion verifier (Central migration 0014). Creating a competing Skilled link table would violate the coordinated Central-authoritative design. Instead, a later trusted operator route will invoke the Skilled signer and submit to Central's audited provisioning flow after shared registry configuration.

Existing Skilled login, JWT issuance, review approvals and external machine credentials are unchanged.
