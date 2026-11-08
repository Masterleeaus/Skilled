import { describe, expect, it } from "vitest";
import {
  revalidateCentralSession,
  type CentralSessionBinding, type CentralAccessRecheck, type FreshCentralAccess,
} from "../modules/auth/central-session-revalidation";
import type { CentralResolutionStore } from "../modules/auth/central-identity-resolver";

const trusted = {
  issuer: "https://identity.example.test",
  audience: "urn:titan-central:product:lms" as const,
};
const binding: CentralSessionBinding = {
  subject: "central-user-123",
  issuer: trusted.issuer,
  audience: trusted.audience,
  organisationRef: "central-org-1",
  companyId: "skilled-company-1",
  localUserId: "learner-1",
  memberRole: "LEARNER",
  centralMembershipRevision: 8,
  centralLinkRevision: 3,
};
const grant: FreshCentralAccess = {
  authorised: true,
  subject: binding.subject,
  issuer: binding.issuer,
  audience: binding.audience,
  organisationRef: binding.organisationRef,
  membershipRevision: binding.centralMembershipRevision,
  linkRevision: binding.centralLinkRevision,
};

function fixture() {
  const queries: string[] = [];
  let memberRole = "LEARNER";
  let linkCompany: string | null = binding.companyId;
  let userActive = true;
  let userDeleted = false;
  const store: CentralResolutionStore = {
    company: {
      findUnique: async ({where}) => {
        queries.push("company:" + where.externalRef);
        return {id:binding.companyId};
      },
    },
    academyExternalIdentity: {
      findMany: async ({where}) => {
        queries.push("identity:" + where.service + ":" + where.externalUserRef);
        return [{id:"link-1",companyId:linkCompany,userId:binding.localUserId}];
      },
    },
    user: {
      findUnique: async () => {
        queries.push("user");
        return {id:binding.localUserId,role:"STUDENT",isActive:userActive,isEmailVerified:true,
          deletedAt:userDeleted?new Date():null};
      },
    },
    companyMember: {
      findUnique: async () => {
        queries.push("member");
        return {role:memberRole};
      },
    },
  };
  const setMemberRole=(role:string)=>{memberRole=role;};
  const setCompany=(company:string|null)=>{linkCompany=company;};
  const setUserActive=(active:boolean)=>{userActive=active;};
  const setUserDeleted=(deleted:boolean)=>{userDeleted=deleted;};
  return {queries,store,setMemberRole,setCompany,setUserActive,setUserDeleted};
}

const check = async (
  recheck:CentralAccessRecheck, f=fixture(), b:CentralSessionBinding=binding,
) => revalidateCentralSession(b,recheck,f.store,trusted);

describe("Central-linked session revalidation (not mounted; no session issuance)", () => {
  it("permits unchanged fresh Central grant and current local role", async () => {
    const f=fixture();
    expect(await check(async req => {
      expect(req).toEqual({
        subject:binding.subject,issuer:binding.issuer,audience:binding.audience,
        organisationRef:binding.organisationRef,
      });
      return grant;
    },f)).toBe(true);
    expect(f.queries).toEqual(["company:central-org-1","identity:titan-central:central-user-123","user","member"]);
  });

  it("denies revoked, stale or changed Central membership and account link revisions before local lookup", async () => {
    for(const changed of [
      {...grant,authorised:false},
      {...grant,membershipRevision:9},
      {...grant,linkRevision:4},
      {...grant,membershipRevision:-1},
      {...grant,linkRevision:Number.NaN},
    ]) {
      const f=fixture();
      expect(await check(async()=>changed,f)).toBe(false);
      expect(f.queries).toEqual([]);
    }
  });

  it("denies cross-product, foreign organisation, different subject or issuer", async () => {
    for(const changed of [
      {...grant,audience:"urn:titan-central:product:sorted"},
      {...grant,organisationRef:"foreign-org"},
      {...grant,subject:"other-user"},
      {...grant,issuer:"https://different.example.test"},
    ]) {
      const f=fixture();
      expect(await check(async()=>changed,f)).toBe(false);
      expect(f.queries).toEqual([]);
    }
  });

  it("denies Central transport exceptions instead of reusing an old login", async () => {
    const f=fixture();
    expect(await check(async()=>{throw new Error("central unavailable");},f)).toBe(false);
    expect(f.queries).toEqual([]);
  });

  it("denies missing local member, role demotion, unlink and company transfer", async () => {
    for(const role of ["ASSESSOR","REVOKED"]) {
      const f=fixture();f.setMemberRole(role);
      expect(await check(async()=>grant,f)).toBe(false);
    }
    for(const company of [null,"different-company"]) {
      const f=fixture();f.setCompany(company);
      expect(await check(async()=>grant,f)).toBe(false);
    }
  });

  it("denies inactive or soft-deleted local accounts even with valid Central grant", async () => {
    const inactive=fixture();inactive.setUserActive(false);
    expect(await check(async()=>grant,inactive)).toBe(false);
    const deleted=fixture();deleted.setUserDeleted(true);
    expect(await check(async()=>grant,deleted)).toBe(false);
  });

  it("denies tampered session identity, scope, role or revisions", async () => {
    for(const change of [
      {localUserId:"other-local-user"},{companyId:"other-company"},
      {organisationRef:"other-org"},{memberRole:"OWNER" as const},
      {centralMembershipRevision:-1},{centralLinkRevision:Number.MAX_SAFE_INTEGER+1},
      {issuer:"https://other.example.test"},
    ]) {
      expect(await check(async()=>grant,fixture(),{...binding,...change})).toBe(false);
    }
  });

  it("denies sessions when no trusted checker is configured", async () => {
    const f=fixture();
    expect(await revalidateCentralSession(binding,undefined as unknown as CentralAccessRecheck,
      f.store,trusted)).toBe(false);
    expect(f.queries).toEqual([]);
  });
});
