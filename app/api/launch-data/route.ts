import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  txns?: { h24?: { buys?: number; sells?: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
};

function numberFromEnv(name: string) {
  const value = Number(process.env[name] ?? "0");
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function GET() {
  const tokenAddress = (
    process.env.BULLE_TOKEN_ADDRESS ??
    process.env.NEXT_PUBLIC_BULLE_TOKEN_ADDRESS ??
    ""
  ).trim();
  const treasuryWallet = (
    process.env.BULLE_TREASURY_WALLET ??
    process.env.NEXT_PUBLIC_BULLE_TREASURY_WALLET ??
    ""
  ).trim();
  const pumpUrl = (process.env.NEXT_PUBLIC_BULLE_PUMP_URL ?? "").trim();
  const creatorFeesSol = numberFromEnv("BULLE_CREATOR_FEES_SOL");
  const distributedSol = numberFromEnv("BULLE_DISTRIBUTED_SOL");
  const rewardPoolSol = creatorFeesSol * 0.3;

  const base = {
    status: tokenAddress ? "market_syncing" : "awaiting_token",
    tokenAddress,
    treasuryWallet,
    pumpUrl,
    priceUsd: null as number | null,
    priceChange24h: null as number | null,
    marketCapUsd: null as number | null,
    fdvUsd: null as number | null,
    liquidityUsd: null as number | null,
    volume24hUsd: null as number | null,
    buys24h: null as number | null,
    sells24h: null as number | null,
    pairUrl: null as string | null,
    creatorFeesSol,
    rewardPoolSol,
    distributedSol,
    updatedAt: new Date().toISOString(),
    source: tokenAddress
      ? "DEX Screener + verified project records"
      : "Waiting for official token configuration",
  };

  if (!tokenAddress) {
    return NextResponse.json(base, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const response = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${encodeURIComponent(tokenAddress)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(base, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const pairs = (await response.json()) as DexPair[];
    const validPairs = Array.isArray(pairs) ? pairs : [];
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
      return NextResponse.json(base, {
        headers: { "Cache-Control": "no-store" },
      });
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
