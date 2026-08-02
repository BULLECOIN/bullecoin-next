import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BoostEntry = {
  chainId?: string;
  tokenAddress?: string;
  amount?: number;
  totalAmount?: number;
  icon?: string | null;
};

type TokenProfile = {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
  links?: Array<{ type?: string; label?: string; url?: string }> | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairCreatedAt?: number;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string | null;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number | null;
  fdv?: number | null;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url?: string }>;
    socials?: Array<{ type?: string; url?: string }>;
  };
};

type RiskLevel = "LOWER" | "MEDIUM" | "HIGH";

type BullHubToken = {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  marketCap: number | null;
  pairAgeHours: number | null;
  dexUrl: string | null;
  boosted: boolean;
  hasProfile: boolean;
  score: number;
  riskLevel: RiskLevel;
  scoreReasons: string[];
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

function calculateScore(input: {
  liquidity: number;
  volume: number;
  change: number | null;
  pairAgeHours: number | null;
  hasProfile: boolean;
  boosted: boolean;
}) {
  const reasons: string[] = [];
  let score = 0;

  if (input.liquidity >= 250_000) {
    score += 35;
    reasons.push("Strong displayed liquidity");
  } else if (input.liquidity >= 100_000) {
    score += 28;
    reasons.push("Solid displayed liquidity");
  } else if (input.liquidity >= 50_000) {
    score += 20;
    reasons.push("Moderate displayed liquidity");
  } else if (input.liquidity >= 10_000) {
    score += 10;
    reasons.push("Limited displayed liquidity");
  } else {
    reasons.push("Very low or unavailable liquidity");
  }

  if (input.volume >= 500_000) {
    score += 25;
    reasons.push("High 24-hour volume");
  } else if (input.volume >= 100_000) {
    score += 18;
    reasons.push("Active 24-hour volume");
  } else if (input.volume >= 25_000) {
    score += 10;
    reasons.push("Moderate 24-hour volume");
  } else {
    reasons.push("Low or unavailable 24-hour volume");
  }

  const activityRatio =
    input.liquidity > 0 ? input.volume / input.liquidity : 0;

  if (activityRatio >= 1 && activityRatio <= 10) {
    score += 15;
    reasons.push("Healthy volume-to-liquidity activity");
  } else if (activityRatio > 10) {
    score += 7;
    reasons.push("Very high turnover relative to liquidity");
  } else if (activityRatio >= 0.25) {
    score += 8;
    reasons.push("Some trading activity relative to liquidity");
  }

  if (input.pairAgeHours !== null) {
    if (input.pairAgeHours >= 168) {
      score += 12;
      reasons.push("Pair has at least seven days of history");
    } else if (input.pairAgeHours >= 24) {
      score += 8;
      reasons.push("Pair has at least one day of history");
    } else {
      score += 2;
      reasons.push("Very new pair with limited history");
    }
  }

  if (input.hasProfile) {
    score += 8;
    reasons.push("DEX Screener profile or links available");
  }

  if (input.change !== null) {
    if (input.change >= -20 && input.change <= 100) {
      score += 5;
      reasons.push("24-hour price movement within scoring range");
    } else {
      reasons.push("Extreme 24-hour price movement");
    }
  }

  // Boosts are disclosed but intentionally add no points.
  if (input.boosted) {
    reasons.push("Boosted placement detected; no score bonus applied");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const riskLevel: RiskLevel =
    finalScore >= 70 ? "LOWER" : finalScore >= 45 ? "MEDIUM" : "HIGH";

  return { score: finalScore, riskLevel, reasons };
}

export async function GET() {
  try {
    const [topBoostResponse, latestBoostResponse, profileResponse] =
      await Promise.all([
        fetch("https://api.dexscreener.com/token-boosts/top/v1", {
          headers: { Accept: "application/json" },
          next: { revalidate: 60 },
        }),
        fetch("https://api.dexscreener.com/token-boosts/latest/v1", {
          headers: { Accept: "application/json" },
          next: { revalidate: 60 },
        }),
        fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
          headers: { Accept: "application/json" },
          next: { revalidate: 60 },
        }),
      ]);

    const topBoosts = topBoostResponse.ok
      ? ((await topBoostResponse.json()) as BoostEntry[])
      : [];

    const latestBoosts = latestBoostResponse.ok
      ? ((await latestBoostResponse.json()) as BoostEntry[])
      : [];

    const profiles = profileResponse.ok
      ? ((await profileResponse.json()) as TokenProfile[])
      : [];

    const solanaBoosts = [...topBoosts, ...latestBoosts].filter(
      (entry) =>
        entry.chainId === "solana" && Boolean(entry.tokenAddress),
    );

    const boostedAddressSet = new Set(
      solanaBoosts.map((entry) =>
        (entry.tokenAddress as string).toLowerCase(),
      ),
    );

    const boostIconMap = new Map(
      solanaBoosts
        .filter((entry) => Boolean(entry.icon))
        .map((entry) => [
          (entry.tokenAddress as string).toLowerCase(),
          entry.icon as string,
        ]),
    );

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

    const addresses = [
      ...new Set(
        solanaBoosts.map((entry) => entry.tokenAddress as string),
      ),
    ].slice(0, 18);

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
          const liquidity = pair.liquidity?.usd ?? 0;
          const volume = pair.volume?.h24 ?? 0;
          const change = pair.priceChange?.h24 ?? null;
          const pairAgeHours = pair.pairCreatedAt
            ? Math.max(0, (Date.now() - pair.pairCreatedAt) / 3_600_000)
            : null;

          const hasProfile = Boolean(
            profile ||
              pair.info?.websites?.length ||
              pair.info?.socials?.length,
          );

          const boosted = boostedAddressSet.has(address.toLowerCase());
          const scoreResult = calculateScore({
            liquidity,
            volume,
            change,
            pairAgeHours,
            hasProfile,
            boosted,
          });

          return {
            name: pair.baseToken.name ?? "Unknown token",
            symbol: pair.baseToken.symbol ?? "—",
            address,
            imageUrl:
              pair.info?.imageUrl ??
              profile?.icon ??
              boostIconMap.get(address.toLowerCase()) ??
              null,
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
            liquidityUsd: pair.liquidity?.usd ?? null,
            volume24h: pair.volume?.h24 ?? null,
            priceChange24h: change,
            marketCap: pair.marketCap ?? pair.fdv ?? null,
            pairAgeHours,
            dexUrl: pair.url ?? null,
            boosted,
            hasProfile,
            score: scoreResult.score,
            riskLevel: scoreResult.riskLevel,
            scoreReasons: scoreResult.reasons,
          };
        } catch {
          return null;
        }
      }),
    );

    const tokens = tokenResults
      .filter((token): token is BullHubToken => token !== null)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      tokens,
      updatedAt: new Date().toISOString(),
      message:
        tokens.length === 0
          ? "No active Solana pairs were available from the current public feed."
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
