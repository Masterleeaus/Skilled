# SkilledAt.Work

Repository for **SkilledAt.Work** (short name: **Skilled**). The current application and curriculum live in `lms-main/`; branding assets and media libraries live in `brand/` and `library/`.

## Canonical source and branch synchronization

- **`Main` is the GitHub default and integration branch.** Branch names are case-sensitive; target `Main` for pull requests.
- Preserve unique work before removing any historical or feature branch.
- Canonical images live in repository-root `brand/` and `library/`; frontend `predev` and `prebuild` copy them into the generated public asset tree.
- See [canonical source and asset guidance](lms-main/docs/SKILLED-CANONICAL-SOURCE-AND-ASSETS.md) for active and archived source boundaries.

## Working on the application

See [the LMS development guide](lms-main/README.md) for build, test and deployment prerequisites. The root is an archive/media container as well as a source repository; do not treat historical source copies or generated indexes as the authoritative running application.

## Content safety

Curriculum source, assessment evidence and editorial approvals must be preserved. Changes to learner-visible content need fresh revision hashes and qualified review where required. A successful source commit is **not** a publication approval.
