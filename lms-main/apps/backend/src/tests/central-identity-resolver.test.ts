import { describe, expect, it } from "vitest";
import {
  CENTRAL_LINK_SERVICE, resolveVerifiedCentralIdentity,
  type CentralResolutionStore, type VerifiedCentralIdentity,
} from "../modules/auth/central-identity-resolver";

const principal: VerifiedCentralIdentity = {
  subject: "sub-101", issuer: "https://identity.example.test",
  audience: "urn:titan-central:product:lms", organisationRef: "org-111",
  authorised: true,
};

function fixture() {
  const calls: string[] = [];
  const state = {
    company: { id: "company-one" } as { id: string } | null,
    links: [{ id: "link-1", companyId: "company-one", userId: "learner-1" }] as
      Array<{id: string; companyId: string | null; userId: string}>,
    user: { id: "learner-1", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null } as
      { id:string; role:string; isActive:boolean; isEmailVerified:boolean; deletedAt:Date|null } | null,
    membership: { role: "LEARNER" } as { role: string } | null,
  };
  const store: CentralResolutionStore = {
    company: { findUnique: async ({where}) => {
      calls.push("company:" + where.externalRef);
      return state.company;
    } },
    academyExternalIdentity: { findMany: async ({where,take}) => {
      calls.push("links:" + where.service + ":" + where.externalUserRef + ":" + take);
      return state.links;
    } },
    user: { findUnique: async ({where}) => {
      calls.push("user:" + where.id);
      return state.user;
    } },
    companyMember: { findUnique: async ({where}) => {
      calls.push("member:" + where.companyId_userId.companyId + ":" + where.companyId_userId.userId);
      return state.membership;
    } },
  };
  return {state,calls,store};
}

describe("Central -> Skilled verified local identity boundary", () => {
  it("resolves a verified scoped subject to an eligible local learner without issuing a session", async () => {
    const { store,calls } = fixture();
    const result = await resolveVerifiedCentralIdentity(principal,store);
    expect(result).toEqual({
      userId:"learner-1",companyId:"company-one",companyRef:"org-111",
      memberRole:"LEARNER",canIssueSession:false,
    });
    expect(calls).toEqual([
      "company:org-111", "links:" + CENTRAL_LINK_SERVICE + ":sub-101:2",
      "user:learner-1", "member:company-one:learner-1",
    ]);
  });

  it("refuses unverified, malformed or missing required identity claims without DB queries", async () => {
    const invalid: unknown[] = [
      {...principal,authorised:false}, {...principal,subject:""},
      {...principal,issuer:"http://insecure.example"}, {...principal,audience:""},
      {...principal,organisationRef:""}, {...principal,subject:"../../foo"},
      {...principal,organisationRef:"organisation with spaces"}, null,
    ];
    for (const input of invalid) {
      const {store,calls}=fixture();
      expect(await resolveVerifiedCentralIdentity(input as VerifiedCentralIdentity,store)).toBeNull();
      expect(calls).toEqual([]);
    }
  });

  it("refuses unknown organisation without consulting links", async () => {
    const {state,store,calls}=fixture();state.company=null;
    expect(await resolveVerifiedCentralIdentity(principal,store)).toBeNull();
    expect(calls).toEqual(["company:org-111"]);
  });

  it("refuses foreign tenant, unscoped, missing and ambiguous identity links", async () => {
    for (const links of [
      [], [{id:"x",companyId:null,userId:"learner-1"}],
      [{id:"x",companyId:"company-two",userId:"learner-1"}],
      [{id:"x",companyId:"company-one",userId:"learner-1"},{id:"y",companyId:"company-one",userId:"learner-2"}],
    ]) {
      const {state,store,calls}=fixture();
      state.links=links as typeof state.links;
      expect(await resolveVerifiedCentralIdentity(principal,store)).toBeNull();
      expect(calls.some(x=>x.startsWith("user:"))).toBe(false);
    }
  });

  it("refuses deactivated, unverified, soft-deleted or missing users", async () => {
    for (const mutation of [
      (s:ReturnType<typeof fixture>["state"])=>{s.user=null;},
      (s:ReturnType<typeof fixture>["state"])=>{s.user!.isActive=false;},
      (s:ReturnType<typeof fixture>["state"])=>{s.user!.isEmailVerified=false;},
      (s:ReturnType<typeof fixture>["state"])=>{s.user!.deletedAt=new Date();},
      (s:ReturnType<typeof fixture>["state"])=>{s.user!.id="other";},
    ]) {
      const {state,store}=fixture();mutation(state);
      expect(await resolveVerifiedCentralIdentity(principal,store)).toBeNull();
    }
  });

  it("refuses missing or unknown membership role while preserving trusted local roles", async () => {
    for (const membership of [null,{role:"REVOKED"},{role:"ADMIN"}]) {
      const {state,store}=fixture();state.membership=membership;
      expect(await resolveVerifiedCentralIdentity(principal,store)).toBeNull();
    }
    for (const role of ["OWNER","MANAGER","ASSESSOR","LEARNER"]) {
      const {state,store}=fixture();state.membership={role};
      expect((await resolveVerifiedCentralIdentity(principal,store))?.memberRole).toBe(role);
    }
  });
});
