import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DexPair = {
  url?: string;
  priceUsd?: string | null;
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number | null;
  marketCap?: number | null;
};

type SupplyResponse = {
  result?: { value?: { uiAmount?: number | null; uiAmountString?: string } };
};

function getBestPair(pairs: DexPair[]) {
  return [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
}

export async function GET() {
  const mintAddress = process.env.BULLE_TOKEN_MINT;
  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

  if (!mintAddress) {
    return NextResponse.json({
      launched: false,
      priceUsd: null,
      marketCap: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      supply: null,
      dexUrl: null,
      updatedAt: new Date().toISOString(),
      message: "The official BULLE contract has not been configured. Live data will activate after launch.",
    });
  }

  try {
    const [dexResponse, supplyResponse] = await Promise.all([
      fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${mintAddress}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      }),
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenSupply",
          params: [mintAddress],
        }),
        cache: "no-store",
      }),
    ]);

    const pairs = dexResponse.ok ? ((await dexResponse.json()) as DexPair[]) : [];
    const supplyJson = supplyResponse.ok ? ((await supplyResponse.json()) as SupplyResponse) : null;
    const pair = getBestPair(pairs);
    const supplyString = supplyJson?.result?.value?.uiAmountString;
    const supply = supplyString !== undefined
      ? Number(supplyString)
      : (supplyJson?.result?.value?.uiAmount ?? null);

    if (!pair) {
      return NextResponse.json({
        launched: true,
        priceUsd: null,
        marketCap: null,
        liquidityUsd: null,
        volume24h: null,
        priceChange24h: null,
        supply: Number.isFinite(supply) ? supply : null,
        dexUrl: null,
        updatedAt: new Date().toISOString(),
        message: "The contract is configured, but no active DEX pool has been detected yet.",
      });
    }

    return NextResponse.json({
      launched: true,
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      marketCap: pair.marketCap ?? pair.fdv ?? null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      volume24h: pair.volume?.h24 ?? null,
      priceChange24h: pair.priceChange?.h24 ?? null,
      supply: Number.isFinite(supply) ? supply : null,
      dexUrl: pair.url ?? null,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      launched: Boolean(mintAddress),
      priceUsd: null,
      marketCap: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      supply: null,
      dexUrl: null,
      updatedAt: new Date().toISOString(),
      message: "Live market data is temporarily unavailable.",
    }, { status: 503 });
  }
}
