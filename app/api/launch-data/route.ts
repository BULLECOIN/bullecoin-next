import { NextResponse } from "next/server";
import { SERVER_BULLE_MIGRATION_STATUS, SERVER_BULLE_MINT } from "../../../lib/serverBulleConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const officialTreasuryWallet = "5Azx3Gby54UMrATmrUYGSa58evLKhgUgdmHuKAfFyqvg";
const wrappedSol = "So11111111111111111111111111111111111111112";

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  quoteToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string;
  priceNative?: string;
  txns?: {
    h24?: { buys?: number; sells?: number };
  };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
};

function numberFromEnv(name: string) {
  const value = Number(process.env[name] ?? "0");
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function GET() {
  const tokenAddress = SERVER_BULLE_MIGRATION_STATUS === "prelaunch" ? "" : SERVER_BULLE_MINT;
  const pumpUrl = process.env.NEXT_PUBLIC_BULLE_PUMP_URL?.trim() ?? "";
  const creatorFeesSol = numberFromEnv("BULLE_CREATOR_FEES_SOL");
  const distributedSol = numberFromEnv("BULLE_DISTRIBUTED_SOL");
  const rewardPoolSol = creatorFeesSol * 0.3;
  const treasuryWallet = process.env.BULLE_TREASURY_WALLET?.trim() || officialTreasuryWallet;
  const rpcUrl = process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";

  const base = {
    status: tokenAddress ? "searching" : "awaiting_launch",
    tokenAddress,
    pumpUrl,
    priceUsd: null as number | null,
    priceChange24h: null as number | null,
    marketCapUsd: null as number | null,
    fdvUsd: null as number | null,
    liquidityUsd: null as number | null,
    volume24hUsd: null as number | null,
    buys24h: null as number | null,
    sells24h: null as number | null,
    holders: null as number | null,
    pairUrl: null as string | null,
    pairAddress: null as string | null,
    dexId: null as string | null,
    creatorFeesSol,
    rewardPoolSol,
    treasuryWallet,
    treasurySol: null as number | null,
    treasuryBulle: null as number | null,
    treasuryValueUsd: null as number | null,
    distributedSol,
    updatedAt: new Date().toISOString(),
    source: tokenAddress ? "DEX Screener + verified manual fee totals" : "Pre-launch configuration",
  };

  if (!tokenAddress) {
    return NextResponse.json(base, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const [response, treasuryResponse, solPriceResponse, tokenAccountsResponse] = await Promise.all([fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(tokenAddress)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    ), fetch(rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [treasuryWallet] }), cache: "no-store" }), fetch(`https://api.dexscreener.com/tokens/v1/solana/${wrappedSol}`, { headers: { Accept: "application/json" }, cache: "no-store" }), fetch(rpcUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "getTokenAccountsByOwner", params: [treasuryWallet, { mint: tokenAddress }, { encoding: "jsonParsed" }] }), cache: "no-store" })]);

    if (!response.ok) {
      return NextResponse.json(
        { ...base, status: "data_pending" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const pairs = (await response.json()) as DexPair[];
    const validPairs = Array.isArray(pairs) ? pairs : [];
    let treasurySol: number | null = null;
    let treasuryBulle: number | null = null;
    let solPriceUsd: number | null = null;
    try { const walletJson = await treasuryResponse.json() as { result?: { value?: number } }; treasurySol = typeof walletJson.result?.value === "number" ? walletJson.result.value / 1_000_000_000 : null; } catch {}
    try { const solPairs = await solPriceResponse.json() as DexPair[]; const solPair = (Array.isArray(solPairs) ? solPairs : []).filter(pair => pair.baseToken?.address === wrappedSol && ["USDC", "USDT"].includes(pair.quoteToken?.symbol || "")).sort((a,b)=>(b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0]; solPriceUsd = Number(solPair?.priceUsd || 0) || null; } catch {}
    try { const tokenJson = await tokenAccountsResponse.json() as { result?: { value?: Array<{ account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } } } }> } }; treasuryBulle = (tokenJson.result?.value || []).reduce((sum,item)=>sum+(item.account?.data?.parsed?.info?.tokenAmount?.uiAmount||0),0); } catch {}

    const bestPair = validPairs
      .filter(
        (pair) =>
          pair.chainId === "solana" &&
          pair.baseToken?.address === tokenAddress,
      )
      .sort(
        (a, b) =>
          (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
      )[0];

    if (!bestPair) {
      return NextResponse.json(
        { ...base, status: "pair_pending" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        ...base,
        status: "live",
        priceUsd: Number(bestPair.priceUsd ?? 0) || null,
        priceChange24h:
          typeof bestPair.priceChange?.h24 === "number"
            ? bestPair.priceChange.h24
            : null,
        marketCapUsd:
          typeof bestPair.marketCap === "number"
            ? bestPair.marketCap
            : null,
        fdvUsd:
          typeof bestPair.fdv === "number" ? bestPair.fdv : null,
        liquidityUsd:
          typeof bestPair.liquidity?.usd === "number"
            ? bestPair.liquidity.usd
            : null,
        volume24hUsd:
          typeof bestPair.volume?.h24 === "number"
            ? bestPair.volume.h24
            : null,
        buys24h:
          typeof bestPair.txns?.h24?.buys === "number"
            ? bestPair.txns.h24.buys
            : null,
        sells24h:
          typeof bestPair.txns?.h24?.sells === "number"
            ? bestPair.txns.h24.sells
            : null,
        pairUrl: bestPair.url ?? null,
        pairAddress: bestPair.pairAddress ?? null,
        dexId: bestPair.dexId ?? null,
        treasurySol,
        treasuryBulle,
        treasuryValueUsd: (treasurySol !== null && solPriceUsd !== null ? treasurySol * solPriceUsd : 0) + (treasuryBulle !== null ? (Number(bestPair.priceUsd ?? 0) || 0) * treasuryBulle : 0),
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("launch-data error", error);

    return NextResponse.json(
      { ...base, status: "temporarily_unavailable" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
