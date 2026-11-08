/** Operator-only CLI. JSON stdin: {action:"create"|"revoke"|"rotate"|"list",service,companyRef,label?,days?,id?} */
import { randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (input.action === "create") {
    if (!["field-services", "ai-workforce"].includes(input.service) ||
      typeof input.companyRef !== "string" || !input.companyRef.trim() ||
      typeof input.label !== "string" || !input.label.trim() ||
      !Number.isInteger(input.days) || input.days < 1 || input.days > 365) throw Error("Invalid credential request");
    const company = await prisma.company.findUnique({ where: { externalRef: input.companyRef } });
    if (!company) throw Error("Organisation not provisioned");
    const token = randomBytes(48).toString("base64url");
    const credential = await prisma.academyServiceCredential.create({ data: {
      service: input.service, companyRef: input.companyRef, label: input.label,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + input.days * 86400000),
    }});
    // Token is printed exactly once. Protect terminal output and do not commit it.
    process.stdout.write(JSON.stringify({ id: credential.id, token, expiresAt: credential.expiresAt }) + "\n");
  } else if (input.action === "rotate") {
    if (typeof input.id !== "string" || !input.id ||
      !Number.isInteger(input.days) || input.days < 1 || input.days > 365)
      throw Error("Invalid rotation request");
    const token = randomBytes(48).toString("base64url");
    const replacement = await prisma.$transaction(async (tx) => {
      const old = await tx.academyServiceCredential.findUnique({ where: { id: input.id } });
      if (!old || old.revokedAt || (old.expiresAt && old.expiresAt <= new Date()))
        throw Error("Credential is missing, revoked or expired");
      // Conditional update prevents two simultaneous rotations of the same credential.
      const revoked = await tx.academyServiceCredential.updateMany({
        where: { id: old.id, revokedAt: null }, data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) throw Error("Credential was concurrently revoked");
      return tx.academyServiceCredential.create({ data: {
        service: old.service, companyRef: old.companyRef,
        label: typeof input.label === "string" && input.label.trim() ? input.label.trim() : old.label,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + input.days * 86400000),
      }});
    });
    process.stdout.write(JSON.stringify({ id: replacement.id, token, expiresAt: replacement.expiresAt, replacedId: input.id }) + "\n");
  } else if (input.action === "list") {
    if (typeof input.companyRef !== "string" || !input.companyRef.trim() ||
      !["field-services", "ai-workforce"].includes(input.service)) throw Error("Invalid list request");
    const credentials = await prisma.academyServiceCredential.findMany({
      where: { service: input.service, companyRef: input.companyRef },
      select: { id: true, service: true, companyRef: true, label: true, createdAt: true, expiresAt: true, revokedAt: true },
      orderBy: { createdAt: "desc" },
    });
    process.stdout.write(JSON.stringify({ credentials }) + "\n");
  } else if (input.action === "revoke") {
    if (typeof input.id !== "string" || !input.id) throw Error("Credential ID required");
    const result = await prisma.academyServiceCredential.updateMany({ where: { id: input.id, revokedAt: null }, data: { revokedAt: new Date() } });
    process.stdout.write(JSON.stringify({ revoked: result.count }) + "\n");
  } else throw Error("Unknown action");
}
main().catch(e => { process.stderr.write(String(e) + "\n"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
