"use client";

import { useEffect, useMemo, useState } from "react";

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

type BullHubResponse = {
  tokens: BullHubToken[];
  updatedAt: string;
  message?: string;
};

function formatCurrency(value: number | null, maxDigits = 2) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) {
    return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 5 })}`;
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

export default function BullHub() {
  const [data, setData] = useState<BullHubResponse>({
    tokens: [],
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function loadBullHub() {
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
    if (!normalized) return data.tokens;
    return data.tokens.filter((token) =>
      [token.name, token.symbol, token.address]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.tokens, query]);

  return (
    <section className="bullHubSection" id="bull-hub">
      <div className="contentWidth">
        <p className="sectionLabel">04 / BULL HUB</p>

        <div className="bullHubHeader">
          <div>
            <h2>
              DISCOVER
              <span>SOLANA ACTIVITY.</span>
            </h2>
            <p>
              Public market data for trending and boosted Solana tokens.
              Visibility here is not an endorsement or a recommendation.
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

        <div className="bullHubToolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search token, symbol or address"
            aria-label="Search Bull Hub tokens"
          />
          <button type="button" onClick={loadBullHub}>
            REFRESH
          </button>
        </div>

        {data.message ? <p className="bullHubMessage">{data.message}</p> : null}

        <div className="bullHubGrid">
          {filteredTokens.map((token) => (
            <article className="bullHubCard" key={token.address}>
              <div className="bullHubCardTop">
                <div className="bullHubIdentity">
                  {token.imageUrl ? (
                    // External token icons are intentionally rendered as standard images.
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

                {token.boosted ? <em>BOOSTED</em> : null}
              </div>

              <div className="bullHubStats">
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
              </div>

              <div className="bullHubCardFooter">
                <code>{shortAddress(token.address)}</code>
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
            No tokens match your search.
          </div>
        ) : null}

        <p className="bullHubDisclaimer">
          Boosted placement can be paid promotion. Always verify the mint
          address, liquidity and contract details before interacting with any
          token.
        </p>
      </div>
    </section>
  );
}
