import {Connection,Keypair,PublicKey,SystemProgram,Transaction,TransactionInstruction} from "@solana/web3.js";
import bs58 from "bs58";
import {BULLE_MINT,REWARD_PAYER} from "./rewardPool";

const TOKEN_PROGRAM=new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM=new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA_PROGRAM=new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function readPayer(){
 const raw=process.env.REWARD_PAYER_SECRET_KEY?.trim();if(!raw)throw new Error("Automatic payout signer is not configured");
 let bytes:Uint8Array;try{bytes=raw.startsWith("[")?Uint8Array.from(JSON.parse(raw)):bs58.decode(raw)}catch{throw new Error("Invalid payout signer format")}
 const payer=bytes.length===32?Keypair.fromSeed(bytes):Keypair.fromSecretKey(bytes);if(payer.publicKey.toBase58()!==REWARD_PAYER)throw new Error("Payout signer does not match configured public wallet");return payer;
}
function ata(owner:PublicKey,mint:PublicKey,tokenProgram:PublicKey){return PublicKey.findProgramAddressSync([owner.toBuffer(),tokenProgram.toBuffer(),mint.toBuffer()],ATA_PROGRAM)[0]}
function createAta(payer:PublicKey,address:PublicKey,owner:PublicKey,mint:PublicKey,tokenProgram:PublicKey){return new TransactionInstruction({programId:ATA_PROGRAM,keys:[{pubkey:payer,isSigner:true,isWritable:true},{pubkey:address,isSigner:false,isWritable:true},{pubkey:owner,isSigner:false,isWritable:false},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:SystemProgram.programId,isSigner:false,isWritable:false},{pubkey:tokenProgram,isSigner:false,isWritable:false}],data:Buffer.alloc(0)})}
function transferChecked(source:PublicKey,mint:PublicKey,destination:PublicKey,owner:PublicKey,amount:bigint,decimals:number,tokenProgram:PublicKey){const data=Buffer.alloc(10);data.writeUInt8(12,0);data.writeBigUInt64LE(amount,1);data.writeUInt8(decimals,9);return new TransactionInstruction({programId:tokenProgram,keys:[{pubkey:source,isSigner:false,isWritable:true},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:destination,isSigner:false,isWritable:true},{pubkey:owner,isSigner:true,isWritable:false}],data})}

export async function sendBulleReward(recipientAddress:string,uiAmount:number){
 const rpc=process.env.SOLANA_RPC_URL?.trim();if(!rpc)throw new Error("SOLANA_RPC_URL is required for automatic payouts");
 const connection=new Connection(rpc,"confirmed"),payer=readPayer(),recipient=new PublicKey(recipientAddress),mint=new PublicKey(BULLE_MINT),mintInfo=await connection.getAccountInfo(mint,"confirmed");
 if(!mintInfo||(!mintInfo.owner.equals(TOKEN_PROGRAM)&&!mintInfo.owner.equals(TOKEN_2022_PROGRAM))||mintInfo.data.length<45)throw new Error("Unsupported or invalid BULLE mint");
 const tokenProgram=mintInfo.owner,source=ata(payer.publicKey,mint,tokenProgram),destination=ata(recipient,mint,tokenProgram);
 const decimals=mintInfo.data[44],rawAmount=BigInt(Math.floor(uiAmount*10**decimals));if(rawAmount<=BigInt(0))throw new Error("Reward amount is too small");
 if(!await connection.getAccountInfo(source,"confirmed"))throw new Error("Payout wallet has no BULLE token account");
 const transaction=new Transaction();if(!await connection.getAccountInfo(destination,"confirmed"))transaction.add(createAta(payer.publicKey,destination,recipient,mint,tokenProgram));transaction.add(transferChecked(source,mint,destination,payer.publicKey,rawAmount,decimals,tokenProgram));
 const latest=await connection.getLatestBlockhash("confirmed");transaction.feePayer=payer.publicKey;transaction.recentBlockhash=latest.blockhash;transaction.sign(payer);const signature=await connection.sendRawTransaction(transaction.serialize(),{skipPreflight:false,preflightCommitment:"confirmed",maxRetries:3}),confirmation=await connection.confirmTransaction({signature,...latest},"confirmed");if(confirmation.value.err)throw new Error(`Payout transaction failed: ${JSON.stringify(confirmation.value.err)}`);return signature;
}
