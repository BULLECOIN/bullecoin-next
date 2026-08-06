import { NextRequest,NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { loginMessage,nonce } from "@/lib/runnerAuth";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){try{const {wallet}=await req.json();if(typeof wallet!=="string"||wallet.length<32||wallet.length>50)return NextResponse.json({error:"Invalid wallet"},{status:400});const n=nonce(),issued=new Date().toISOString(),message=loginMessage(wallet,n,issued);const db=getSupabaseAdmin();const {error}=await db.from("runner_nonces").insert({wallet,nonce:n,message,expires_at:new Date(Date.now()+300000).toISOString()});if(error)throw error;return NextResponse.json({nonce:n,message});}catch(e){console.error(e);return NextResponse.json({error:"Unable to create challenge"},{status:500});}}
