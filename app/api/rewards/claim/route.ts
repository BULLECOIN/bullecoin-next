import {NextRequest,NextResponse} from "next/server";
import {PublicKey} from "@solana/web3.js";
import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
import {verify} from "@/lib/runnerAuth";
import {DAILY_USD_LIMIT,readRewardPool,RP_PER_USD} from "@/lib/rewardPool";
import {sendBulleReward} from "@/lib/rewardPayout";

export async function POST(req:NextRequest){try{
 const b=await req.json(),wallet=String(b.wallet||""),username=String(b.username||"").trim(),nonce=String(b.nonce||""),message=String(b.message||""),signature=String(b.signature||"");
 try{new PublicKey(wallet)}catch{return NextResponse.json({error:"Invalid wallet"},{status:400})}
 if(!/^[A-Za-z0-9_]{3,16}$/.test(username))return NextResponse.json({error:"Invalid username"},{status:400});
 const availableRp=Math.floor(Number(b.rewardPoints));if(!Number.isFinite(availableRp)||availableRp<1000)return NextResponse.json({error:"A minimum of 1,000 RP is required"},{status:400});
 const db=getSupabaseAdmin(),{data:challenge}=await db.from("runner_nonces").select("*").eq("wallet",wallet).eq("nonce",nonce).maybeSingle();
 if(!challenge||challenge.used_at||challenge.message!==message||new Date(challenge.expires_at).getTime()<Date.now()||!verify(wallet,message,signature))return NextResponse.json({error:"Wallet verification failed"},{status:401});
 const today=new Date().toISOString().slice(0,10),{data:existing}=await db.from("reward_claims").select("id,status").eq("wallet",wallet).eq("claim_date",today).maybeSingle();
 if(existing)return NextResponse.json({error:`A ${existing.status} request already exists today`,claimId:existing.id},{status:409});
 const pool=await readRewardPool();if(!pool.payoutEnabled)return NextResponse.json({error:"Automatic rewards are temporarily paused"},{status:503});if(!pool.payerFunded||pool.priceUsd<=0)return NextResponse.json({error:"Automatic payout wallet or token price is not available"},{status:503});
 const claimedRp=Math.min(availableRp,DAILY_USD_LIMIT*RP_PER_USD),requestedUsd=claimedRp/RP_PER_USD,requestedBulle=requestedUsd/pool.priceUsd;
 if(pool.payerBalanceBulle<requestedBulle)return NextResponse.json({error:"Automatic payout wallet balance is insufficient"},{status:503});
 const globalLimit=Math.max(2,Number(process.env.REWARD_GLOBAL_DAILY_USD_LIMIT||20)),{data:dailyRows}=await db.from("reward_claims").select("requested_usd").eq("claim_date",today).in("status",["processing","paid"]),dailyTotal=(dailyRows||[]).reduce((sum,row)=>sum+Number(row.requested_usd||0),0);if(dailyTotal+requestedUsd>globalLimit)return NextResponse.json({error:"The automatic daily reward budget has been reached"},{status:429});
 await db.from("runner_nonces").update({used_at:new Date().toISOString()}).eq("id",challenge.id);
 const {data,error}=await db.from("reward_claims").insert({wallet,username,reward_points:claimedRp,reported_reward_points:availableRp,requested_usd:requestedUsd,requested_bulle:requestedBulle,price_usd:pool.priceUsd,pool_wallet:pool.payerWallet,total_points:Math.max(0,Math.floor(Number(b.totalPoints)||0)),story_games:Math.max(0,Math.floor(Number(b.storyGames)||0)),story_best:Math.max(0,Math.floor(Number(b.storyBest)||0)),status:"processing",claim_date:today}).select("id,status").single();
 if(error)throw error;
 try{const txSignature=await sendBulleReward(wallet,requestedBulle),paidAt=new Date().toISOString(),{error:updateError}=await db.from("reward_claims").update({status:"paid",tx_signature:txSignature,reviewed_at:paidAt,paid_at:paidAt}).eq("id",data.id);if(updateError)console.error("Reward paid but database update failed",data.id,txSignature,updateError);return NextResponse.json({claimId:data.id,status:"paid",rewardPoints:claimedRp,requestedUsd,requestedBulle,txSignature,notice:"BULLE reward confirmed on Solana."})}catch(payoutError){console.error("Automatic payout failed",data.id,payoutError);await db.from("reward_claims").update({status:"failed",notes:payoutError instanceof Error?payoutError.message:"Automatic payout failed",reviewed_at:new Date().toISOString()}).eq("id",data.id);return NextResponse.json({error:"Automatic payout could not be confirmed. The request was stopped for review.",claimId:data.id},{status:503})}
 }catch(error){console.error("reward claim",error);return NextResponse.json({error:"Unable to create reward request"},{status:500})}}
