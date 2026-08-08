"use client";

import { useEffect, useState } from "react";
import WalletPicker from "./WalletPicker";
import { PUBLIC_BULLE_MINT, PUBLIC_LAUNCH_MODE } from "../lib/publicBulleConfig";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const BULLE_MINT = PUBLIC_BULLE_MINT;
const BULLE_TRADING_ENABLED = PUBLIC_LAUNCH_MODE === "live";
const REFERRAL_ACCOUNT = "DvMBw6bVSTPmt3SdD8uUHnSF36ibZcbRbkyveANunVWb";
const REFERRAL_FEE_BPS = 50;

export type HubTrend = { name: string; tokenAddress: string; poolAddress: string; dex: string; priceUsd: number; change5m?: number; change1h?: number; change6h?: number; change24h: number; volume24h: number; liquidity: number; marketCap: number | null; buys24h: number; sells24h: number; activeWallets?: number; url: string; imageUrl?: string };

type JupiterApi = { init: (options: Record<string, unknown>) => void; close?: () => void };
type TradeRecord = { txid: string; side: "BUY" | "SELL"; symbol: string; mint: string; time: string };


const compactUsd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
const short = (address: string) => `${address.slice(0, 5)}...${address.slice(-5)}`;
const percent = (value = 0) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function TokenImage({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="bullHubTokenFallback">{name.trim().slice(0, 1).toUpperCase() || "?"}</span>;
  return <img src={src} alt={`${name} token`} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}

export default function BullHubTrade({ trends, movers, loading, copiedKey, onCopy, onRefresh, bulleMarket }: { trends: HubTrend[]; movers: HubTrend[]; loading: boolean; copiedKey: string; onCopy: (value: string, key: string) => void; onRefresh: () => void; bulleMarket: { priceUsd: number | null; marketCapUsd: number | null; volume24hUsd: number | null } }) {
  const [tab, setTab] = useState<"trade" | "trending">("trending");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [selected, setSelected] = useState({ name: "BULLECOIN", mint: BULLE_MINT, imageUrl: "/bulle-logo.jpg" });
  const [scriptReady, setScriptReady] = useState(false);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [hubWalletPicker, setHubWalletPicker] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    try { setTrades(JSON.parse(localStorage.getItem("bulle-hub-trades") || "[]") as TradeRecord[]); } catch { setTrades([]); }
    setWalletAddress(localStorage.getItem("bulle-active-wallet") || "");
    const found = document.querySelector<HTMLScriptElement>('script[data-bulle-jupiter="true"]');
    if (found) {
      if ((window as typeof window & { Jupiter?: JupiterApi }).Jupiter) setScriptReady(true);
      else found.addEventListener("load", () => setScriptReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://plugin.jup.ag/plugin-v1.js";
    script.async = true;
    script.dataset.bulleJupiter = "true";
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || tab !== "trade") return;
    const timer = window.setTimeout(() => {
      const api = (window as typeof window & { Jupiter?: JupiterApi }).Jupiter;
      if (!api) return;
      api.close?.();
      api.init({
        displayMode: "integrated",
        integratedTargetId: "bulle-jupiter-terminal",
        formProps: {
          initialInputMint: side === "BUY" ? SOL_MINT : selected.mint,
          initialOutputMint: side === "BUY" ? selected.mint : SOL_MINT,
          swapMode: "ExactInOrOut",
          referralAccount: REFERRAL_ACCOUNT,
          referralFee: REFERRAL_FEE_BPS,
        },
        branding: { name: "BULL HUB" },
        onSuccess: ({ txid }: { txid?: string }) => {
          const record = { txid: txid || "confirmed", side, symbol: selected.name, mint: selected.mint, time: new Date().toISOString() } as TradeRecord;
          setTrades(previous => {
            const next = [record, ...previous].slice(0, 8);
            localStorage.setItem("bulle-hub-trades", JSON.stringify(next));
            return next;
          });
        },
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [scriptReady, tab, side, selected]);

  function tradeToken(trend: HubTrend) {
    setSelected({ name: trend.name, mint: trend.tokenAddress, imageUrl: trend.imageUrl || "" });
    setSide("BUY");
    setTab("trade");
  }

  function tradeBulle() {
    if (!BULLE_TRADING_ENABLED) return;
    setSelected({ name: "BULLECOIN", mint: BULLE_MINT, imageUrl: "/bulle-logo.jpg" });
    setSide("BUY");
    setTab("trade");
  }

  const selectedTrend = [...movers, ...trends].find(item => item.tokenAddress === selected.mint);
  const selectedPrice = selected.mint === BULLE_MINT ? bulleMarket.priceUsd : selectedTrend?.priceUsd ?? null;
  const selectedMarketCap = selected.mint === BULLE_MINT ? bulleMarket.marketCapUsd : selectedTrend?.marketCap ?? null;
  const selectedVolume = selected.mint === BULLE_MINT ? bulleMarket.volume24hUsd : selectedTrend?.volume24h ?? null;

  return <section className={`arenaNewsPanel arenaMarketRoom bullHubRoom bullHubTerminal ${BULLE_TRADING_ENABLED?"":"bullHubPrelaunch"}`}>
    <header className="arenaNewsHeader bullHubHeader"><div><small>BULLECOIN // SOLANA MARKET TERMINAL</small><h2>BULL HUB</h2><p>Professional market intelligence and self-custody execution powered by Jupiter.</p></div><button className="bullHubConnect" onClick={()=>setHubWalletPicker(true)}><i />{walletAddress?`${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}`:"CONNECT WALLET"}<small>PHANTOM · SOLFLARE · BACKPACK</small></button></header>
    {BULLE_TRADING_ENABLED ? <div className="bullHubTicker"><button onClick={tradeBulle}><span className="bullHubTokenIcon"><img src="/bulle-logo.jpg" alt="BULLECOIN"/></span><strong>BULLE / SOL</strong><em>OFFICIAL</em></button><dl><div><dt>PRICE</dt><dd>{selectedPrice!==null?compactUsd(selectedPrice):"PENDING"}</dd></div><div><dt>MARKET CAP</dt><dd>{selectedMarketCap!==null?compactUsd(selectedMarketCap):"PENDING"}</dd></div><div><dt>24H VOLUME</dt><dd>{selectedVolume!==null?compactUsd(selectedVolume):"PENDING"}</dd></div><div><dt>NETWORK</dt><dd>SOLANA</dd></div></dl><button className="bullHubQuickBulle" onClick={tradeBulle}>BUY BULLE</button></div> : <div className="bullHubLaunchNotice"><span>OFFICIAL BULLE MARKET</span><b>TRADING OPENS AT LAUNCH</b><p>The official token and contract address remain hidden until launch. You can still explore markets and trade other Solana tokens through Jupiter.</p></div>}
    {tab === "trade" && <div className="bullHubTradeNav"><button onClick={()=>setTab("trending")}>← BACK TO 24H MARKETS</button><span>SELECTED MARKET · {selected.name}</span></div>}

    {tab === "trade" && <div className="bullHubTradeLayout bullHubDesk">
      <div className="bullHubSwapCard bullHubChartDesk">
        <div className="bullHubTradeBar"><div className="bullHubSelectedToken"><span className="bullHubTokenIcon"><TokenImage src={selected.imageUrl} name={selected.name}/></span><div><small>SELECTED TOKEN</small><strong>{selected.name}</strong><button onClick={() => void onCopy(selected.mint, "selected-mint")}>{copiedKey === "selected-mint" ? "CA COPIED" : short(selected.mint)}</button></div></div><div className="bullHubSide"><button className={side === "BUY" ? "buy active" : "buy"} onClick={() => setSide("BUY")}>BUY</button><button className={side === "SELL" ? "sell active" : "sell"} onClick={() => setSide("SELL")}>SELL</button></div></div>
        <div className="bullHubChart"><header><div><small>LIVE MARKET CHART</small><b>{selected.name}</b></div><a href={`https://dexscreener.com/solana/${selected.mint}`} target="_blank" rel="noreferrer">OPEN FULL CHART ↗</a></header><iframe key={selected.mint} title={`${selected.name} live chart`} src={`https://dexscreener.com/solana/${selected.mint}?embed=1&theme=dark&trades=0&info=0`} loading="lazy" /></div>
      </div>

      <aside className="bullHubOrderPanel">
        <header><div><small>JUPITER EXECUTION</small><h3>{side} {selected.name}</h3></div><button onClick={()=>setHubWalletPicker(true)}>{walletAddress?"CONNECTED":"CONNECT"}</button></header>
        <div className="bullHubWalletNotice"><span>◈</span><div><b>{walletAddress?`WALLET ${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}`:"CONNECT TO BEGIN"}</b><small>Every swap requires approval inside your wallet.</small></div></div>
        <div id="bulle-jupiter-terminal" className="bulleJupiterTerminal">{!scriptReady && <p>LOADING SECURE SWAP...</p>}</div>
        <p className="bullHubLegal">Powered by Jupiter. Token activity is not verification or financial advice. Always confirm the mint and transaction details in your wallet.</p>
      </aside>

      <article className="bullHubMovers bullHubMarkets"><header><div><small>LIVE SOLANA ACTIVITY</small><h3>MARKET MOVERS</h3></div><span>↻ AUTO · 60 SEC</span></header><div className="bullHubMarketRows"><button className="bullHubPinnedToken" onClick={tradeBulle}><i><img src="/bulle-logo.jpg" alt="BULLECOIN"/></i><span><b>BULLECOIN / SOL</b><small>MC {bulleMarket.marketCapUsd!==null?compactUsd(bulleMarket.marketCapUsd):"PENDING"} · VOL {bulleMarket.volume24hUsd!==null?compactUsd(bulleMarket.volume24hUsd):"PENDING"}</small><em>OFFICIAL TOKEN · {short(BULLE_MINT)}</em></span><strong>BUY BULLE</strong></button>{movers.slice(0,4).map(mover=><article className="bullHubMoverRow" key={mover.poolAddress}><i><TokenImage src={mover.imageUrl} name={mover.name}/></i><span><b>{mover.name}</b><small>MC {mover.marketCap?compactUsd(mover.marketCap):"N/A"} · VOL {compactUsd(mover.volume24h)}</small><em>{mover.activeWallets?.toLocaleString()||"—"} ACTIVE WALLETS · {short(mover.tokenAddress)}</em></span><div><strong className={mover.change24h>=0?"arenaTrendUp":"arenaTrendDown"}>{mover.change24h>=0?"+":""}{mover.change24h.toFixed(1)}%</strong><button onClick={()=>tradeToken(mover)}>TRADE</button></div></article>)}</div>{!movers.length&&<p>WAITING FOR LIVE MARKET DATA...</p>}</article>
      {trades.length > 0 && <article className="bullHubHistory bullHubRecent"><small>RECENT HUB SWAPS</small>{trades.slice(0, 3).map(trade => <p key={`${trade.txid}-${trade.time}`}><b>{trade.side} {trade.symbol}</b><span>{trade.txid.slice(0, 7)}...</span></p>)}</article>}
    </div>}

    {tab === "trending" && <div className="bullHubScreener"><div className="arenaSectionTitle arenaTrendTitle"><div><small>15 LIVE ONCHAIN MARKETS</small><h3>SOLANA · 24H TRENDING</h3></div><button className="bullHubRefresh" onClick={onRefresh}>↻ {loading ? "LOADING" : "REFRESH"}</button></div><div className="bullHubTable bullHubTableWide" role="table"><header role="row"><span>#</span><span>PAIR / TOKEN</span><span>PRICE</span><span>5M</span><span>1H</span><span>6H</span><span>24H</span><span>VOLUME</span><span>LIQUIDITY</span><span>MARKET CAP</span><span>BUYS</span><span>SELLS</span><span>ACTION</span></header><button className="bullHubTableRow bullHubOfficialRow" role="row" onClick={tradeBulle}><span>★</span><span><i><img src="/bulle-logo.jpg" alt=""/></i><b>BULLE / SOL<small>OFFICIAL · {short(BULLE_MINT)}</small></b></span><span>{bulleMarket.priceUsd!==null?compactUsd(bulleMarket.priceUsd):"PENDING"}</span><span>—</span><span>—</span><span>—</span><span className="arenaTrendUp">LIVE</span><span>{bulleMarket.volume24hUsd!==null?compactUsd(bulleMarket.volume24hUsd):"PENDING"}</span><span>—</span><span>{bulleMarket.marketCapUsd!==null?compactUsd(bulleMarket.marketCapUsd):"PENDING"}</span><span>—</span><span>—</span><span><strong>OPEN</strong></span></button>{trends.slice(0,14).map((trend,index)=><button className="bullHubTableRow" role="row" key={trend.poolAddress} onClick={()=>tradeToken(trend)}><span>{index+1}</span><span><i>{trend.imageUrl?<img src={trend.imageUrl} alt="" loading="lazy"/>:trend.name.slice(0,1)}</i><b>{trend.name}<small>{trend.dex.toUpperCase()} · {short(trend.tokenAddress)}</small></b></span><span>{compactUsd(trend.priceUsd)}</span><span className={(trend.change5m??0)>=0?"arenaTrendUp":"arenaTrendDown"}>{percent(trend.change5m)}</span><span className={(trend.change1h??0)>=0?"arenaTrendUp":"arenaTrendDown"}>{percent(trend.change1h)}</span><span className={(trend.change6h??0)>=0?"arenaTrendUp":"arenaTrendDown"}>{percent(trend.change6h)}</span><span className={trend.change24h>=0?"arenaTrendUp":"arenaTrendDown"}>{percent(trend.change24h)}</span><span>{compactUsd(trend.volume24h)}</span><span>{compactUsd(trend.liquidity)}</span><span>{trend.marketCap?compactUsd(trend.marketCap):"N/A"}</span><span className="arenaTrendUp">{trend.buys24h.toLocaleString()}</span><span className="arenaTrendDown">{trend.sells24h.toLocaleString()}</span><span><strong>OPEN</strong></span></button>)}{!loading&&!trends.length&&<p className="arenaEmptyData">NO SOLANA MARKET DATA AVAILABLE</p>}</div><p className="bullHubTableHelp">Select any row to open that market's live chart and Jupiter buy/sell panel. Always verify the contract address before signing.</p></div>}
    <footer className="arenaNewsFooter"><p>Market data updates automatically. Trending status is not endorsement. Verify every contract before trading.</p><span>JUPITER SWAP · WALLET APPROVAL</span></footer>
    <button className={`bullHubWalletFloat ${walletAddress?"connected":""}`} onClick={()=>setHubWalletPicker(true)}><i/><span><small>{walletAddress?"WALLET CONNECTED":"TRADE WITH YOUR WALLET"}</small><b>{walletAddress?`${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}`:"CONNECT WALLET"}</b></span></button>
    {hubWalletPicker&&<WalletPicker onClose={()=>setHubWalletPicker(false)} onConnected={(_,address)=>{localStorage.setItem("bulle-active-wallet",address);setWalletAddress(address);setHubWalletPicker(false)}} />}
  </section>;
}
