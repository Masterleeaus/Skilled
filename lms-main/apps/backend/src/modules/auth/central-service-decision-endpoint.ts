/** Exact, fixed service endpoint; never derived from user input or forwarded Host. */
export const CENTRAL_SKILLED_DECISION_PATH="/v1/integrations/academy/decision";
export function centralSkilledDecisionEndpoint(origin:unknown):string{
 if(typeof origin!=="string")throw TypeError("Trusted Central service origin required");
 const url=new URL(origin);
 if(url.protocol!=="https:"||url.origin!==origin||url.username||url.password||url.hash||url.search)
  throw TypeError("Central service requires one exact HTTPS origin");
 return origin+CENTRAL_SKILLED_DECISION_PATH;
}
