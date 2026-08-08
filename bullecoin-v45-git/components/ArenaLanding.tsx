"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import BullHubTrade from "./BullHubTrade";
import WalletPicker from "./WalletPicker";
import PlayerProfileSetup, { LocalPlayerProfile, readLocalProfile } from "./PlayerProfileSetup";
import TokenomicsPanel from "./TokenomicsPanel";

const xUrl = "https://x.com/BulleCoinOF";
const telegramUrl = "https://t.me/+k7ieRmAdKgpmNjcx";
const officialTokenAddress = "EfMyYFLjPHR9nfnoJbaNdYPHv4Btzs96Q3ikxmRppump";
const tokenAddress = process.env.NEXT_PUBLIC_BULLE_TOKEN_ADDRESS?.trim() || officialTokenAddress;

type Destination = {
  href: string;
  external?: boolean;
  label: string;
};

type NewsItem = { title: string; url: string; summary: string; author: string; publishedAt: string; image: string; source: string };
type TrendItem = { name: string; tokenAddress: string; poolAddress: string; dex: string; priceUsd: number; change5m?: number; change1h?: number; change6h?: number; change24h: number; volume24h: number; liquidity: number; marketCap: number | null; buys24h: number; sells24h: number; activeWallets?: number; url: string; imageUrl?: string };
type ArenaData = { news: NewsItem[]; trends: TrendItem[]; movers: TrendItem[]; updatedAt: string };
type LiveTokenData = { status: string; priceUsd: number | null; marketCapUsd: number | null; volume24hUsd: number | null; priceChange24h: number | null; updatedAt: string };
const compactUsd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
const tokenPrice = (value: number) => value < .001 ? `$${value.toPrecision(3)}` : `$${value.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;

export default function ArenaLanding() {
  const arenaRef = useRef<HTMLElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);
  const [soundOn, setSoundOn] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [transitionLabel, setTransitionLabel] = useState("");
  const [activeDoor, setActiveDoor] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<LocalPlayerProfile | null>(null);
  const [profileWallet, setProfileWallet] = useState("");
  const [playAfterProfile, setPlayAfterProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [infoPanel, setInfoPanel] = useState<"news" | "hub" | "tokenomics" | "">("");
  const [arenaData, setArenaData] = useState<ArenaData>({ news: [], trends: [], movers: [], updatedAt: "" });
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [itemCopied, setItemCopied] = useState("");
  const [liveToken, setLiveToken] = useState<LiveTokenData>({ status: "loading", priceUsd: null, marketCapUsd: null, volume24hUsd: null, priceChange24h: null, updatedAt: "" });

  useEffect(() => {
    const storedWallet = localStorage.getItem("bulle-active-wallet") || "";
    if (storedWallet) {
      setWalletAddress(storedWallet);
      setPlayerProfile(readLocalProfile(storedWallet));
    }
    return () => {
      if (musicTimerRef.current !== null) window.clearInterval(musicTimerRef.current);
      void audioRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch("/api/launch-data", { cache: "no-store" });
        if (response.ok) setLiveToken(await response.json() as LiveTokenData);
      } catch { /* Keep the latest valid market snapshot on screen. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (infoPanel !== "news" && infoPanel !== "hub") return;
    void refreshArenaNews();
    const timer = window.setInterval(() => void refreshArenaNews(false), 60000);
    return () => window.clearInterval(timer);
  }, [infoPanel]);

  function toggleSound() {
    if (soundOn) {
      if (musicTimerRef.current !== null) window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
      setSoundOn(false);
      return;
    }

    const context = audioRef.current ?? new window.AudioContext();
    audioRef.current = context;
    void context.resume();
    const melody = [146.83,174.61,196,220,196,174.61,164.81,130.81,146.83,196,233.08,220,196,174.61,146.83,130.81];
    const playNote = () => {
      const now = context.currentTime;
      const step = musicStepRef.current++;
      const frequency = melody[step % melody.length];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = step % 4 === 0 ? "sawtooth" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(step % 4 === 0 ? .018 : .012, now + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .32);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + .34);
      if (step % 4 === 0) {
        const bass = context.createOscillator();
        const bassGain = context.createGain();
        bass.type = "square";
        bass.frequency.value = frequency / 2;
        bassGain.gain.setValueAtTime(.009, now);
        bassGain.gain.exponentialRampToValueAtTime(.0001, now + .42);
        bass.connect(bassGain).connect(context.destination);
        bass.start(now);
        bass.stop(now + .44);
      }
    };
    playNote();
    musicTimerRef.current = window.setInterval(playNote, 330);
    setSoundOn(true);
  }

  function trackPointer(event: MouseEvent<HTMLElement>) {
    const bounds = arenaRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;

    setEyeOffset({
      x: Math.max(-5, Math.min(5, normalizedX * 10)),
      y: Math.max(-3, Math.min(3, normalizedY * 6)),
    });
  }

  function enterDoor(destination: Destination) {
    setActiveDoor(destination.label);
    setTransitionLabel(destination.label);

    window.setTimeout(() => {
      if (destination.external) {
        window.open(destination.href, "_blank", "noopener,noreferrer");
        setTransitionLabel("");
        setActiveDoor("");
        return;
      }

      window.location.href = destination.href;
    }, 720);
  }

  function openOfficialX() {
    setActiveDoor("OFFICIAL X");
    setTransitionLabel("OFFICIAL X");
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (mobile) {
      window.location.href = "twitter://user?screen_name=BulleCoinOF";
    } else {
      const opened = window.open(xUrl, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = xUrl;
    }
    window.setTimeout(() => {
      setTransitionLabel("");
      setActiveDoor("");
    }, 900);
  }

  function connectWallet() {
    setWalletPickerOpen(true);
  }

  function requestGameEntry() {
    if (!walletAddress) {
      setPlayAfterProfile(true);
      setWalletPickerOpen(true);
      return;
    }
    if (!playerProfile) {
      setPlayAfterProfile(true);
      setProfileWallet(walletAddress);
      return;
    }
    enterDoor({ href: "/bull-runner", label: "BULLE ARENA" });
  }

  function acceptWallet(address: string) {
    localStorage.setItem("bulle-active-wallet", address);
    setWalletAddress(address);
    setWalletPickerOpen(false);
    const existing = readLocalProfile(address);
    if (existing) {
      setPlayerProfile(existing);
      if (playAfterProfile) {
        setPlayAfterProfile(false);
        window.setTimeout(()=>enterDoor({ href: "/bull-runner", label: "BULLE ARENA" }), 80);
      }
    } else {
      setProfileWallet(address);
    }
  }

  async function copyTokenAddress() {
    if (!tokenAddress) return;
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function refreshArenaNews(showLoader = true) {
    if (showLoader) setNewsLoading(true);
    try {
      const response = await fetch("/api/arena-news", { cache: "no-store" });
      if (!response.ok) throw new Error("Feed unavailable");
      setArenaData(await response.json() as ArenaData);
      setNewsError("");
    } catch {
      setNewsError("LIVE DATA IS TEMPORARILY UNAVAILABLE");
    } finally {
      setNewsLoading(false);
    }
  }

  function shareNews(item: NewsItem) {
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(`${item.title}\n\nSource: ${item.source}\n${item.url}`)}`, "_blank", "noopener,noreferrer");
  }

  async function copyValue(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setItemCopied(key);
    window.setTimeout(() => setItemCopied(""), 1500);
  }

  return (
    <main
      ref={arenaRef}
      className="arenaLanding arenaExperience"
      onMouseMove={trackPointer}
    >
      <div className="arenaScene" aria-hidden="true">
        <img
          src="/bulle-arena-hero.png"
          alt=""
          className="arenaBackdrop"
        />
        <div className="arenaSmoke arenaSmokeOne" />
        <div className="arenaSmoke arenaSmokeTwo" />
        <div className="arenaLightSweep" />
        <div className="arenaParticles">
          {Array.from({ length: 18 }).map((_, index) => (
            <i key={index} style={{ "--particle": index } as React.CSSProperties} />
          ))}
        </div>
        <div
          className="arenaEyes"
          style={{
            transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
          }}
        >
          <i />
          <i />
        </div>
      </div>

      <div className="arenaOverlay">
        <header className="arenaTopbar">
          <div className="arenaBrand">
            <span>BULLE</span><strong>COIN</strong>
          </div>

          <div className="arenaSocials">
            <button type="button" className="arenaWallet" onClick={connectWallet}>
              {playerProfile?.username || (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "CONNECT WALLET")}
            </button>
            <a href={xUrl} target="_blank" rel="noreferrer">X</a>
            <a href={telegramUrl} target="_blank" rel="noreferrer">TG</a>
            <button type="button" onClick={toggleSound}>
              {soundOn ? "SOUND: ON" : "SOUND: OFF"}
            </button>
          </div>
        </header>

        <section className="arenaTitleBlock arenaTitleCompact">
          <h1><span>BULLE</span><strong>COIN</strong></h1>
          <p>THE CYBER BULL OF SOLANA</p>
          <b>THE ARENA IS BEING PREPARED</b>
        </section>

        <nav className="arenaMenu" aria-label="BulleCoin arena doors">
          <button
            type="button"
            className="arenaCard arenaPlay"
            onClick={() => setInfoPanel("news")}
          >
            <small>LATEST</small><strong>NEWS</strong>
          </button>

          <button
            type="button"
            className="arenaCard arenaExplore"
            onClick={() => setInfoPanel("hub")}
          >
            <small>WATCH AND TRADE</small><strong>BULL HUB</strong>
          </button>

          <button
            type="button"
            className="arenaCard arenaJoin"
            onClick={() => setInfoPanel("tokenomics")}
          >
            <small>EXPLORE</small><strong>TOKENOMICS</strong>
          </button>

          <button
            type="button"
            className={`arenaCard arenaFollow ${activeDoor === "OFFICIAL X" ? "arenaDoorActive" : ""}`}
            onClick={openOfficialX}
          >
            <small>FOLLOW</small><strong>OFFICIAL X</strong>
          </button>
        </nav>

        <button
          type="button"
          className="arenaEnter arenaEnterBreathing"
          onClick={requestGameEntry}
        >
          {playerProfile?`PLAY AS ${playerProfile.username}`:walletAddress?"CREATE USERNAME TO PLAY":"CONNECT WALLET TO PLAY"}
        </button>

        <footer className="arenaStatus">
          <small>BULLECOIN // LIVE MARKET</small>
          <strong>BULLE MARKET DATA</strong>

          <div className="arenaLiveStats">
            <span><small>PRICE</small><b>{liveToken.priceUsd!==null?tokenPrice(liveToken.priceUsd):"LOADING"}</b></span>
            <span><small>MARKET CAP</small><b>{liveToken.marketCapUsd!==null?compactUsd(liveToken.marketCapUsd):"PENDING"}</b></span>
            <span><small>24H VOLUME</small><b>{liveToken.volume24hUsd!==null?compactUsd(liveToken.volume24hUsd):"PENDING"}</b></span>
            <button type="button" onClick={()=>setInfoPanel("hub")}>BUY BULLE ↗</button>
          </div>

          <ul>
            <li>WEBSITE: <b>LIVE</b></li>
            <li>COMMUNITY: <b>GROWING</b></li>
            <li className="arenaTokenStatus">TOKEN: <b>LIVE</b>{tokenAddress&&<button type="button" onClick={copyTokenAddress}>{copied?"CA COPIED":`COPY CA ${tokenAddress.slice(0,4)}...${tokenAddress.slice(-4)}`}</button>}</li>
          </ul>

          <p>BUILT ON SOLANA</p>
        </footer>
      </div>

      <div
        className={`arenaTransition ${transitionLabel ? "arenaTransitionActive" : ""}`}
        aria-hidden={!transitionLabel}
      >
        <div className="arenaTransitionRing">
          <span>ENTERING</span>
          <strong>{transitionLabel || "THE ARENA"}</strong>
          <i />
        </div>
      </div>

      <div className={`arenaInfoPanel ${infoPanel ? "arenaInfoPanelOpen" : ""}`} aria-hidden={!infoPanel}>
        <button type="button" className="arenaInfoClose" onClick={() => setInfoPanel("")}>CLOSE ×</button>
        {infoPanel==="news"&&<section className="arenaNewsPanel arenaMarketRoom"><header className="arenaNewsHeader"><div><small>BULLECOIN // VERIFIED SOURCES + MARKET DATA</small><h2>MARKET NEWS</h2><p>Fresh editorial headlines and active Solana pools in one Bull Smash command room.</p></div><div className="arenaLatestActions"><span><i/> AUTO UPDATE</span><button type="button" onClick={()=>void refreshArenaNews()}>↻ {newsLoading?"LOADING":"REFRESH"}</button></div></header>{newsError&&<div className="arenaDataError">{newsError}</div>}<div className="arenaSectionTitle"><div><small>EDITORIAL INTEL</small><h3>LATEST CRYPTO NEWS</h3></div><span>COINDESK RSS · 5 MIN CACHE</span></div><div className="arenaEditorialGrid">{arenaData.news.map((item,index)=><article className="arenaEditorialCard" key={item.url}>{item.image&&<img src={item.image} alt="" loading="lazy"/>}<div><header><span>EDITORIAL NEWS</span><time>{new Date(item.publishedAt).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</time></header><h4>{item.title}</h4><p>{item.summary}</p><small>{item.source} · {item.author}</small><footer><a href={item.url} target="_blank" rel="noreferrer">READ FULL STORY ↗</a><button type="button" onClick={()=>shareNews(item)}>SHARE ON X</button><button type="button" onClick={()=>void copyValue(item.url,`news-${index}`)}>{itemCopied===`news-${index}`?"COPIED":"COPY LINK"}</button></footer></div></article>)}{!newsLoading&&!arenaData.news.length&&<p className="arenaEmptyData">NO EDITORIAL NEWS AVAILABLE</p>}</div><div className="arenaSectionTitle arenaTrendTitle"><div><small>ONCHAIN ACTIVITY</small><h3>SOLANA TRENDS</h3></div><span>GECKOTERMINAL · 60 SEC CACHE</span></div><div className="arenaTrendGrid">{arenaData.trends.map((trend,index)=><article className="arenaTrendCard" key={trend.poolAddress}><header><div><span>#{index+1}</span><h4>{trend.name}</h4></div><b>UNVERIFIED TOKEN</b></header><div className="arenaTrendPrice"><strong>{tokenPrice(trend.priceUsd)}</strong><em className={trend.change24h>=0?"arenaTrendUp":"arenaTrendDown"}>{trend.change24h>=0?"+":""}{trend.change24h.toFixed(2)}%</em></div><dl><div><dt>24H VOLUME</dt><dd>{compactUsd(trend.volume24h)}</dd></div><div><dt>LIQUIDITY</dt><dd>{compactUsd(trend.liquidity)}</dd></div><div><dt>MARKET CAP/FDV</dt><dd>{trend.marketCap?compactUsd(trend.marketCap):"N/A"}</dd></div><div><dt>24H TXNS</dt><dd>{(trend.buys24h+trend.sells24h).toLocaleString()}</dd></div></dl><p>{trend.dex.toUpperCase()} · {trend.tokenAddress.slice(0,5)}...{trend.tokenAddress.slice(-5)}</p><footer><a href={trend.url} target="_blank" rel="noreferrer">VIEW MARKET ↗</a><button type="button" onClick={()=>void copyValue(trend.tokenAddress,`trend-${index}`)}>{itemCopied===`trend-${index}`?"CA COPIED":"COPY CA"}</button></footer></article>)}{!newsLoading&&!arenaData.trends.length&&<p className="arenaEmptyData">NO SOLANA MARKET DATA AVAILABLE</p>}</div><footer className="arenaNewsFooter"><p>Editorial content belongs to its publisher. Trending status is not verification, endorsement or financial advice. Always verify the contract and research independently.</p><span>{arenaData.updatedAt?`UPDATED ${new Date(arenaData.updatedAt).toLocaleTimeString("en-US")}`:"WAITING FOR DATA"}</span></footer></section>}
        {infoPanel==="hub"&&<BullHubTrade trends={arenaData.trends} movers={arenaData.movers} loading={newsLoading} copiedKey={itemCopied} onCopy={(value,key)=>void copyValue(value,key)} onRefresh={()=>void refreshArenaNews()} bulleMarket={liveToken} />}
        {infoPanel==="tokenomics"&&<TokenomicsPanel onCopy={copyTokenAddress} copied={copied}/>} 
      </div>
      {walletPickerOpen&&<WalletPicker onClose={()=>{setWalletPickerOpen(false);setPlayAfterProfile(false)}} onConnected={(_,address)=>acceptWallet(address)} />}
      {profileWallet&&<PlayerProfileSetup wallet={profileWallet} onSaved={profile=>{setPlayerProfile(profile);setProfileWallet("");if(playAfterProfile){setPlayAfterProfile(false);window.setTimeout(()=>enterDoor({href:"/bull-runner",label:"BULLE ARENA"}),80)}}} onClose={()=>{setProfileWallet("");setPlayAfterProfile(false)}} />}
    </main>
  );
}
