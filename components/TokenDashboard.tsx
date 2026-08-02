"use client";

import { useEffect, useState } from "react";

type TokenData = {
  launched: boolean;
  priceUsd: number | null;
  marketCap: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  supply: number | null;
  dexUrl: string | null;
  updatedAt: string;
  message?: string;
};

const emptyData: TokenData = {
  launched: false,
  priceUsd: null,
  marketCap: null,
  liquidityUsd: null,
  volume24h: null,
  priceChange24h: null,
  supply: null,
  dexUrl: null,
  updatedAt: "",
};

function formatCurrency(value: number | null, maximumDigits = 2) {
  if (value === null) return "—";
  if (value > 0 && value < 0.01) {
    return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 5 })}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: maximumDigits,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TokenDashboard() {
  const [data, setData] = useState<TokenData>(emptyData);
  const [loading, setLoading] = useState(true);

  async function loadTokenData() {
    try {
      const response = await fetch("/api/token-data", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load token data");
      setData((await response.json()) as TokenData);
    } catch {
      setData({ ...emptyData, message: "Live data is temporarily unavailable." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTokenData();
    const interval = window.setInterval(loadTokenData, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const status = loading ? "CONNECTING" : data.launched ? "LIVE DATA" : "AWAITING LAUNCH";

  return (
    <section className="dashboardSection" id="dashboard">
      <div className="contentWidth">
        <p className="sectionLabel">03 / LIVE DASHBOARD</p>

        <div className="dashboardHeader">
          <div>
            <h2>BULLE<span>MARKET DATA.</span></h2>
            <p>Verified information from public market and Solana sources.</p>
          </div>

          <div className={`dashboardStatus ${data.launched ? "dashboardStatusLive" : ""}`}>
            <i /><span>{status}</span>
          </div>
        </div>

        <div className="dashboardGrid">
          <article className="dashboardCard dashboardPrice">
            <small>PRICE</small>
            <strong>{loading ? "Loading..." : formatCurrency(data.priceUsd, 8)}</strong>
            <span>BULLE / USD</span>
          </article>
          <article className="dashboardCard">
            <small>MARKET CAP</small>
            <strong>{formatCurrency(data.marketCap)}</strong>
            <span>Current valuation</span>
          </article>
          <article className="dashboardCard">
            <small>LIQUIDITY</small>
            <strong>{formatCurrency(data.liquidityUsd)}</strong>
            <span>DEX liquidity</span>
          </article>
          <article className="dashboardCard">
            <small>24H VOLUME</small>
            <strong>{formatCurrency(data.volume24h)}</strong>
            <span>Trading activity</span>
          </article>
          <article className="dashboardCard">
            <small>24H CHANGE</small>
            <strong className={data.priceChange24h !== null && data.priceChange24h < 0 ? "negativeValue" : "positiveValue"}>
              {data.priceChange24h === null ? "—" : `${data.priceChange24h >= 0 ? "+" : ""}${data.priceChange24h.toFixed(2)}%`}
            </strong>
            <span>Price movement</span>
          </article>
          <article className="dashboardCard">
            <small>TOTAL SUPPLY</small>
            <strong>{formatNumber(data.supply)}</strong>
            <span>On-chain supply</span>
          </article>
        </div>

        <div className="dashboardFooter">
          <p>{data.message ?? (data.launched ? `Last update: ${new Date(data.updatedAt).toLocaleTimeString()}` : "Live information will activate after the official contract is published.")}</p>
          {data.dexUrl ? (
            <a href={data.dexUrl} target="_blank" rel="noreferrer">OPEN DEXSCREENER</a>
          ) : (
            <span>DEXSCREENER — COMING SOON</span>
          )}
        </div>
      </div>
    </section>
  );
}
