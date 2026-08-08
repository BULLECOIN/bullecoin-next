"use client";

import { useEffect, useMemo, useState } from "react";

type LaunchData = {
  status:
    | "awaiting_launch"
    | "searching"
    | "pair_pending"
    | "data_pending"
    | "live"
    | "temporarily_unavailable";
  tokenAddress: string;
  pumpUrl: string;
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  buys24h: number | null;
  sells24h: number | null;
  holders: number | null;
  pairUrl: string | null;
  pairAddress: string | null;
  dexId: string | null;
  creatorFeesSol: number;
  rewardPoolSol: number;
  distributedSol: number;
  updatedAt: string;
  source: string;
};

const launchAt =
  process.env.NEXT_PUBLIC_BULLE_LAUNCH_AT ??
  "2026-08-02T16:00:00-06:00";

const emptyData: LaunchData = {
  status: "awaiting_launch",
  tokenAddress: "",
  pumpUrl: "",
  priceUsd: null,
  priceChange24h: null,
  marketCapUsd: null,
  fdvUsd: null,
  liquidityUsd: null,
  volume24hUsd: null,
  buys24h: null,
  sells24h: null,
  holders: null,
  pairUrl: null,
  pairAddress: null,
  dexId: null,
  creatorFeesSol: 0,
  rewardPoolSol: 0,
  distributedSol: 0,
  updatedAt: "",
  source: "Pre-launch configuration",
};

function formatUsd(value: number | null, precise = false) {
  if (value === null) return "PENDING";

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
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function LaunchDashboard() {
  const [data, setData] = useState<LaunchData>(emptyData);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const launchTimestamp = useMemo(
    () => new Date(launchAt).getTime(),
    [],
  );

  const isLaunchTime =
    remaining !== null && remaining <= 0;

  const timer =
    remaining === null
      ? null
      : formatRemaining(remaining);

  useEffect(() => {
    const updateCountdown = () => {
      setRemaining(launchTimestamp - Date.now());
    };

    updateCountdown();
    const countdown = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(countdown);
  }, [launchTimestamp]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/launch-data", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = (await response.json()) as LaunchData;
        setData(result);
      } catch {
        // Preserve the last successful data snapshot.
      }
    }

    loadData();
    const refresh = window.setInterval(loadData, 20_000);

    return () => window.clearInterval(refresh);
  }, []);

  async function copyContract() {
    if (!data.tokenAddress) return;

    await navigator.clipboard.writeText(data.tokenAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const live = data.status === "live";
  const buyUrl = data.pumpUrl || null;
  const marketUrl = data.pairUrl || null;

  return (
    <section className="launchSection" id="launch">
      <div className="contentWidth">
        <div className="launchTopline">
          <div>
            <p className="sectionLabel">BULLE OFFICIAL LAUNCH</p>
            <h2>
              PREPARE FOR
              <span>THE STAMPEDE.</span>
            </h2>
          </div>

          <div className={`launchStatus ${live ? "launchLive" : ""}`}>
            <i />
            <div>
              <small>STATUS</small>
              <strong>
                {live
                  ? "BULLE LIVE"
                  : isLaunchTime
                    ? "LAUNCH WINDOW OPEN"
                    : "COUNTDOWN ACTIVE"}
              </strong>
            </div>
          </div>
        </div>

        <div className="launchCountdownMega">
          <div className="launchCountdownMegaHeader">
            <div>
              <small>OFFICIAL TARGET TIME</small>
              <strong>4:00 PM — MONTERREY</strong>
              <span>Sunday, August 2, 2026 · America/Monterrey</span>
            </div>

            <p>
              {live
                ? "BULLE IS LIVE"
                : isLaunchTime
                  ? "THE LAUNCH WINDOW IS OPEN"
                  : "THE STAMPEDE BEGINS IN"}
            </p>
          </div>

          <div className="launchTimerMega" aria-label="BULLE launch countdown">
            <div>
              <strong>{timer?.days ?? "--"}</strong>
              <span>DAYS</span>
            </div>
            <b>:</b>
            <div>
              <strong>{timer?.hours ?? "--"}</strong>
              <span>HOURS</span>
            </div>
            <b>:</b>
            <div>
              <strong>{timer?.minutes ?? "--"}</strong>
              <span>MINUTES</span>
            </div>
            <b>:</b>
            <div>
              <strong>{timer?.seconds ?? "--"}</strong>
              <span>SECONDS</span>
            </div>
          </div>

          <div className="launchCountdownMegaFooter">
            <span>LIVE DATA ACTIVATES AFTER THE OFFICIAL MINT IS ADDED</span>
            <i />
            <span>VERIFY EVERY LINK THROUGH BULLE OFFICIAL CHANNELS</span>
          </div>
        </div>

        <div className="launchMetrics">
          <article>
            <small>PRICE</small>
            <strong>{formatUsd(data.priceUsd, true)}</strong>
            <span>
              {data.priceChange24h === null
                ? "Awaiting market data"
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
                ? "Awaiting trades"
                : `${data.buys24h} buys · ${data.sells24h ?? 0} sells`}
            </span>
          </article>
        </div>

        <div className="launchTransparencyGrid">
          <article className="launchFees">
            <div className="launchCardHeading">
              <small>TRANSPARENCY</small>
              <h3>CREATOR FEES</h3>
            </div>

            <div className="launchFeeRows">
              <div>
                <span>Collected and verified</span>
                <strong>◎ {data.creatorFeesSol.toFixed(4)} SOL</strong>
              </div>
              <div>
                <span>Weekly Bear Smash pool — 30%</span>
                <strong>◎ {data.rewardPoolSol.toFixed(4)} SOL</strong>
              </div>
              <div>
                <span>Previously distributed</span>
                <strong>◎ {data.distributedSol.toFixed(4)} SOL</strong>
              </div>
            </div>

            <p>
              Fee totals remain at zero until manually verified from official
              creator-fee records. The site does not estimate or fabricate fees.
            </p>
          </article>

          <article className="launchContract">
            <div className="launchCardHeading">
              <small>OFFICIAL TOKEN</small>
              <h3>VERIFY THE MINT</h3>
            </div>

            <code>{shortAddress(data.tokenAddress)}</code>

            <button
              type="button"
              onClick={copyContract}
              disabled={!data.tokenAddress}
            >
              {copied ? "COPIED" : "COPY CONTRACT"}
            </button>

            <p>
              Never interact with an address posted by an unofficial account.
              Verify the mint here and through the official BULLE account.
            </p>
          </article>
        </div>

        <div className="launchActions">
          {buyUrl ? (
            <a href={buyUrl} target="_blank" rel="noreferrer">
              BUY ON PUMP.FUN
            </a>
          ) : (
            <span className="launchDisabledAction">
              PUMP.FUN LINK PENDING
            </span>
          )}

          {marketUrl ? (
            <a href={marketUrl} target="_blank" rel="noreferrer">
              VIEW MARKET
            </a>
          ) : (
            <span className="launchDisabledAction">
              MARKET PAIR PENDING
            </span>
          )}

          <a href="/bull-runner">PLAY BEAR SMASH</a>
        </div>

        <div className="launchSource">
          <span>
            Market data refreshes every 20 seconds after the official mint and
            a supported Solana pair are available.
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
