"use client";

import bs58 from "bs58";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRunnerState,
  isGrounded,
  RUNNER,
  RunnerState,
  stepRunner,
} from "@/lib/runnerEngine";

type PhantomProvider = {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  signMessage(
    message: Uint8Array,
    display?: "utf8" | "hex",
  ): Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

type LeaderboardEntry = {
  wallet: string;
  nickname: string;
  best_score: number;
};

type ActiveRun = {
  runId: string;
  runToken: string;
  seed: number;
  startedAt: string;
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  velocityX: number;
  velocityY: number;
};

type RunnerStatus =
  | "ready"
  | "authorizing"
  | "running"
  | "validating"
  | "over";

const SOUND_STORAGE_KEY = "bulle-runner-sound";
const SKIN_STORAGE_KEY = "bulle-runner-selected-skin";

function shortWallet(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function skinFilter(skinId: string) {
  switch (skinId) {
    case "neon":
      return "brightness(1.3) saturate(1.6)";
    case "solana":
      return "hue-rotate(70deg) saturate(1.5)";
    case "gold":
      return "sepia(1) saturate(2.1) hue-rotate(355deg) brightness(1.15)";
    case "genesis":
      return "contrast(1.15) saturate(1.8) brightness(1.25)";
    default:
      return "grayscale(.15) contrast(1.08)";
  }
}

export default function BullRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<RunnerState>(createRunnerState(1));
  const accumulatorRef = useRef(0);
  const previousTimeRef = useRef(0);
  const pendingJumpRef = useRef(false);
  const jumpTicksRef = useRef<number[]>([]);
  const activeRunRef = useRef<ActiveRun | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const screenShakeRef = useRef(0);
  const lastGroundedRef = useRef(true);

  const [wallet, setWallet] = useState("");
  const [nickname, setNickname] = useState("CyberBull");
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<RunnerStatus>("ready");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState("steel");

  const topFive = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/runner/leaderboard", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const result = (await response.json()) as {
        leaderboard?: LeaderboardEntry[];
      };

      setLeaderboard(result.leaderboard ?? []);
    } catch {
      // Keep current leaderboard if refresh fails.
    }
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = "/bulle-logo.jpg";
    imageRef.current = image;

    const storedSound = window.localStorage.getItem(SOUND_STORAGE_KEY);
    setSoundEnabled(storedSound !== "off");

    const storedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (storedSkin) setSelectedSkin(storedSkin);

    const skinListener = (event: Event) => {
      const customEvent = event as CustomEvent<{ skinId?: string }>;
      if (customEvent.detail?.skinId) {
        setSelectedSkin(customEvent.detail.skinId);
      }
    };

    window.addEventListener("bulle-skin-change", skinListener);
    loadLeaderboard();

    const refresh = window.setInterval(loadLeaderboard, 60_000);

    return () => {
      window.clearInterval(refresh);
      window.removeEventListener("bulle-skin-change", skinListener);
    };
  }, [loadLeaderboard]);

  function ensureAudioContext() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      if (!soundEnabled) return;

      const audio = ensureAudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + duration,
      );

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    },
    [soundEnabled],
  );

  function toggleSound() {
    setSoundEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  }

  const spawnParticles = useCallback(
    (x: number, y: number, count: number, impact = false) => {
      const generated: Particle[] = Array.from({ length: count }, () => ({
        x,
        y,
        radius: 1 + Math.random() * (impact ? 5 : 3),
        alpha: 0.45 + Math.random() * 0.55,
        velocityX: -1 - Math.random() * (impact ? 7 : 4),
        velocityY: impact
          ? -4 + Math.random() * 8
          : -1.5 + Math.random() * 3,
      }));

      particlesRef.current.push(...generated);
      particlesRef.current = particlesRef.current.slice(-140);
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const state = stateRef.current;
    const shake = screenShakeRef.current;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    context.save();
    context.translate(shakeX, shakeY);

    const background = context.createLinearGradient(
      0,
      0,
      0,
      RUNNER.height,
    );
    background.addColorStop(0, "#020402");
    background.addColorStop(0.55, "#071407");
    background.addColorStop(1, "#020402");
    context.fillStyle = background;
    context.fillRect(-10, -10, RUNNER.width + 20, RUNNER.height + 20);

    const horizonGlow = context.createRadialGradient(
      RUNNER.width * 0.7,
      RUNNER.groundY,
      20,
      RUNNER.width * 0.7,
      RUNNER.groundY,
      430,
    );
    horizonGlow.addColorStop(0, "rgba(141,255,47,.20)");
    horizonGlow.addColorStop(1, "rgba(141,255,47,0)");
    context.fillStyle = horizonGlow;
    context.fillRect(0, 0, RUNNER.width, RUNNER.height);

    context.strokeStyle = "rgba(141,255,47,.08)";
    context.lineWidth = 1;

    for (let x = 0; x < RUNNER.width; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, RUNNER.height);
      context.stroke();
    }

    for (let y = 0; y < RUNNER.height; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(RUNNER.width, y);
      context.stroke();
    }

    context.fillStyle = "rgba(141,255,47,.10)";
    context.fillRect(
      0,
      RUNNER.groundY,
      RUNNER.width,
      RUNNER.height - RUNNER.groundY,
    );

    context.strokeStyle = "#8dff2f";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, RUNNER.groundY);
    context.lineTo(RUNNER.width, RUNNER.groundY);
    context.stroke();

    for (const obstacle of state.obstacles) {
      const obstacleY = RUNNER.groundY - obstacle.height;

      context.shadowColor = "#ff5656";
      context.shadowBlur = 14;

      if (obstacle.type === "bear") {
        context.font = "40px Arial";
        context.fillText("🐻", obstacle.x, obstacleY + 40);
      } else {
        context.fillStyle = "#ff5656";
        context.fillRect(
          obstacle.x + 9,
          obstacleY,
          obstacle.width - 18,
          obstacle.height,
        );
        context.strokeStyle = "#ff5656";
        context.beginPath();
        context.moveTo(
          obstacle.x + obstacle.width / 2,
          obstacleY - 10,
        );
        context.lineTo(
          obstacle.x + obstacle.width / 2,
          obstacleY + obstacle.height + 10,
        );
        context.stroke();
      }

      context.shadowBlur = 0;
    }

    particlesRef.current = particlesRef.current
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.velocityX,
        y: particle.y + particle.velocityY,
        alpha: particle.alpha - 0.025,
        velocityY: particle.velocityY + 0.09,
      }))
      .filter((particle) => particle.alpha > 0);

    for (const particle of particlesRef.current) {
      context.globalAlpha = particle.alpha;
      context.fillStyle = "#8dff2f";
      context.beginPath();
      context.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.globalAlpha = 1;

    const image = imageRef.current;
    context.shadowColor = "#8dff2f";
    context.shadowBlur = 28;

    if (image?.complete) {
      context.save();
      context.filter = skinFilter(selectedSkin);
      context.beginPath();
      context.arc(
        RUNNER.bullX + RUNNER.bullSize / 2,
        state.bullY + RUNNER.bullSize / 2,
        RUNNER.bullSize / 2,
        0,
        Math.PI * 2,
      );
      context.clip();
      context.drawImage(
        image,
        RUNNER.bullX,
        state.bullY,
        RUNNER.bullSize,
        RUNNER.bullSize,
      );
      context.restore();
    }

    context.shadowBlur = 0;
    context.fillStyle = "#8dff2f";
    context.font = "700 20px Arial";
    context.fillText(`SCORE ${state.score}`, 24, 36);

    context.fillStyle = "#9ba799";
    context.font = "13px Arial";
    context.fillText(
      `${selectedSkin.toUpperCase()} ARMOR`,
      24,
      60,
    );

    context.restore();

    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.72;
      if (screenShakeRef.current < 0.3) screenShakeRef.current = 0;
    }
  }, [selectedSkin]);

  const submitRun = useCallback(async () => {
    const activeRun = activeRunRef.current;
    if (!activeRun) return;

    setStatus("validating");
    setMessage("Server is replaying and validating your run...");

    try {
      const response = await fetch("/api/runner/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: activeRun.runId,
          runToken: activeRun.runToken,
          jumpTicks: jumpTicksRef.current,
          claimedScore: stateRef.current.score,
        }),
      });

      const result = (await response.json()) as {
        accepted?: boolean;
        score?: number;
        error?: string;
      };

      if (!response.ok || !result.accepted) {
        setAccepted(false);
        setMessage(result.error ?? "Score failed validation.");
        playTone(130, 0.3, "sawtooth");
      } else {
        setAccepted(true);
        setScore(result.score ?? stateRef.current.score);
        setMessage("Verified score accepted on the global leaderboard.");
        playTone(660, 0.12, "sine");
        window.setTimeout(() => playTone(880, 0.18, "sine"), 100);
        await loadLeaderboard();
      }
    } catch {
      setAccepted(false);
      setMessage("Score validation is temporarily unavailable.");
    } finally {
      setStatus("over");
      activeRunRef.current = null;
    }
  }, [loadLeaderboard, playTone]);

  const gameLoop = useCallback(
    (time: number) => {
      if (status !== "running") {
        draw();
        return;
      }

      if (!previousTimeRef.current) {
        previousTimeRef.current = time;
      }

      accumulatorRef.current += Math.min(
        100,
        time - previousTimeRef.current,
      );
      previousTimeRef.current = time;

      while (accumulatorRef.current >= RUNNER.fixedStepMs) {
        const state = stateRef.current;
        const jumpRequested = pendingJumpRef.current;
        const wasGrounded = isGrounded(state);

        if (jumpRequested && wasGrounded) {
          jumpTicksRef.current.push(state.tick);
          playTone(410, 0.08, "square");
          spawnParticles(
            RUNNER.bullX + 15,
            RUNNER.groundY - 5,
            12,
          );
        }

        stepRunner(state, jumpRequested);
        pendingJumpRef.current = false;
        accumulatorRef.current -= RUNNER.fixedStepMs;

        const groundedNow = isGrounded(state);
        if (!lastGroundedRef.current && groundedNow) {
          spawnParticles(
            RUNNER.bullX + RUNNER.bullSize / 2,
            RUNNER.groundY,
            18,
            true,
          );
          playTone(170, 0.06, "triangle");
        }
        lastGroundedRef.current = groundedNow;

        if (state.collided) {
          setScore(state.score);
          screenShakeRef.current = 14;
          spawnParticles(
            RUNNER.bullX + RUNNER.bullSize,
            state.bullY + RUNNER.bullSize / 2,
            34,
            true,
          );
          playTone(90, 0.32, "sawtooth");
          draw();
          void submitRun();
          return;
        }

        if (groundedNow && state.tick % 4 === 0) {
          spawnParticles(
            RUNNER.bullX + 12,
            RUNNER.groundY - 5,
            2,
          );
        }
      }

      setScore(stateRef.current.score);
      draw();
      frameRef.current = requestAnimationFrame(gameLoop);
    },
    [draw, playTone, spawnParticles, status, submitRun],
  );

  useEffect(() => {
    if (status === "running") {
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameLoop, status]);

  const requestJump = useCallback(() => {
    if (status === "running") {
      pendingJumpRef.current = true;
    }
  }, [status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        requestJump();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestJump]);

  useEffect(() => {
    draw();
  }, [draw]);

  async function connectWallet() {
    const provider = window.solana;

    if (!provider?.isPhantom) {
      setMessage(
        "Phantom was not detected. Open this page in a browser with Phantom.",
      );
      return;
    }

    try {
      const result = await provider.connect();
      setWallet(result.publicKey.toString());
      setMessage("Wallet connected. No transaction was requested.");
      playTone(520, 0.1, "sine");
    } catch {
      setMessage("Wallet connection was cancelled.");
    }
  }

  async function startVerifiedRun() {
    const provider = window.solana;

    if (!wallet || !provider?.isPhantom) {
      setMessage("Connect Phantom before starting an official run.");
      return;
    }

    setStatus("authorizing");
    setAccepted(null);
    setMessage("Sign the free verification message in Phantom.");

    try {
      const challengeResponse = await fetch("/api/runner/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      const challenge = (await challengeResponse.json()) as {
        nonce?: string;
        message?: string;
        error?: string;
      };

      if (
        !challengeResponse.ok ||
        !challenge.nonce ||
        !challenge.message
      ) {
        throw new Error(challenge.error ?? "Challenge failed.");
      }

      const signed = await provider.signMessage(
        new TextEncoder().encode(challenge.message),
        "utf8",
      );

      const startResponse = await fetch("/api/runner/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          nickname,
          nonce: challenge.nonce,
          message: challenge.message,
          signature: bs58.encode(signed.signature),
        }),
      });

      const run = (await startResponse.json()) as ActiveRun & {
        error?: string;
      };

      if (!startResponse.ok || !run.runId || !run.runToken) {
        throw new Error(run.error ?? "Run could not be started.");
      }

      activeRunRef.current = run;
      stateRef.current = createRunnerState(run.seed);
      jumpTicksRef.current = [];
      particlesRef.current = [];
      accumulatorRef.current = 0;
      previousTimeRef.current = 0;
      pendingJumpRef.current = false;
      lastGroundedRef.current = true;
      setScore(0);
      setMessage("Verified run started.");
      setStatus("running");
      playTone(310, 0.08, "square");
    } catch (error) {
      setStatus("ready");
      setMessage(
        error instanceof Error
          ? error.message
          : "Wallet authorization was cancelled.",
      );
    }
  }

  function shareScoreOnX() {
    const text = [
      "🐂 I completed a verified Bull Runner run!",
      "",
      `Score: ${score.toLocaleString("en-US")}`,
      `Armor: ${selectedSkin.toUpperCase()}`,
      "Can you beat me?",
      "",
      "https://bullecoin.io/bull-runner",
      "",
      "#BULLE #Solana #BullRunner",
    ].join("\n");

    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section className="runnerSection" id="bull-runner">
      <div className="contentWidth">
        <p className="sectionLabel">04 / BULL RUNNER V11</p>

        <div className="runnerHeader">
          <div>
            <h2>
              RUN.
              <span>VERIFY. RANK.</span>
            </h2>

            <p>
              V11 adds responsive controls, sound effects, landing particles,
              collision impact and live Garage skin previews without changing
              the server-validated competitive physics.
            </p>
          </div>

          <div className="runnerSecurityBadge">
            <small>SERVER CONTROLS</small>
            <strong>DETERMINISTIC REPLAY</strong>
            <span>Wallet signature · Rate limit · One-time run token</span>
          </div>
        </div>

        <div className="runnerLayout">
          <div className="runnerGamePanel">
            <div className="runnerControls runnerControlsV11">
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={18}
                placeholder="Nickname"
                aria-label="Runner nickname"
              />

              <button type="button" onClick={connectWallet}>
                {wallet ? shortWallet(wallet) : "CONNECT PHANTOM"}
              </button>

              <button
                type="button"
                onClick={startVerifiedRun}
                disabled={
                  status === "authorizing" ||
                  status === "running" ||
                  status === "validating"
                }
              >
                {status === "authorizing"
                  ? "SIGN MESSAGE"
                  : status === "validating"
                    ? "VALIDATING"
                    : status === "running"
                      ? "RUNNING"
                      : "START VERIFIED RUN"}
              </button>

              <button
                type="button"
                className="runnerSoundButton"
                onClick={toggleSound}
                aria-label="Toggle game sound"
              >
                {soundEnabled ? "SOUND ON" : "SOUND OFF"}
              </button>
            </div>

            <div
              className="runnerCanvasWrap runnerCanvasV11"
              onClick={requestJump}
              onTouchStart={(event) => {
                event.preventDefault();
                requestJump();
              }}
            >
              <canvas
                ref={canvasRef}
                width={RUNNER.width}
                height={RUNNER.height}
                aria-label="Bull Runner verified game"
              />

              {status !== "running" ? (
                <div className="runnerOverlay">
                  <strong>
                    {status === "validating"
                      ? "VALIDATING RUN"
                      : status === "over"
                        ? accepted
                          ? "SCORE ACCEPTED"
                          : "RUN COMPLETE"
                        : "BULL RUNNER"}
                  </strong>

                  <span>
                    {status === "over"
                      ? `Score: ${score.toLocaleString("en-US")}`
                      : "Connect Phantom and start a verified run"}
                  </span>

                  {status === "over" ? (
                    <>
                      <button type="button" onClick={startVerifiedRun}>
                        RUN AGAIN
                      </button>

                      <button
                        type="button"
                        className="runnerShareButton"
                        onClick={shareScoreOnX}
                      >
                        SHARE SCORE ON X
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              {status === "running" ? (
                <button
                  type="button"
                  className="runnerMobileJump"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestJump();
                  }}
                >
                  JUMP
                </button>
              ) : null}
            </div>

            <div className="runnerGameFooter">
              <span>Score: {score.toLocaleString("en-US")}</span>
              <span>
                Armor: {selectedSkin.toUpperCase()}
              </span>
              <span>
                {wallet
                  ? `Wallet: ${shortWallet(wallet)}`
                  : "Wallet required"}
              </span>
              <span>
                {accepted === true
                  ? "Verified"
                  : accepted === false
                    ? "Rejected / not ranked"
                    : "Awaiting run"}
              </span>
            </div>

            {message ? (
              <p className="runnerWalletMessage">{message}</p>
            ) : null}
          </div>

          <aside className="runnerSidebar">
            <div className="runnerPrizeCard">
              <small>WEEKLY CREATOR FEES CHAMPIONSHIP</small>
              <h3>TOP 5 SHARE 30%</h3>

              <ol>
                <li><span>1ST</span><strong>10%</strong></li>
                <li><span>2ND</span><strong>7%</strong></li>
                <li><span>3RD</span><strong>5.5%</strong></li>
                <li><span>4TH</span><strong>4%</strong></li>
                <li><span>5TH</span><strong>3.5%</strong></li>
              </ol>

              <p>
                Keep real payouts disabled until official rules and finalist
                review are published.
              </p>
            </div>

            <div className="runnerLeaderboard">
              <div className="runnerLeaderboardTitle">
                <strong>GLOBAL TOP 5</strong>
                <small>Current UTC week</small>
              </div>

              {topFive.length ? (
                <ol>
                  {topFive.map((entry, index) => (
                    <li key={entry.wallet}>
                      <span>#{index + 1}</span>
                      <div>
                        <strong>{entry.nickname}</strong>
                        <small>{shortWallet(entry.wallet)}</small>
                      </div>
                      <b>{entry.best_score}</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No verified scores yet.</p>
              )}
            </div>
          </aside>
        </div>

        <div className="runnerRules">
          <strong>V11 GAMEPLAY POLISH</strong>
          <p>
            Audio and visual effects are generated locally and do not influence
            score validation. The server continues recreating every obstacle
            and accepted jump using the official deterministic engine.
          </p>
        </div>
      </div>
    </section>
  );
}
