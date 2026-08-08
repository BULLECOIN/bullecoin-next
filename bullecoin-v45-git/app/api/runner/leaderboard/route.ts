import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { weekStart } from "@/lib/runnerAuth";
export const dynamic="force-dynamic";
export async function GET(){try{const db=getSupabaseAdmin(),week=weekStart();const {data,error}=await db.from("runner_scores").select("wallet,nickname,best_score,updated_at").eq("week_start",week).order("best_score",{ascending:false}).limit(100);if(error)throw error;return NextResponse.json({weekStart:week,leaderboard:data||[],updatedAt:new Date().toISOString()});}catch(e){console.error(e);return NextResponse.json({error:"Unable to load leaderboard"},{status:500});}}
