# Tutor curriculum retrieval (src/tutor/rag)

Keyword-only retrieval over the curriculum. Implements `RetrievalStore` from `src/ai-runtime/retrieval.ts`.
No embeddings, no database access in this folder.

## Which source the learner route uses (fix 2026-11)

- **Learner route: `published-index.ts`.** The index is built per request from published revision bodies that the learner may open (`tutor/access/accessible-lessons.ts`). Raw files are not read.
- **Raw files: `curriculum-store.ts`, opt-in only.** `createCurriculumRetrievalStore()` throws unless `allowRawFileIndex: true` is passed. It is for offline reports and fixtures. Nothing in the learner path calls it.

## Files

- `chunker.ts`: lesson parsing and chunking (pure, no file access).
- `published-index.ts`: index over published revision bodies. Used by the learner route.
- `curriculum-store.ts`: raw-file index (opt-in), status gating, `createPlatformChunkStore` (shared search and tenant guard).
- `index.ts`: re-exports.
- Tests: `apps/backend/tests/tutor/rag/rag.test.ts` (raw-file index, fixtures in `tests/tutor/rag/fixtures/curriculum/`); learner access and published index in `apps/backend/tests/tutor/access/accessible-lessons.test.ts`.

## Tenant rule

- `PLATFORM_CURRICULUM_COMPANY_ID = 'platform-curriculum'` owns every chunk.
- `findCandidates` runs `requireCompanyId` first, then throws `AiRuntimeError('input_invalid')` for any id other than the platform id. A learner id (number or string) is rejected.
- Callers must pass the platform id as `companyId` to `retrieveChunks`. A learner's id cannot be used against this store.
- Unverified: the company registry must reserve `platform-curriculum` so no tenant can be given that id. Nothing in this folder enforces that.

## Source folders

- Read: `<root>/courses/**` and `<root>/shared/**`, the current layout in `curriculum/SCHEMA.md`.
- Not read: `curriculum/lessons/` (its own `SUPERSEDED.md` says it is superseded by `courses/` and `shared/`; `ready/` has 216 of 216 ids that also exist in current folders, `converted/` has 504 of 511), `curriculum/retired/`, and any folder named `retired`, `superseded` or `archive` inside a scan folder.
- `*.assessment.json` files are never read (assessor-only answers).
- Symlinks are skipped. A scan folder that is a symlink is refused. Nothing outside `<root>` is opened.
- Files without a string `id` and an `instruction` array (course manifests, `SHARED-REFERENCES.json`) are skipped and counted.
- A file that is not valid JSON, a duplicate lesson id, a document-id collision, or a lesson with no title throws at build time.

## Status rule

- `READY`: indexed.
- `DRAFT`: excluded by default. Indexed only when `createCurriculumRetrievalStore({ includeDrafts: true })`.
- Any other status (including missing): excluded.
- Explicit `retired: true`, `superseded: true` or `supersededBy`: excluded, whatever the status.
- Current state of the real curriculum: all 1016 lessons read `DRAFT`, so the default build indexes 0 lessons.

## Lesson text that is indexed

Learning outcomes, every instruction section (heading and body), procedure, worked examples (situation, decision prompt, reasoning), equipment and PPE, common errors (error and prevention), safety and regulatory points (prefixed `Licence notice:` when `licenceNotice` is true), quality standard, documentation and evidence, summary.

Not indexed: `knowledgeChecks` (options and questions), `referencesAtStart`, `referencesAtEnd`, `officialReferences`, `sourceReferences`, `businessFields`, and the lesson title (the title is in metadata, not in chunk text).

## Chunking

- Each block (one heading, or one fixed group such as "Procedure") is packed into chunks of at most `MAX_CHUNK_CHARS = 1200` characters, heading line included.
- Units are body lines and list items. They are packed greedily, joined with a newline.
- A unit longer than the budget is split at sentence ends, then at the last space before the budget. Words are kept in order.
- Each chunk starts with its block heading line, so a heading term matches the chunk.
- `chunk_index` counts from 0 across the whole lesson.
- Real curriculum result with drafts included: 1016 lessons, 14013 chunks, longest chunk 1200 characters.

## Document ids and metadata

- `document_id` = first 52 bits of SHA-256 of the lesson id, as a safe integer (`documentIdForLesson`). Stable across builds. Collisions throw.
- `source` = path relative to the curriculum root, with forward slashes.
- `doc_type = 'lesson'`. `title` = lesson title. `authority_level`, `jurisdiction` = null. `is_superseded = false`. `preferred_weight = 0`.

## Matching and limit

- Terms are lower-cased and trimmed. Terms shorter than `MIN_TERM_LENGTH` (3 code points) are ignored. If none remain, the result is `[]`.
- A chunk matches when its lower-cased text contains any term (substring match).
- The limit is applied after the filter. Results keep index order (source path, then chunk index). Nothing is sorted by recency.
- A limit below 1 or not a number returns `[]`.

## Decisions for review

1. `curriculum/lessons/` is not indexed. The brief named it as a source, but its SUPERSEDED.md says the folder is superseded.
2. Drafts are excluded by default, as the brief asked. With every lesson in DRAFT, the default build is empty. Owner approval (READY) or an explicit `includeDrafts` decision is needed before the tutor has content.
3. Titles are kept out of chunk text, so a query that matches only a title finds nothing.
4. The seven HR lessons in `curriculum/retired/high-risk/` are not indexed. No current lesson has the same ids.

## Not verified

- Not type-checked (`tsc` not run, per the brief). The `.ts` import suffixes follow the runtime's own convention.
- Not wired into the tutor service or the runtime's pipeline. No caller yet.
- Full-text relevance and ranking quality on real queries are not tested. Only mechanics are tested.

## Stopwords (build R2)

- `extractTerms()` in `src/ai-runtime/retrieval.ts` now drops English function words (`STOPWORDS`). Before this, the question "the" matched any chunk that contained the word. A question with only stopwords now returns no chunks and makes no store call, so the no-match refusal can fire.
- A stopword is matched after leading and trailing punctuation is removed, so "the." is dropped. Other terms keep their punctuation, as before.
- Tests: `tests/ai-runtime/ai-runtime.test.mjs` (three new tests).
