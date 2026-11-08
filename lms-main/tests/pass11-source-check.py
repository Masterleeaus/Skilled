from pathlib import Path
s=(Path(__file__).resolve().parents[1]/"apps/backend/src/modules/curriculum/curriculum.routes.ts").read_text()
checks={
 "organisation assignment constrained": 'companyId: input.companyId, learnerId, status: "ASSIGNED"' in s,
 "eligible placement uses assigned courses": 'assignedCourses.map(a => a.courseId)' in s,
 "expiry must be future": 'input.expiresAt <= new Date()' in s,
 "rejection cannot expire": 'input.decision === "REJECTED" && input.expiresAt' in s,
 "active skill query excludes expired": 'expiresAt: { gt: now }' in s,
 "active skill query requires membership": 'Active skills access denied' in s,
}
for name,ok in checks.items(): print(("PASS" if ok else "FAIL"),name)
assert all(checks.values())
