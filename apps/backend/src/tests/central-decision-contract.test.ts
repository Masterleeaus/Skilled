// Contract tests for the Skilled client of Central's service-decision endpoint (Central PR #68, Pass 18 contract).
import {describe,it,expect,vi} from "vitest";
import {
  createAuthenticatedCentralDecisionClient,createCentralOrganisationRegistry,loadCentralDecisionClientConfig,
  CENTRAL_DECISION_PATH,
} from "../modules/auth/central-decision-transport";
import {harness,principal,envelope,json,decision,logtoOrganisationId,centralOrganisationId,requestId} from "./central-decision-transport.fixture";

const credential="server-credential-".repeat(4);
const resolver=createCentralOrganisationRegistry([{logtoOrganisationId,centralOrganisationId}]);

describe("Central service-decision request", () => {
  it("sends exactly the contract fields, with the Central internal organisation UUID and no browser-supplied claims", async () => {
    const h=harness();
    await h.make()(principal);
    const [uri,init]=h.fetcher.mock.calls[0] as [string,RequestInit];
    expect(uri).toBe(`https://central.example.test${CENTRAL_DECISION_PATH}`);
    const body=JSON.parse(String(init.body));
    expect(Object.keys(body).sort()).toEqual(["applicationId","issuer","organisationId","requestId","subject"]);
    expect(body).toEqual({applicationId:"academy",issuer:principal.issuer,subject:principal.subject,organisationId:centralOrganisationId,requestId});
    expect(body.organisationId).not.toBe(logtoOrganisationId);
    expect(JSON.stringify(body)).not.toContain(credential);
  });

  it("fails closed without any network call when the organisation is not in the operator registry", async () => {
    const fetcher=vi.fn(async()=>json(envelope()));
    const client=createAuthenticatedCentralDecisionClient({
      endpoint:`https://central.example.test${CENTRAL_DECISION_PATH}`,bearerToken:credential,
      expectedIssuer:principal.issuer,expectedAudience:principal.audience,
      resolveCentralOrganisationId:createCentralOrganisationRegistry([]),fetcher:fetcher as typeof fetch,
    });
    expect(await client(principal,logtoOrganisationId)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("Central service-decision response", () => {
  it.each([400,401,403,503])("refuses HTTP %i", async(status)=>{
    const h=harness();
    h.fetcher.mockResolvedValueOnce(json({error:"x"},status));
    expect(await h.make()(principal)).toBeNull();
  });

  it("refuses a denied decision (allowed=false) and a rejected tenant", async()=>{
    const h=harness();
    h.fetcher.mockResolvedValueOnce(json({...envelope(),decision:{...decision,allowed:false}}));
    expect(await h.make()(principal)).toBeNull();
    // The decision is for another organisation than the one that was asked about.
    h.fetcher.mockResolvedValueOnce(json({...envelope(),decision:{...decision,organisationId:"logto-org-other"}}));
    expect(await h.make()(principal)).toBeNull();
  });

  it("refuses a response whose requestId does not match the request", async()=>{
    const h=harness();
    h.fetcher.mockResolvedValueOnce(json({...envelope(),requestId:"Q".repeat(32)}));
    expect(await h.make()(principal)).toBeNull();
  });

  it("refuses a redirected response", async()=>{
    const h=harness();
    const response=json(envelope());
    Object.defineProperty(response,"redirected",{value:true});
    h.fetcher.mockResolvedValueOnce(response);
    expect(await h.make()(principal)).toBeNull();
  });

  it("refuses a non-JSON content type", async()=>{
    const h=harness();
    h.fetcher.mockResolvedValueOnce(json(envelope(),200,{"content-type":"text/html"}));
    expect(await h.make()(principal)).toBeNull();
  });

  it("returns the decision only when it matches the contract shape", async()=>{
    const h=harness();
    h.fetcher.mockResolvedValueOnce(json({...envelope(),decision:{...decision,extra:"x"}}));
    expect(await h.make()(principal)).toBeNull();
    h.fetcher.mockResolvedValueOnce(json({...envelope(),decision:{...decision,membershipRevision:-1}}));
    expect(await h.make()(principal)).toBeNull();
    h.fetcher.mockResolvedValueOnce(json(envelope()));
    expect(await h.make()(principal)).toEqual({issuer:principal.issuer,subject:principal.subject,decision});
  });
});

describe("Central service-decision configuration", () => {
  const deps={expectedIssuer:principal.issuer,expectedAudience:principal.audience,resolveCentralOrganisationId:resolver};

  it("stays unmounted when the server-held credential is absent", ()=>{
    expect(loadCentralDecisionClientConfig({},deps)).toBeNull();
    expect(loadCentralDecisionClientConfig({TITAN_SKILLED_DECISION_BEARER:""},deps)).toBeNull();
  });

  it("requires an endpoint once the credential is set, and refuses a short credential", ()=>{
    expect(()=>loadCentralDecisionClientConfig({TITAN_SKILLED_DECISION_BEARER:credential},deps)).toThrow(TypeError);
    expect(()=>loadCentralDecisionClientConfig({
      TITAN_SKILLED_DECISION_BEARER:"too-short",TITAN_SKILLED_DECISION_ENDPOINT:`https://central.example.test${CENTRAL_DECISION_PATH}`,
    },deps)).toThrow(TypeError);
  });

  it("builds a client from configuration only", async()=>{
    // The client generates its own requestId, so the fake echoes the one it was sent.
    const fetcher=vi.fn(async(_url:RequestInfo|URL,init?:RequestInit)=>json({...envelope(),requestId:JSON.parse(String(init?.body)).requestId}));
    const client=loadCentralDecisionClientConfig({
      TITAN_SKILLED_DECISION_BEARER:credential,
      TITAN_SKILLED_DECISION_ENDPOINT:`https://central.example.test${CENTRAL_DECISION_PATH}`,
    },{...deps,fetcher:fetcher as typeof fetch});
    expect(client).not.toBeNull();
    expect(await client!(principal,logtoOrganisationId)).toEqual({issuer:principal.issuer,subject:principal.subject,decision});
    const init=fetcher.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string,string>).authorization).toBe("Bearer "+credential);
  });

  it("refuses an endpoint on any path other than the contract path, or over plain http", ()=>{
    const base={expectedIssuer:principal.issuer,expectedAudience:principal.audience,bearerToken:credential,resolveCentralOrganisationId:resolver};
    expect(()=>createAuthenticatedCentralDecisionClient({...base,endpoint:"https://central.example.test/internal/academy/access-decision"})).toThrow(TypeError);
    expect(()=>createAuthenticatedCentralDecisionClient({...base,endpoint:`http://central.example.test${CENTRAL_DECISION_PATH}`})).toThrow(TypeError);
  });
});

describe("Central organisation registry", () => {
  it("is one-to-one and rejects malformed entries", ()=>{
    expect(()=>createCentralOrganisationRegistry([
      {logtoOrganisationId,centralOrganisationId},{logtoOrganisationId,centralOrganisationId:"00000000-0000-4000-8000-000000000002"},
    ])).toThrow(TypeError);
    expect(()=>createCentralOrganisationRegistry([{logtoOrganisationId,centralOrganisationId:"not-a-uuid"}])).toThrow(TypeError);
    expect(()=>createCentralOrganisationRegistry([{logtoOrganisationId:"ab cd",centralOrganisationId}])).toThrow(TypeError);
  });

  it("returns null for an unmapped organisation", ()=>{
    expect(resolver("logto-org-unknown")).toBeNull();
    expect(resolver(logtoOrganisationId)).toBe(centralOrganisationId);
  });
});

it("uses a request ID that meets the contract length", ()=>{
  expect(requestId.length).toBeGreaterThanOrEqual(32);
});
