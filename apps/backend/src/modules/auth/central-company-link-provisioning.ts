/**
 * Operator-only local account mapping. Never expose to browser requests or accept
 * an email as an identity. Central's trusted provisioner remains authoritative.
 */
import type { PrismaClient } from "@prisma/client";

const opaque = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const actor = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
export type CentralLinkCommand = {
  action: "link" | "revoke";
  centralOrganisationId: string;
  localAccountId: string;
  companyId: string;
  actorRef: string;
};
export class CentralLinkConflict extends Error {
  constructor(readonly code: "INVALID_COMMAND" | "UNKNOWN_COMPANY" | "MAPPING_CONFLICT" | "NOT_LINKED") {
    super("Central local mapping rejected");
    this.name = "CentralLinkConflict";
  }
}
export function validateCentralLinkCommand(raw: unknown): CentralLinkCommand {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new CentralLinkConflict("INVALID_COMMAND");
  const v = raw as Record<string, unknown>;
  if (Object.keys(v).sort().join("|") !==
      ["action","actorRef","centralOrganisationId","companyId","localAccountId"].sort().join("|") ||
      (v.action !== "link" && v.action !== "revoke") ||
      ![v.centralOrganisationId,v.companyId,v.localAccountId].every(x => typeof x === "string" && opaque.test(x)) ||
      typeof v.actorRef !== "string" || !actor.test(v.actorRef)) {
    throw new CentralLinkConflict("INVALID_COMMAND");
  }
  return v as CentralLinkCommand;
}
export async function applyCentralLinkCommand(raw: unknown, db: PrismaClient) {
  const command = validateCentralLinkCommand(raw);
  return db.$transaction(async tx => {
    const { centralOrganisationId, localAccountId, companyId, actorRef, action } = command;
    const company = await tx.company.findUnique({where:{id:companyId},select:{id:true}});
    if (!company) throw new CentralLinkConflict("UNKNOWN_COMPANY");
    const [byOrg,byAccount,byCompany] = await Promise.all([
      tx.centralCompanyLink.findUnique({where:{centralOrganisationId}}),
      tx.centralCompanyLink.findUnique({where:{localAccountId}}),
      tx.centralCompanyLink.findUnique({where:{companyId}}),
    ]);
    const found=[byOrg,byAccount,byCompany].filter((v):v is NonNullable<typeof v>=>v!==null);
    if (found.some(v=>v.centralOrganisationId!==centralOrganisationId ||
      v.localAccountId!==localAccountId || v.companyId!==companyId)) {
      throw new CentralLinkConflict("MAPPING_CONFLICT");
    }
    const existing=byOrg;
    if (action==="revoke") {
      if (!existing || existing.state!=="verified") throw new CentralLinkConflict("NOT_LINKED");
      const changed=await tx.centralCompanyLink.updateMany({
        where:{id:existing.id,state:"verified"},data:{state:"revoked"},
      });
      if (changed.count!==1) throw new CentralLinkConflict("MAPPING_CONFLICT");
      await tx.centralCompanyLinkAudit.create({
        data:{centralOrganisationId,localAccountId,companyId,actorRef,outcome:"LINK_REVOKED"},
      });
      return "LINK_REVOKED";
    }
    let outcome: "LINK_CREATED" | "LINK_CONFIRMED" | "LINK_REVERIFIED";
    if (!existing) {
      await tx.centralCompanyLink.create({
        data:{centralOrganisationId,localAccountId,companyId,state:"verified"},
      });
      outcome="LINK_CREATED";
    } else if (existing.state==="revoked") {
      const changed=await tx.centralCompanyLink.updateMany({
        where:{id:existing.id,state:"revoked"},data:{state:"verified"},
      });
      if (changed.count!==1) throw new CentralLinkConflict("MAPPING_CONFLICT");
      outcome="LINK_REVERIFIED";
    } else {
      outcome="LINK_CONFIRMED";
    }
    await tx.centralCompanyLinkAudit.create({
      data:{centralOrganisationId,localAccountId,companyId,actorRef,outcome},
    });
    return outcome;
  });
}
