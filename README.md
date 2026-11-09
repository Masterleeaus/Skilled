# SkilledAt.Work

Repository for **SkilledAt.Work** (short name: **Skilled**). The current application and curriculum live in `lms-main/`; branding assets and media libraries live in `brand/` and `library/`.

## Canonical source and branch synchronization

- **`main` is the development integration branch** and the canonical source for fixes and pull requests.
- GitHub currently displays `claude/exciting-hypatia-6a81vd` as its default branch. That branch is a **synchronized landing-page mirror**, not an independent source of truth.
- Before relying on a default-branch download, checkout, or code search, compare `main` against the displayed default branch. The two tips should be identical.
- After verified changes merge into `main`, fast-forward the landing-page branch to exactly the same commit. Never force-reset divergent work; inspect both histories and preserve unique commits first.
- Open feature branches from the current `main` tip and target `main` in pull requests.
- If administrative permissions and repository policy permit, changing the GitHub default branch to `main` is preferable. Until then, maintain the mirror.
- Do not describe synchronization as permanent: it must be rechecked after new merges.

## Working on the application

See [the LMS development guide](lms-main/README.md) for build, test and deployment prerequisites. The root is an archive/media container as well as a source repository; do not treat historical source copies or generated indexes as the authoritative running application.

## Content safety

Curriculum source, assessment evidence and editorial approvals must be preserved. Changes to learner-visible content need fresh revision hashes and qualified review where required. A successful source commit is **not** a publication approval.
