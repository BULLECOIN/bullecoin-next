"use client";

import { useMemo, useState } from "react";

type Skin = {
  id: string;
  name: string;
  requirement: string;
  className: string;
  unlocked: boolean;
};

const skins: Skin[] = [
  {
    id: "steel",
    name: "Steel Bull",
    requirement: "Default",
    className: "skinSteel",
    unlocked: true,
  },
  {
    id: "neon",
    name: "Neon Bull",
    requirement: "Score 5,000",
    className: "skinNeon",
    unlocked: false,
  },
  {
    id: "solana",
    name: "Solana Bull",
    requirement: "Top 100",
    className: "skinSolana",
    unlocked: false,
  },
  {
    id: "gold",
    name: "Golden Bull",
    requirement: "Top 10",
    className: "skinGold",
    unlocked: false,
  },
  {
    id: "genesis",
    name: "Genesis Bull",
    requirement: "Weekly Champion",
    className: "skinGenesis",
    unlocked: false,
  },
];

const achievements = [
  ["FIRST RUN", "Complete one verified run", true],
  ["5K CLUB", "Reach a verified score of 5,000", false],
  ["TOP 100", "Enter the weekly Top 100", false],
  ["TOP 10", "Enter the weekly Top 10", false],
  ["WEEKLY CHAMPION", "Finish a week in first place", false],
  ["HERD BUILDER", "Share a verified score on X", false],
];

const champions = [
  {
    week: "COMING SOON",
    nickname: "First Champion",
    wallet: "—",
    score: "—",
  },
];

export default function RunnerProgression() {
  const [selectedSkin, setSelectedSkin] = useState("steel");

  const active = useMemo(
    () => skins.find((skin) => skin.id === selectedSkin) ?? skins[0],
    [selectedSkin],
  );

  return (
    <>
      <section className="runnerPortalSection" id="garage">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">CYBER BULL GARAGE</p>
            <h2>CHOOSE YOUR ARMOR</h2>
          </div>
          <p>
            Skins are visual rewards only and do not change speed, jump height
            or score. Competitive performance stays equal for every player.
          </p>
        </div>

        <div className="runnerGarageLayout">
          <div className={`runnerGaragePreview ${active.className}`}>
            <div className="runnerGarageGlow" />
            <img src="/bulle-logo.jpg" alt={active.name} />
            <small>SELECTED SKIN</small>
            <strong>{active.name}</strong>
            <span>{active.requirement}</span>
          </div>

          <div className="runnerSkinGrid">
            {skins.map((skin) => (
              <button
                type="button"
                key={skin.id}
                className={
                  selectedSkin === skin.id ? "runnerSkinActive" : undefined
                }
                onClick={() => skin.unlocked && setSelectedSkin(skin.id)}
                disabled={!skin.unlocked}
              >
                <span className={`runnerSkinSwatch ${skin.className}`} />
                <div>
                  <strong>{skin.name}</strong>
                  <small>{skin.requirement}</small>
                </div>
                <em>{skin.unlocked ? "UNLOCKED" : "LOCKED"}</em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="runnerPortalSection" id="achievements">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">PLAYER PROGRESSION</p>
            <h2>ACHIEVEMENTS</h2>
          </div>
          <p>
            This first version displays the progression system. Persistent
            achievement tracking can be connected to Supabase next.
          </p>
        </div>

        <div className="runnerAchievementGrid">
          {achievements.map(([title, description, unlocked]) => (
            <article
              key={title}
              className={unlocked ? "achievementUnlocked" : undefined}
            >
              <span>{unlocked ? "✓" : "◈"}</span>
              <strong>{title}</strong>
              <p>{description}</p>
              <small>{unlocked ? "UNLOCKED" : "LOCKED"}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="runnerPortalSection" id="hall-of-fame">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">LEGACY</p>
            <h2>HALL OF FAME</h2>
          </div>
          <p>
            Weekly champions will be archived here after final verification and
            reward approval.
          </p>
        </div>

        <div className="runnerHallOfFame">
          {champions.map((champion) => (
            <article key={champion.week}>
              <div className="runnerChampionBadge">01</div>
              <div>
                <small>{champion.week}</small>
                <strong>{champion.nickname}</strong>
                <span>{champion.wallet}</span>
              </div>
              <b>{champion.score}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="runnerPortalSection" id="prize-pool">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">LIVE REWARD DISPLAY</p>
            <h2>PRIZE POOL</h2>
          </div>
          <p>
            Keep this display at zero until an independently verified data
            source for creator fees is connected.
          </p>
        </div>

        <div className="runnerPrizePool">
          <div>
            <small>CURRENT VERIFIED POOL</small>
            <strong>◎ 0.00 SOL</strong>
            <span>≈ $0.00 USD</span>
          </div>

          <div>
            <small>DISTRIBUTION</small>
            <strong>30% TO TOP 5</strong>
            <span>Based only on creator fees actually received</span>
          </div>

          <div>
            <small>STATUS</small>
            <strong>DATA SOURCE PENDING</strong>
            <span>Automatic fee tracking is not active yet</span>
          </div>
        </div>
      </section>
    </>
  );
}
