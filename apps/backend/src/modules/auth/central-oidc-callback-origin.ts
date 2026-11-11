/** Reject callback requests with unsolicited Origin: GET provider redirect carries no Origin. */
export function allowOidcCallbackHeaders(headers:Record<string,string|string[]|undefined>):boolean{
 const origin=headers.origin;
 if(origin!==undefined)return false; // Cross-site scripts/forms must never invoke callback with Origin.
 const fetch=headers["sec-fetch-site"];
 if(fetch!==undefined&&fetch!=="cross-site"&&fetch!=="same-site"&&fetch!=="none")return false;
 const mode=headers["sec-fetch-mode"];
 if(mode!==undefined&&mode!=="navigate")return false;
 const dest=headers["sec-fetch-dest"];
 if(dest!==undefined&&dest!=="document")return false;
 return true;
}
