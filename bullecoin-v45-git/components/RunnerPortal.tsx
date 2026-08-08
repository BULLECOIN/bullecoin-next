"use client";

import { useEffect, useMemo, useState } from "react";
import BearSmash from "@/components/BearSmash";
import RunnerProgression from "@/components/RunnerProgression";

type LeaderboardEntry = {
  wallet: string;
  nickname: string;
  best_score: number;
  updated_at: string;
};

type LeaderboardResponse = {
  weekStart?: string;
  leaderboard?: LeaderboardEntry[];
  updatedAt?: string;
};

function shortWallet(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function getNextMondayUtc() {
  const now = new Date();
  const next = new Date(now);
  const day = now.getUTCDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function RunnerPortal() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [remaining, setRemaining] = useState(
    getNextMondayUtc().getTime() - Date.now(),
  );

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/runner/leaderboard", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = (await response.json()) as LeaderboardResponse;
        setLeaderboard(result.leaderboard ?? []);
        setUpdatedAt(result.updatedAt ?? "");
      } catch {
        // Keep the current data if refresh fails.
      }
    }

    loadLeaderboard();
    const refresh = window.setInterval(loadLeaderboard, 60_000);
    const countdown = window.setInterval(() => {
      setRemaining(getNextMondayUtc().getTime() - Date.now());
    }, 1000);

    return () => {
      window.clearInterval(refresh);
      window.clearInterval(countdown);
    };
  }, []);

  const topTen = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);
  const timer = formatCountdown(remaining);

  return (
    <main className="runnerPortal">
      <header className="runnerPortalNav">
        <a href="/" className="runnerPortalBrand">
          <img src="/bulle-logo.jpg" alt="BULLE logo" />
          <div>
            <strong>BULLE</strong>
            <span>Bear Smash Arena</span>
          </div>
        </a>

        <nav>
          <a href="#play">Play</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#rewards">Rewards</a>
          <a href="#garage">Garage</a>
          <a href="#achievements">Achievements</a>
          <a href="#hall-of-fame">Hall of Fame</a>
          <a href="#rules">Rules</a>
        </nav>

        <a href="/" className="runnerPortalBack">
          BACK TO BULLE
        </a>
      </header>

      <section className="runnerPortalHero">
        <div className="runnerPortalHeroCopy">
          <p className="sectionLabel">OFFICIAL BULLE SKILL ARENA</p>
          <h1>
            BEAR
            <span>SMASH.</span>
          </h1>

          <p>
            Connect Phantom, sign a free verification message and compete in
            server-validated runs. Every official score is recreated by the
            server before it reaches the weekly leaderboard.
          </p>

          <div className="runnerPortalActions">
            <a href="#play">ENTER THE RING</a>
            <a href="#rules">READ THE RULES</a>
          </div>

          <div className="runnerPortalSecurity">
            <span>NO TRANSACTION TO SIGN IN</span>
            <span>SKILL-BASED COMPETITION</span>
            <span>WEEKLY UTC SEASONS</span>
          </div>
        </div>

        <div className="runnerPortalSeason">
          <small>CURRENT WEEK ENDS IN</small>

          <div className="runnerPortalTimer">
            <div><strong>{timer.days}</strong><span>DAYS</span></div>
            <div><strong>{timer.hours}</strong><span>HRS</span></div>
            <div><strong>{timer.minutes}</strong><span>MIN</span></div>
            <div><strong>{timer.seconds}</strong><span>SEC</span></div>
          </div>

          <p>
            Weekly periods close Monday at 00:00 UTC. Finalists remain subject
            to manual anti-cheat and eligibility review before any payout.
          </p>
        </div>
      </section>

      <section id="play" className="runnerPortalGame">
        <BearSmash />
      </section>

      <section id="leaderboard" className="runnerPortalSection">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">GLOBAL COMPETITION</p>
            <h2>WEEKLY TOP 10</h2>
          </div>

          <p>
            Only each wallet&apos;s best accepted score for the current UTC
            week appears here.
          </p>
        </div>

        <div className="runnerPortalLeaderboard">
          <div className="runnerPortalTableHead">
            <span>RANK</span>
            <span>PLAYER</span>
            <span>WALLET</span>
            <span>SCORE</span>
          </div>

          {topTen.length ? (
            topTen.map((entry, index) => (
              <article key={`${entry.wallet}-${index}`}>
                <span>#{index + 1}</span>
                <strong>{entry.nickname}</strong>
                <code>{shortWallet(entry.wallet)}</code>
                <b>{entry.best_score.toLocaleString("en-US")}</b>
              </article>
            ))
          ) : (
            <div className="runnerPortalEmpty">
              No verified scores yet. Become the first Bear Smash champion.
            </div>
          )}
        </div>

        <p className="runnerPortalUpdated">
          {updatedAt
            ? `Leaderboard refreshed ${new Date(updatedAt).toLocaleTimeString()}`
            : "Waiting for verified scores"}
        </p>
      </section>

      <section id="rewards" className="runnerPortalSection">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">WEEKLY REWARDS</p>
            <h2>TOP 5 SHARE 30%</h2>
          </div>

          <p>
            The published reward formula uses creator fees actually received
            during the corresponding competition period—not projected fees.
          </p>
        </div>

        <div className="runnerPortalRewards">
          <article><small>1ST PLACE</small><strong>10%</strong></article>
          <article><small>2ND PLACE</small><strong>7%</strong></article>
          <article><small>3RD PLACE</small><strong>5.5%</strong></article>
          <article><small>4TH PLACE</small><strong>4%</strong></article>
          <article><small>5TH PLACE</small><strong>3.5%</strong></article>
        </div>

        <div className="runnerPortalNotice">
          <strong>PRIZE SAFETY NOTICE</strong>
          <p>
            Keep real payouts disabled until official terms, eligible
            jurisdictions, age requirements, tax treatment, anti-cheat review
            and payout procedures are published. No token purchase is required
            during the free beta.
          </p>
        </div>
      </section>

      <RunnerProgression />

      <section id="profile" className="runnerPortalSection">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">PLAYER IDENTITY</p>
            <h2>MY FIGHTER PROFILE</h2>
          </div>

          <p>
            Profile expansion is prepared as the next phase. The connected
            wallet already acts as the verified player identity.
          </p>
        </div>

        <div className="runnerPortalProfileGrid">
          <article>
            <span>01</span>
            <h3>VERIFIED WALLET</h3>
            <p>Sign a plain-text message to prove wallet ownership.</p>
          </article>
          <article>
            <span>02</span>
            <h3>BEST WEEKLY SCORE</h3>
            <p>Only your strongest accepted run counts on the leaderboard.</p>
          </article>
          <article>
            <span>03</span>
            <h3>HALL OF FAME</h3>
            <p>Historical champions can be archived after weekly seasons end.</p>
          </article>
          <article>
            <span>04</span>
            <h3>ACHIEVEMENTS</h3>
            <p>Badges, streaks and cosmetic Cyber Bull skins can be added later.</p>
          </article>
        </div>
      </section>

      <section id="rules" className="runnerPortalSection">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">FAIR PLAY</p>
            <h2>OFFICIAL BETA RULES</h2>
          </div>
        </div>

        <div className="runnerPortalRules">
          <article>
            <strong>FREE ENTRY</strong>
            <p>No purchase or token holding is required during the beta.</p>
          </article>
          <article>
            <strong>ONE PLAYER, ONE WALLET</strong>
            <p>Wallet signatures identify official competition entries.</p>
          </article>
          <article>
            <strong>SERVER REPLAY</strong>
            <p>Submitted hits will be checked against a server-generated round.</p>
          </article>
          <article>
            <strong>MANUAL FINALIST REVIEW</strong>
            <p>The Top 5 can be reviewed before rewards are approved.</p>
          </article>
          <article>
            <strong>NO BOTS OR SCRIPTS</strong>
            <p>Automation, memory editing and manipulated clients are prohibited.</p>
          </article>
          <article>
            <strong>UTC WEEKLY RESET</strong>
            <p>Competition weeks run from Monday 00:00 UTC to the next Monday.</p>
          </article>
        </div>
      </section>

      <footer className="runnerPortalFooter">
        <div>
          <strong>BULLE — BEAR SMASH</strong>
          <span>bullecoin.io</span>
        </div>

        <p>
          Bear Smash is an experimental skill-based beta. Crypto assets involve
          risk. Nothing on this page is financial advice or a promise of profit.
        </p>
      </footer>
    </main>
  );
}
