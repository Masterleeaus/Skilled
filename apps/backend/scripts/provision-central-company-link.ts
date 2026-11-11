/** Offline operator CLI. Authenticated shell/operator access required.
 * Reads one JSON command from stdin; never invoked from a browser endpoint.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { applyCentralLinkCommand } from "../src/modules/auth/central-company-link-provisioning";

async function main(){
  if(process.stdin.isTTY)throw new Error("Expected one JSON command on stdin");
  let input="";
  for await(const part of process.stdin){
    input+=part.toString();
    if(input.length>4096)throw new Error("Input too large");
  }
  const db=new PrismaClient();
  try{
    const result=await applyCentralLinkCommand(JSON.parse(input),db);
    console.log(JSON.stringify({outcome:result}));
  }finally{await db.$disconnect();}
}
main().catch(error=>{
  console.error(error instanceof Error?error.message:"Mapping unavailable");
  process.exitCode=1;
});
