/** Trusted offline provisioning. Never expose as a public API. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("link-identity"), service: z.enum(["field-services", "ai-workforce", "titan-central"]), externalUserRef: z.string().min(1).max(200), userId: z.string().min(1), companyRef: z.string().min(1).max(200) }).strict(),
  z.object({ action: z.literal("unlink-identity"), service: z.enum(["field-services", "ai-workforce", "titan-central"]), externalUserRef: z.string().min(1).max(200), userId: z.string().min(1), companyRef: z.string().min(1).max(200) }).strict(),
]);

export async function provision(raw: unknown, db: PrismaClient): Promise<string> {
  const input = schema.parse(raw);
  return db.$transaction(async (tx) => {
    if (input.action === "link-identity") {
      const company = await tx.company.findUnique({ where: { externalRef: input.companyRef }, select: { id: true } });
      if (!company) throw new Error("Organisation does not exist");
      const member = await tx.companyMember.findUnique({ where: { companyId_userId: { companyId: company.id, userId: input.userId } }, select: { id: true } });
      if (!member) throw new Error("User is not a member of the requested organisation");
      const existing = await tx.academyExternalIdentity.findUnique({ where: { service_externalUserRef: { service: input.service, externalUserRef: input.externalUserRef } } });
      if (existing && (existing.userId !== input.userId || (existing.companyId && existing.companyId !== company.id))) throw new Error("External identity linked to another user or organisation; manual reconciliation required");
      // A legacy unscoped row (companyId NULL) for this same learner is bound to the company. This is a write, so it is audited as such.
      const scoped = Boolean(existing && !existing.companyId);
      if (!existing) await tx.academyExternalIdentity.create({ data: { service: input.service, externalUserRef: input.externalUserRef, userId: input.userId, companyId: company.id } });
      else if (scoped) await tx.academyExternalIdentity.update({ where: { id: existing.id }, data: { companyId: company.id } });
      const outcome = !existing ? "PROVISION_IDENTITY_CREATED" : scoped ? "PROVISION_IDENTITY_SCOPED" : "PROVISION_IDENTITY_CONFIRMED";
      await tx.academyIntegrationAudit.create({ data: { service: input.service, companyRef: input.companyRef, externalUserRef: input.externalUserRef, outcome } });
      return !existing ? "Identity linked" : scoped ? "Legacy identity scoped to organisation" : "Identity already linked to requested user";
    }
    const company = await tx.company.findUnique({ where: { externalRef: input.companyRef }, select: { id: true } });
    if (!company) throw new Error("Organisation does not exist");
    const existing = await tx.academyExternalIdentity.findUnique({ where: { service_externalUserRef: { service: input.service, externalUserRef: input.externalUserRef } } });
    // Legacy unscoped rows (companyId NULL) can be removed by the same learner so operators can clear them.
    if (!existing || existing.userId !== input.userId || (existing.companyId && existing.companyId !== company.id)) throw new Error("Identity not linked to specified user and organisation");
    await tx.academyExternalIdentity.delete({ where: { id: existing.id } });
    await tx.academyIntegrationAudit.create({ data: { service: input.service, companyRef: input.companyRef, externalUserRef: input.externalUserRef, outcome: "PROVISION_IDENTITY_REVOKED" } });
    return "Identity revoked";
  });
}

if (require.main === module) {
  const db = new PrismaClient();
  (async () => {
    // Read JSON from stdin rather than argv so sensitive identifiers do not enter shell history.
    let input = "";
    for await (const chunk of process.stdin) input += chunk.toString();
    if (input.length > 8192) throw new Error("Provisioning input too large");
    console.log(await provision(JSON.parse(input), db));
  })().catch((error) => { console.error(error instanceof Error ? error.message : "Provisioning failed"); process.exitCode = 1; }).finally(() => db.$disconnect());
}
