import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const page = readFileSync(new URL("../src/app/admin/business-context/page.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/lib/curriculum.api.ts", import.meta.url), "utf8");
const nav = readFileSync(new URL("../src/components/AdminNav.tsx", import.meta.url), "utf8");
const checks = [
  ["admin navigation", nav.includes("/admin/business-context")],
  ["manager read", api.includes("fetchOrganisationBusinessFields")],
  ["registry read", api.includes("fetchBusinessFieldRegistry")],
  ["draft mutation", api.includes("saveOrganisationBusinessField")],
  ["explicit approval", page.includes("Approve for learners")],
  ["retirement", page.includes("retire.mutate(key)")],
  ["organisation selector", page.includes("setCompanyId(e.target.value)")],
  ["no automatic approval on save", !api.slice(api.indexOf("export async function saveOrganisationBusinessField"),api.indexOf("export async function approveOrganisationBusinessField")).includes("/approve")],
  ["server routes", api.includes("/academy/curriculum/companies/")],
];
for (const [name, ok] of checks) { assert.ok(ok, name); console.log("PASS", name); }
