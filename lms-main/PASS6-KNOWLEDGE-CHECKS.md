# Pass 6 — Knowledge checks

Published revisions may include `knowledgeChecks: [{ question: string, options: string[], correctIndex: number }]`.
The learner course outline strips correctIndex, explanation and rationale; answers are graded on the server. Each attempt is recorded in PostgreSQL, separately from lesson reading acknowledgement and practical competency. Passing requires >=80%.

Limitations: no live database, browser or TypeScript compilation test in this environment. Instructor/editor lesson detail routes still expose answer keys to authenticated users and require role-level restriction before production. Question schema validation at authoring/publish time and more comprehensive answer-key isolation remain next priorities.
