import { test } from "node:test";
import assert from "node:assert/strict";
import { roleNavLinks } from "../../src/lib/nav-links.ts";

const hrefs = (links: { href: string }[]) => links.map((l) => l.href);

test("anonymous visitors get no role links", () => {
  assert.deepEqual(roleNavLinks(null, []), []);
  assert.deepEqual(roleNavLinks(undefined, [{ role: "OWNER" }]), []);
});

test("students see Pathways, but not Assessor review without an assessor role", () => {
  assert.deepEqual(hrefs(roleNavLinks({ role: "STUDENT" }, [{ role: "LEARNER" }])), ["/pathways"]);
});

test("students with an assessor organisation role also see Assessor review", () => {
  for (const role of ["OWNER", "MANAGER", "ASSESSOR"]) {
    assert.deepEqual(hrefs(roleNavLinks({ role: "STUDENT" }, [{ role }])), ["/pathways", "/academy/assessor"]);
  }
});

test("admins and teachers do not get the Pathways link", () => {
  assert.deepEqual(roleNavLinks({ role: "ADMIN" }, []), []);
  assert.deepEqual(roleNavLinks({ role: "TEACHER" }, []), []);
});

test("an assessor organisation role grants Assessor review regardless of global role", () => {
  assert.deepEqual(hrefs(roleNavLinks({ role: "TEACHER" }, [{ role: "ASSESSOR" }])), ["/academy/assessor"]);
});

test("memberships without an assessor-capable role do not grant Assessor review", () => {
  assert.deepEqual(roleNavLinks({ role: "TEACHER" }, [{ role: "LEARNER" }, {}]), []);
});
