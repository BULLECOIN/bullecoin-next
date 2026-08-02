import crypto from "node:crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
export const nonce=()=>crypto.randomBytes(24).toString("hex");
export const token=()=>crypto.randomBytes(32).toString("hex");
export const hash=(v:string)=>crypto.createHash("sha256").update(v).digest("hex");
export function loginMessage(wallet:string,n:string,issued:string){return ["BULLE Bull Runner","Sign this free message to verify your wallet.","This does not authorize a transaction or payment.","",`Wallet: ${wallet}`,`Nonce: ${n}`,`Issued At: ${issued}`,"Domain: bullecoin.io"].join("\n");}
export function verify(wallet:string,message:string,signature:string){try{return nacl.sign.detached.verify(new TextEncoder().encode(message),bs58.decode(signature),bs58.decode(wallet));}catch{return false;}}
export function weekStart(){const d=new Date(),day=d.getUTCDay(),diff=day===0?6:day-1;d.setUTCDate(d.getUTCDate()-diff);d.setUTCHours(0,0,0,0);return d.toISOString();}
