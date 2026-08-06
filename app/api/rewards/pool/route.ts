import {NextResponse} from "next/server";
import {readRewardPool} from "@/lib/rewardPool";
export const dynamic="force-dynamic";
export async function GET(){try{return NextResponse.json(await readRewardPool(),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error("reward pool",error);return NextResponse.json({error:"Reward pool temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}}
