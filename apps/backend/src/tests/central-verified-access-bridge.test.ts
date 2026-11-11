import { describe, expect, it } from "vitest";
import {
  checkCentralLinkedSession,
  type CentralDecisionTransport,
} from "../modules/auth/central-verified-access-bridge";
import type { CentralSessionBinding } from "../modules/auth/central-session-revalidation";
import type { CentralResolutionStore } from "../modules/auth/central-identity-resolver";

const trusted = {
  issuer: "https://identity.example.test",
  audience: "urn:titan-central:product:lms" as const,
};
const binding: CentralSessionBinding = {
  issuer: trusted.issuer,
  audience: trusted.audience,
  subject: "central-sub-1",
  organisationRef: "org-1",
  companyId: "company-1",
  localUserId: "user-1",
  memberRole: "LEARNER",
  centralMembershipRevision: 8,
  centralLinkRevision: 2,
};
const allowedDecision = {
  allowed: true,
  subject: binding.subject,
  issuer: binding.issuer,
  audience: binding.audience,
  organisationRef: binding.organisationRef,
  localUserId: binding.localUserId,
  companyId: binding.companyId,
  memberRole: binding.memberRole,
  membershipRevision: binding.centralMembershipRevision,
  linkRevision: binding.centralLinkRevision,
};

function makeStore() {
  const calls: string[] = [];
  let memberRole = "LEARNER";
  let companyId: string | null = binding.companyId;
  let userActive = true;
  const store: CentralResolutionStore = {
    company: {findUnique: async ({where}) => {
      calls.push("company:" + where.externalRef);
      return {id:binding.companyId};
    }},
    academyExternalIdentity: {findMany: async ({where}) => {
      calls.push("link:" + where.externalUserRef);
      return [{id:"link-1",companyId,userId:binding.localUserId}];
    }},
    user: {findUnique: async ({where}) => {
      calls.push("user:" + where.id);
      return {id:binding.localUserId,role:"STUDENT",isActive:userActive,
        isEmailVerified:true,deletedAt:null};
    }},
    companyMember: {findUnique: async () => {
      calls.push("member");
      return {role:memberRole};
    }},
  };
  return {
    calls,store,
    setRole:(role:string)=>{memberRole=role;},
    setCompany:(id:string|null)=>{companyId=id;},
    deactivate:()=>{userActive=false;},
  };
}

describe("Central decision to local Skilled session integration boundary", () => {
  it("allows an exact future revisioned decision after one fresh check and local membership lookup", async () => {
    const fixture=makeStore();
    let transportCalls=0;
    const result=await checkCentralLinkedSession(binding,async request => {
      transportCalls++;
      expect(request).toEqual({
        subject:binding.subject,issuer:binding.issuer,audience:binding.audience,
        organisationRef:binding.organisationRef,
      });
      return allowedDecision;
    },fixture.store,trusted);
    expect(result).toEqual({allowed:true});
    expect(transportCalls).toBe(1);
    expect(fixture.calls).toEqual(["company:org-1","link:central-sub-1","user:user-1","member"]);
  });

  it("rejects Central's actual current access-check allow and deny responses before local lookup", async () => {
    for(const response of [
      {allowed:true,role:"learner",reason:"allowed"},
      {allowed:false,role:null,reason:"membership_inactive"},
    ]) {
      const fixture=makeStore();
      expect(await checkCentralLinkedSession(binding,async()=>response,fixture.store,trusted))
        .toEqual({allowed:false,reason:"contract_rejected"});
      expect(fixture.calls).toEqual([]);
    }
  });

  it("rejects revoked or changed Central revisions before local lookup", async () => {
    for(const difference of [{membershipRevision:9},{linkRevision:3}]) {
      const fixture=makeStore();
      expect(await checkCentralLinkedSession(binding,async()=>({...allowedDecision,...difference}),
        fixture.store,trusted)).toEqual({allowed:false,reason:"contract_rejected"});
      expect(fixture.calls).toEqual([]);
    }
  });

  it("rejects subject, company, audience and organisation substitution before local lookup", async () => {
    for(const difference of [
      {subject:"other-central-user"}, {companyId:"other-company"},
      {audience:"urn:titan-central:product:sorted"}, {organisationRef:"other-org"},
    ]) {
      const fixture=makeStore();
      expect(await checkCentralLinkedSession(binding,async()=>({...allowedDecision,...difference}),
        fixture.store,trusted)).toEqual({allowed:false,reason:"contract_rejected"});
      expect(fixture.calls).toEqual([]);
    }
  });

  it("rejects local role downgrade, unscoped link, company transfer and inactive user", async () => {
    const scenarios=[
      (f:ReturnType<typeof makeStore>)=>f.setRole("ASSESSOR"),
      (f:ReturnType<typeof makeStore>)=>f.setCompany(null),
      (f:ReturnType<typeof makeStore>)=>f.setCompany("foreign-company"),
      (f:ReturnType<typeof makeStore>)=>f.deactivate(),
    ];
    for(const mutate of scenarios) {
      const fixture=makeStore(); mutate(fixture);
      expect(await checkCentralLinkedSession(binding,async()=>allowedDecision,fixture.store,trusted))
        .toEqual({allowed:false,reason:"access_denied"});
    }
  });

  it("denies transport outages, malformed decisions and absent checker", async () => {
    const fixture=makeStore();
    const outage:CentralDecisionTransport=async()=>{throw new Error("central unavailable");};
    expect(await checkCentralLinkedSession(binding,outage,fixture.store,trusted))
      .toEqual({allowed:false,reason:"access_denied"});
    expect(await checkCentralLinkedSession(binding,async()=>null,fixture.store,trusted))
      .toEqual({allowed:false,reason:"contract_rejected"});
    expect(await checkCentralLinkedSession(binding,undefined as unknown as CentralDecisionTransport,
      fixture.store,trusted)).toEqual({allowed:false,reason:"access_denied"});
    expect(fixture.calls).toEqual([]);
  });

  it("rejects missing or mismatched trusted configuration before transport execution", async () => {
    const fixture=makeStore();
    let attempts=0;
    const transport=async()=>{attempts++;return allowedDecision;};
    expect(await checkCentralLinkedSession(binding,transport,fixture.store,
      {...trusted,issuer:"https://wrong-issuer.example.test"}))
      .toEqual({allowed:false,reason:"access_denied"});
    expect(await checkCentralLinkedSession(binding,transport,fixture.store,
      undefined as unknown as typeof trusted))
      .toEqual({allowed:false,reason:"access_denied"});
    expect(attempts).toBe(0);
  });

  it("never caches a prior positive result across a later revocation", async () => {
    const fixture=makeStore();
    let current: unknown=allowedDecision;
    const transport=async()=>current;
    expect(await checkCentralLinkedSession(binding,transport,fixture.store,trusted)).toEqual({allowed:true});
    current={allowed:false,role:null,reason:"membership_revoked"};
    expect(await checkCentralLinkedSession(binding,transport,fixture.store,trusted))
      .toEqual({allowed:false,reason:"contract_rejected"});
  });
});
