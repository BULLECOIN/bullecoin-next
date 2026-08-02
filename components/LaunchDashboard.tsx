"use client";

import { useEffect, useState } from "react";

type LaunchData = {
  status:
    | "awaiting_token"
    | "market_syncing"
    | "live"
    | "temporarily_unavailable";
  tokenAddress: string;
  treasuryWallet: string;
  pumpUrl: string;
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  buys24h: number | null;
  sells24h: number | null;
  pairUrl: string | null;
  creatorFeesSol: number;
  rewardPoolSol: number;
  distributedSol: number;
  updatedAt: string;
  source: string;
};

const emptyData: LaunchData = {
  status: "awaiting_token",
  tokenAddress: "",
  treasuryWallet: "",
  pumpUrl: "",
  priceUsd: null,
  priceChange24h: null,
  marketCapUsd: null,
  fdvUsd: null,
  liquidityUsd: null,
  volume24hUsd: null,
  buys24h: null,
  sells24h: null,
  pairUrl: null,
  creatorFeesSol: 0,
  rewardPoolSol: 0,
  distributedSol: 0,
  updatedAt: "",
  source: "Waiting for official token configuration",
};

function formatUsd(value: number | null, precise = false) {
  if (value === null) return "SYNCING";

  if (precise && value > 0 && value < 0.01) {
    return `$${value.toLocaleString("en-US", {
      maximumSignificantDigits: 7,
    })}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: precise ? 8 : 2,
  }).format(value);
}

function shortAddress(address: string) {
  if (!address) return "PENDING";
  return `${address.slice(0, 7)}...${address.slice(-7)}`;
}

export default function LaunchDashboard() {
  const [data, setData] = useState<LaunchData>(emptyData);
  const [copied, setCopied] = useState<"contract" | "treasury" | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/launch-data", {
          cache: "no-store",
        });

        if (!response.ok) return;
        setData((await response.json()) as LaunchData);
      } catch {
        // Preserve the last successful market snapshot.
      }
    }

    loadData();
    const refresh = window.setInterval(loadData, 20_000);
    return () => window.clearInterval(refresh);
  }, []);

  async function copyValue(
    value: string,
    type: "contract" | "treasury",
  ) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  const tokenConfigured = Boolean(data.tokenAddress);
  const marketLive = data.status === "live";

  return (
    <section className="launchSection liveSection" id="live">
      <div className="contentWidth">
        <div className="launchTopline">
          <div>
            <p className="sectionLabel">BULLE OFFICIAL MARKET</p>
            <h2>
              THE STAMPEDE
              <span>IS LIVE.</span>
            </h2>
          </div>

          <div className="launchStatus launchLive">
            <i />
            <div>
              <small>STATUS</small>
              <strong>
                {tokenConfigured
                  ? marketLive
                    ? "BULLE LIVE"
                    : "MARKET DATA SYNCING"
                  : "TOKEN CONFIGURATION PENDING"}
              </strong>
            </div>
          </div>
        </div>

        <div className="liveHeroPanel">
          <div>
            <small>OFFICIAL CONTRACT ADDRESS</small>
            <strong>{data.tokenAddress || "ADD CA IN VERCEL"}</strong>
            <p>
              Always verify this exact mint before buying or connecting to any
              third-party platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() => copyValue(data.tokenAddress, "contract")}
            disabled={!data.tokenAddress}
          >
            {copied === "contract" ? "CONTRACT COPIED" : "COPY OFFICIAL CA"}
          </button>
        </div>

        <div className="launchMetrics">
          <article>
            <small>PRICE</small>
            <strong>{formatUsd(data.priceUsd, true)}</strong>
            <span>
              {data.priceChange24h === null
                ? "DEX data is syncing"
                : `${data.priceChange24h >= 0 ? "+" : ""}${data.priceChange24h.toFixed(2)}% / 24H`}
            </span>
          </article>

          <article>
            <small>MARKET CAP</small>
            <strong>{formatUsd(data.marketCapUsd ?? data.fdvUsd)}</strong>
            <span>Live market source</span>
          </article>

          <article>
            <small>LIQUIDITY</small>
            <strong>{formatUsd(data.liquidityUsd)}</strong>
            <span>Highest-liquidity Solana pair</span>
          </article>

          <article>
            <small>24H VOLUME</small>
            <strong>{formatUsd(data.volume24hUsd)}</strong>
            <span>
              {data.buys24h === null
                ? "Awaiting trade data"
                : `${data.buys24h} buys · ${data.sells24h ?? 0} sells`}
            </span>
          </article>
        </div>

        <div className="launchTransparencyGrid liveTransparencyGrid">
          <article className="launchFees">
            <div className="launchCardHeading">
              <small>COMMUNITY TRANSPARENCY</small>
              <h3>CREATOR FEES</h3>
            </div>

            <div className="launchFeeRows">
              <div>
                <span>Collected and verified</span>
                <strong>◎ {data.creatorFeesSol.toFixed(4)} SOL</strong>
              </div>
              <div>
                <span>Bull Runner community pool — 30%</span>
                <strong>◎ {data.rewardPoolSol.toFixed(4)} SOL</strong>
              </div>
              <div>
                <span>Previously distributed</span>
                <strong>◎ {data.distributedSol.toFixed(4)} SOL</strong>
              </div>
            </div>

            <p>
              Values remain at zero until actual creator-fee records are
              verified. BULLE does not display estimated or fabricated totals.
            </p>
          </article>

          <article className="launchContract treasuryCard">
            <div className="launchCardHeading">
              <small>OFFICIAL PROJECT WALLET</small>
              <h3>BULLE TREASURY</h3>
            </div>

            <code title={data.treasuryWallet}>
              {shortAddress(data.treasuryWallet)}
            </code>

            <button
              type="button"
              onClick={() => copyValue(data.treasuryWallet, "treasury")}
              disabled={!data.treasuryWallet}
            >
              {copied === "treasury" ? "WALLET COPIED" : "COPY TREASURY WALLET"}
            </button>

            {data.treasuryWallet ? (
              <a
                href={`https://solscan.io/account/${data.treasuryWallet}`}
                target="_blank"
                rel="noreferrer"
              >
                VIEW ON SOLSCAN
              </a>
            ) : (
              <span className="treasuryPending">TREASURY WALLET PENDING</span>
            )}

            <p>
              This public wallet is intended for community rewards and project
              activity. Never send funds based on an address shared by an
              unofficial account.
            </p>
          </article>
        </div>

        <div className="launchActions">
          {data.pumpUrl ? (
            <a href={data.pumpUrl} target="_blank" rel="noreferrer">
              BUY BULLE
            </a>
          ) : (
            <span className="launchDisabledAction">BUY LINK PENDING</span>
          )}

          {data.pairUrl ? (
            <a href={data.pairUrl} target="_blank" rel="noreferrer">
              VIEW DEXSCREENER
            </a>
          ) : (
            <span className="launchDisabledAction">DEX DATA SYNCING</span>
          )}

          <a href="/bull-runner">PLAY BULL RUNNER</a>
        </div>

        <div className="launchSource">
          <span>
            Market information refreshes every 20 seconds. Creator-fee values
            are updated only after verification.
          </span>
          <small>
            {data.updatedAt
              ? `Last checked ${new Date(data.updatedAt).toLocaleTimeString()}`
              : "Waiting for first update"}
          </small>
        </div>
      </div>
    </section>
  );
}
