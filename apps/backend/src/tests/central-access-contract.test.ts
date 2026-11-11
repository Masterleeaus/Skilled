import { describe, expect, it } from "vitest";
import { parseCentralAccessDecision } from "../modules/auth/central-access-contract";
import type { CentralSessionBinding } from "../modules/auth/central-session-revalidation";

const session: CentralSessionBinding = {
  subject: "user-sub-1",
  issuer: "https://identity.example.test",
  audience: "urn:titan-central:product:lms",
  organisationRef: "org-1",
  localUserId: "learner-1",
  companyId: "company-1",
  memberRole: "LEARNER",
  centralMembershipRevision: 10,
  centralLinkRevision: 4,
};

const approved = {
  allowed: true,
  subject: session.subject,
  issuer: session.issuer,
  audience: session.audience,
  organisationRef: session.organisationRef,
  localUserId: session.localUserId,
  companyId: session.companyId,
  memberRole: session.memberRole,
  membershipRevision: session.centralMembershipRevision,
  linkRevision: session.centralLinkRevision,
};

describe("Central access-decision response compatibility", () => {
  it("explicitly rejects the real current /v1/access/check allow shape", () => {
    expect(parseCentralAccessDecision({allowed:true,role:"learner",reason:"allowed"},session))
      .toEqual({accepted:false,reason:"unsupported_response"});
  });

  it("rejects the real current /v1/access/check denial shape", () => {
    expect(parseCentralAccessDecision({allowed:false,role:null,reason:"membership_inactive"},session))
      .toEqual({accepted:false,reason:"unsupported_response"});
  });

  it("accepts a complete future trusted-transport response with matching identity and revisions", () => {
    const result=parseCentralAccessDecision(approved,session);
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(result.decision).toEqual({...approved,authorised:true});
  });

  it("rejects absent/malformed response without implicit access", () => {
    for(const input of [null,undefined,[],0,"true",{}, {allowed:true}]) {
      expect(parseCentralAccessDecision(input,session).accepted).toBe(false);
    }
  });

  it("rejects extra response fields to force review of contract version changes", () => {
    expect(parseCentralAccessDecision({...approved,token:"secret"},session))
      .toEqual({accepted:false,reason:"unsupported_response"});
    const {companyId: _companyId,...noCompany}=approved;
    expect(parseCentralAccessDecision(noCompany,session))
      .toEqual({accepted:false,reason:"unsupported_response"});
  });

  it("rejects cross-product, other issuer, swapped subject, foreign organisation or local account", () => {
    for(const difference of [
      {subject:"stranger"}, {issuer:"https://other.example.test"},
      {audience:"urn:titan-central:product:sorted"}, {organisationRef:"org-2"},
      {companyId:"company-2"}, {localUserId:"learner-2"}, {memberRole:"OWNER"},
    ]) {
      expect(parseCentralAccessDecision({...approved,...difference},session))
        .toEqual({accepted:false,reason:"identity_mismatch"});
    }
  });

  it("rejects membership and identity-link revisions after revocation/relink", () => {
    for(const difference of [{membershipRevision:11},{linkRevision:5}]) {
      expect(parseCentralAccessDecision({...approved,...difference},session))
        .toEqual({accepted:false,reason:"revoked_or_changed"});
    }
  });

  it("rejects invalid revision values and stale or malformed identifiers", () => {
    for(const difference of [
      {membershipRevision:-1}, {membershipRevision:1.5}, {linkRevision:NaN},
      {linkRevision:"4"}, {localUserId:"../../outside"}, {issuer:"http://wrong.test"},
    ]) {
      expect(parseCentralAccessDecision({...approved,...difference},session))
        .toEqual({accepted:false,reason:"unsupported_response"});
    }
  });
});
