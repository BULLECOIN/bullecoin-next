"use client";

import { useEffect, useMemo, useState } from "react";

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

type BullHubResponse = {
  tokens: BullHubToken[];
  updatedAt: string;
  message?: string;
};

type SortMode = "score" | "liquidity" | "volume" | "change" | "newest";

function formatCurrency(value: number | null, maxDigits = 2) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) {
    return `$${value.toLocaleString("en-US", {
      maximumSignificantDigits: 5,
    })}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: maxDigits,
  }).format(value);
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatAge(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function BullHub() {
  const [data, setData] = useState<BullHubResponse>({
    tokens: [],
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [boostedOnly, setBoostedOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [minLiquidity, setMinLiquidity] = useState("0");

  async function loadBullHub() {
    setLoading(true);

    try {
      const response = await fetch("/api/bull-hub", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load Bull Hub");

      setData((await response.json()) as BullHubResponse);
    } catch {
      setData({
        tokens: [],
        updatedAt: new Date().toISOString(),
        message: "Bull Hub data is temporarily unavailable.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBullHub();
    const interval = window.setInterval(loadBullHub, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredTokens = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const minimum = Number(minLiquidity) || 0;

    const result = data.tokens.filter((token) => {
      const matchesSearch =
        !normalized ||
        [token.name, token.symbol, token.address]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      const matchesBoosted = !boostedOnly || token.boosted;
      const matchesNew =
        !newOnly ||
        (token.pairAgeHours !== null && token.pairAgeHours <= 24);
      const matchesLiquidity = (token.liquidityUsd ?? 0) >= minimum;

      return (
        matchesSearch &&
        matchesBoosted &&
        matchesNew &&
        matchesLiquidity
      );
    });

    return [...result].sort((a, b) => {
      switch (sortMode) {
        case "liquidity":
          return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0);
        case "volume":
          return (b.volume24h ?? 0) - (a.volume24h ?? 0);
        case "change":
          return (b.priceChange24h ?? -Infinity) -
            (a.priceChange24h ?? -Infinity);
        case "newest":
          return (a.pairAgeHours ?? Infinity) -
            (b.pairAgeHours ?? Infinity);
        default:
          return b.score - a.score;
      }
    });
  }, [
    boostedOnly,
    data.tokens,
    minLiquidity,
    newOnly,
    query,
    sortMode,
  ]);

  return (
    <section className="bullHubSection" id="bull-hub">
      <div className="contentWidth">
        <p className="sectionLabel">04 / BULL HUB 2.0</p>

        <div className="bullHubHeader">
          <div>
            <h2>
              DISCOVER
              <span>SOLANA ACTIVITY.</span>
            </h2>

            <p>
              Compare public market activity using liquidity, volume, pair age
              and the experimental BULLE Score. This is research data, not a
              recommendation to buy.
            </p>
          </div>

          <div className="bullHubMeta">
            <span>{loading ? "UPDATING..." : "LIVE FEED"}</span>
            <small>
              {data.updatedAt
                ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`
                : "Waiting for data"}
            </small>
          </div>
        </div>

        <div className="bullHubToolbar bullHubToolbarV2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search token, symbol or mint address"
            aria-label="Search Bull Hub tokens"
          />

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Sort Bull Hub tokens"
          >
            <option value="score">Highest BULLE Score</option>
            <option value="liquidity">Highest liquidity</option>
            <option value="volume">Highest 24h volume</option>
            <option value="change">Highest 24h change</option>
            <option value="newest">Newest pair</option>
          </select>

          <select
            value={minLiquidity}
            onChange={(event) => setMinLiquidity(event.target.value)}
            aria-label="Minimum liquidity"
          >
            <option value="0">Any liquidity</option>
            <option value="10000">$10K+ liquidity</option>
            <option value="50000">$50K+ liquidity</option>
            <option value="100000">$100K+ liquidity</option>
          </select>

          <button type="button" onClick={loadBullHub}>
            REFRESH
          </button>
        </div>

        <div className="bullHubFilters">
          <label>
            <input
              type="checkbox"
              checked={boostedOnly}
              onChange={(event) => setBoostedOnly(event.target.checked)}
            />
            Boosted only
          </label>

          <label>
            <input
              type="checkbox"
              checked={newOnly}
              onChange={(event) => setNewOnly(event.target.checked)}
            />
            New pairs (24h)
          </label>

          <span>{filteredTokens.length} tokens displayed</span>
        </div>

        {data.message ? <p className="bullHubMessage">{data.message}</p> : null}

        <div className="bullHubGrid bullHubGridV2">
          {filteredTokens.map((token) => (
            <article className="bullHubCard bullHubCardV2" key={token.address}>
              <div className="bullHubCardTop">
                <div className="bullHubIdentity">
                  {token.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={token.imageUrl} alt="" />
                  ) : (
                    <div className="bullHubFallback">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}

                  <div>
                    <strong>{token.symbol}</strong>
                    <span>{token.name}</span>
                  </div>
                </div>

                <div className="bullHubBadges">
                  {token.boosted ? <em>BOOSTED</em> : null}
                  {token.pairAgeHours !== null &&
                  token.pairAgeHours <= 24 ? (
                    <em className="newBadge">NEW</em>
                  ) : null}
                </div>
              </div>

              <div className="bulleScore">
                <div>
                  <small>BULLE SCORE</small>
                  <strong>{token.score}</strong>
                  <span>/100</span>
                </div>

                <div className={`riskBadge risk${token.riskLevel}`}>
                  {token.riskLevel} DATA RISK
                </div>
              </div>

              <div className="scoreBar">
                <i style={{ width: `${token.score}%` }} />
              </div>

              <div className="bullHubStats bullHubStatsV2">
                <div>
                  <small>PRICE</small>
                  <strong>{formatCurrency(token.priceUsd, 8)}</strong>
                </div>
                <div>
                  <small>24H</small>
                  <strong
                    className={
                      token.priceChange24h !== null &&
                      token.priceChange24h < 0
                        ? "negativeValue"
                        : "positiveValue"
                    }
                  >
                    {token.priceChange24h === null
                      ? "—"
                      : `${token.priceChange24h >= 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%`}
                  </strong>
                </div>
                <div>
                  <small>LIQUIDITY</small>
                  <strong>{formatCurrency(token.liquidityUsd)}</strong>
                </div>
                <div>
                  <small>24H VOLUME</small>
                  <strong>{formatCurrency(token.volume24h)}</strong>
                </div>
                <div>
                  <small>MARKET CAP</small>
                  <strong>{formatCurrency(token.marketCap)}</strong>
                </div>
                <div>
                  <small>PAIR AGE</small>
                  <strong>{formatAge(token.pairAgeHours)}</strong>
                </div>
              </div>

              <details className="scoreDetails">
                <summary>Why this score?</summary>
                <ul>
                  {token.scoreReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </details>

              <div className="bullHubCardFooter">
                <code title={token.address}>
                  {shortAddress(token.address)}
                </code>

                {token.dexUrl ? (
                  <a href={token.dexUrl} target="_blank" rel="noreferrer">
                    VIEW DEXSCREENER
                  </a>
                ) : (
                  <span>PAIR UNAVAILABLE</span>
                )}
              </div>
            </article>
          ))}
        </div>

        {!loading && filteredTokens.length === 0 ? (
          <div className="bullHubEmpty">
            No tokens match the selected filters.
          </div>
        ) : null}

        <div className="scoreMethod">
          <strong>HOW BULLE SCORE WORKS</strong>
          <p>
            The score uses only available public market signals: liquidity,
            24-hour volume, volume-to-liquidity activity, pair age, profile
            availability and price movement. It does not verify ownership,
            code safety, holder concentration or future performance.
          </p>
        </div>

        <p className="bullHubDisclaimer">
          Boosted placement can be paid promotion. A high score does not mean a
          token is safe. Always verify the exact mint address and perform
          independent research before interacting with any asset.
        </p>
      </div>
    </section>
  );
}
