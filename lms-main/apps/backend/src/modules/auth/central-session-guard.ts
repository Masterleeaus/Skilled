/**
 * Separate Central-authenticated identity boundary. Existing local JWT middleware
 * is unchanged. Central cookies are never accepted as JWT bearer credentials.
 */
import type { Request,Response,NextFunction } from "express";
import { parseCentralSessionCookie } from "./central-session-cookie";
import type { SessionIdentity } from "./central-session-store";
export type CurrentSession = (token:string)=>Promise<SessionIdentity|null>;
export function centralSessionGuard(authenticate:CurrentSession){
  if(typeof authenticate!=="function")throw new TypeError("Session authentication dependency missing");
  return async(req:Request,res:Response,next:NextFunction)=>{
    try{
      const token=parseCentralSessionCookie(req.headers.cookie);
      if(!token){res.status(401).set("Cache-Control","no-store").json({error:"unauthenticated"});return;}
      const identity=await authenticate(token);
      if(!identity){res.status(401).set("Cache-Control","no-store").json({error:"unauthenticated"});return;}
      res.locals.skilledCentralIdentity=identity;
      next();
    }catch(nextError){next(nextError);}
  };
}
