import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BoostEntry = {
  chainId?: string;
  tokenAddress?: string;
};

type TokenProfile = {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
};

type DexPair = {
  chainId?: string;
  url?: string;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string | null;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  info?: {
    imageUrl?: string;
  };
};

type BullHubToken = {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  dexUrl: string | null;
  boosted: boolean;
};

function selectBestPair(pairs: DexPair[], address: string) {
  return pairs
    .filter(
      (pair) =>
        pair.chainId === "solana" &&
        pair.baseToken?.address?.toLowerCase() === address.toLowerCase(),
    )
    .sort(
      (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
    )[0];
}

export async function GET() {
  try {
    const [boostResponse, profileResponse] = await Promise.all([
      fetch("https://api.dexscreener.com/token-boosts/top/v1", {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }),
      fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      }),
    ]);

    const boosts = boostResponse.ok
      ? ((await boostResponse.json()) as BoostEntry[])
      : [];

    const profiles = profileResponse.ok
      ? ((await profileResponse.json()) as TokenProfile[])
      : [];

    const boostedAddresses = boosts
      .filter(
        (entry) =>
          entry.chainId === "solana" && Boolean(entry.tokenAddress),
      )
      .map((entry) => entry.tokenAddress as string);

    const profileMap = new Map(
      profiles
        .filter(
          (profile) =>
            profile.chainId === "solana" && Boolean(profile.tokenAddress),
        )
        .map((profile) => [
          (profile.tokenAddress as string).toLowerCase(),
          profile,
        ]),
    );

    const addresses = [...new Set(boostedAddresses)].slice(0, 12);

    const tokenResults = await Promise.all(
      addresses.map(async (address): Promise<BullHubToken | null> => {
        try {
          const response = await fetch(
            `https://api.dexscreener.com/token-pairs/v1/solana/${address}`,
            {
              headers: { Accept: "application/json" },
              next: { revalidate: 60 },
            },
          );

          if (!response.ok) return null;

          const pairs = (await response.json()) as DexPair[];
          const pair = selectBestPair(pairs, address);
          if (!pair?.baseToken) return null;

          const profile = profileMap.get(address.toLowerCase());

          return {
            name: pair.baseToken.name ?? "Unknown token",
            symbol: pair.baseToken.symbol ?? "—",
            address,
            imageUrl:
              pair.info?.imageUrl ??
              profile?.icon ??
              null,
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
            liquidityUsd: pair.liquidity?.usd ?? null,
            volume24h: pair.volume?.h24 ?? null,
            priceChange24h: pair.priceChange?.h24 ?? null,
            dexUrl: pair.url ?? null,
            boosted: true,
          };
        } catch {
          return null;
        }
      }),
    );

    const tokens = tokenResults
      .filter((token): token is BullHubToken => token !== null)
      .sort(
        (a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0),
      );

    return NextResponse.json({
      tokens,
      updatedAt: new Date().toISOString(),
      message:
        tokens.length === 0
          ? "No active Solana boosted pairs were available."
          : undefined,
    });
  } catch {
    return NextResponse.json(
      {
        tokens: [],
        updatedAt: new Date().toISOString(),
        message: "Bull Hub data is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
