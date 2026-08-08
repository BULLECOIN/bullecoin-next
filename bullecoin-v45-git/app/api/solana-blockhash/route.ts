import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash", params: [{ commitment: "confirmed" }] }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`RPC ${response.status}`);
    const payload = await response.json() as { result?: { value?: { blockhash?: string } }; error?: { message?: string } };
    const blockhash = payload.result?.value?.blockhash;
    if (!blockhash) throw new Error(payload.error?.message || "Blockhash unavailable");
    return NextResponse.json({ blockhash });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "RPC unavailable" }, { status: 503 });
  }
}
