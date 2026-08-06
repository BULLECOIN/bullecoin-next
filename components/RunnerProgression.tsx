"use client";

import { useEffect, useMemo, useState } from "react";

type Skin = {
  id: string;
  name: string;
  requirement: string;
  className: string;
  unlocked: boolean;
};

type Achievement = {
  title: string;
  description: string;
  unlocked: boolean;
};

type Champion = {
  week: string;
  nickname: string;
  wallet: string;
  score: string;
};

const SKIN_STORAGE_KEY = "bulle-runner-selected-skin";

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

const achievements: Achievement[] = [
  {
    title: "FIRST SMASH",
    description: "Complete one verified round",
    unlocked: true,
  },
  {
    title: "5K CLUB",
    description: "Reach a verified score of 5,000",
    unlocked: false,
  },
  {
    title: "TOP 100",
    description: "Enter the weekly Top 100",
    unlocked: false,
  },
  {
    title: "TOP 10",
    description: "Enter the weekly Top 10",
    unlocked: false,
  },
  {
    title: "WEEKLY CHAMPION",
    description: "Finish a week in first place",
    unlocked: false,
  },
  {
    title: "HERD BUILDER",
    description: "Share a verified score on X",
    unlocked: false,
  },
];

const champions: Champion[] = [
  {
    week: "COMING SOON",
    nickname: "First Champion",
    wallet: "—",
    score: "—",
  },
];

export default function RunnerProgression() {
  const [selectedSkin, setSelectedSkin] = useState("steel");

  useEffect(() => {
    const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (stored && skins.some((skin) => skin.id === stored && skin.unlocked)) {
      setSelectedSkin(stored);
    }
  }, []);

  const activeSkin = useMemo(
    () => skins.find((skin) => skin.id === selectedSkin) ?? skins[0],
    [selectedSkin],
  );

  function chooseSkin(skin: Skin) {
    if (!skin.unlocked) return;

    setSelectedSkin(skin.id);
    window.localStorage.setItem(SKIN_STORAGE_KEY, skin.id);
    window.dispatchEvent(
      new CustomEvent("bulle-skin-change", {
        detail: { skinId: skin.id },
      }),
    );
  }

  return (
    <>
      <section className="runnerPortalSection" id="garage">
        <div className="runnerPortalSectionHeader">
          <div>
            <p className="sectionLabel">CYBER BULL GARAGE</p>
            <h2>CHOOSE YOUR ARMOR</h2>
          </div>

          <p>
            Skins are visual rewards only and do not change target speed,
            combo value or score. Competition stays equal for every player.
          </p>
        </div>

        <div className="runnerGarageLayout">
          <div className={`runnerGaragePreview ${activeSkin.className}`}>
            <div className="runnerGarageGlow" />
            <img src="/bulle-logo.jpg" alt={activeSkin.name} />
            <small>SELECTED SKIN</small>
            <strong>{activeSkin.name}</strong>
            <span>{activeSkin.requirement}</span>
          </div>

          <div className="runnerSkinGrid">
            {skins.map((skin) => (
              <button
                type="button"
                key={skin.id}
                className={
                  selectedSkin === skin.id ? "runnerSkinActive" : undefined
                }
                onClick={() => chooseSkin(skin)}
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
          {achievements.map((achievement) => (
            <article
              key={achievement.title}
              className={
                achievement.unlocked ? "achievementUnlocked" : undefined
              }
            >
              <span>{achievement.unlocked ? "✓" : "◈"}</span>
              <strong>{achievement.title}</strong>
              <p>{achievement.description}</p>
              <small>{achievement.unlocked ? "UNLOCKED" : "LOCKED"}</small>
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
