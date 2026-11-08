# Pass 37 — Curriculum editorial review queue

Run `node scripts/build-curriculum-review-queue.mjs` to regenerate the deterministic JSON and CSV review queues. Run `node scripts/test-curriculum-review-queue.mjs` to verify queue integrity against the original lesson files.

The 216 lesson drafts have 73 unique drafts with at least one editorial blocker: 15 P0 (missing usable instructional sections), 16 P1 (outcomes absent, excluding higher-priority P0), and 42 P2 (course mapping absent, excluding higher-priority items). Individual issue counts overlap: 15 missing instructional sections, 21 missing explicit outcomes, and 42 missing course mappings.

The queue includes original source paths and SHA-256 hashes for editorial traceability. It is NOT an approval mechanism. Source lessons are unchanged; editorial staff must validate actual course mapping, teaching content, and outcomes before publication. The priority is triage order, not publication eligibility.

Next: implement a human-reviewed corrections workflow with source hash checks, versioned approvals, and a strict publication gate; complete dependency-backed compilation and database tests.
