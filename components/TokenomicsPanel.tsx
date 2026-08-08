"use client";

import { useEffect, useState } from "react";
import { PUBLIC_BULLE_PUMP_URL, PUBLIC_LAUNCH_MODE } from "../lib/publicBulleConfig";

const TREASURY = "5Azx3Gby54UMrATmrUYGSa58evLKhgUgdmHuKAfFyqvg";
const PUMP_URL = PUBLIC_BULLE_PUMP_URL;
const TOKEN_LIVE = PUBLIC_LAUNCH_MODE === "live";
type TreasuryData = { treasurySol:number|null; treasuryBulle:number|null; treasuryValueUsd:number|null; rewardPoolSol:number; updatedAt:string };
const money=(value:number|null)=>value===null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value);
const amount=(value:number|null,digits=2)=>value===null?"—":value.toLocaleString("en-US",{maximumFractionDigits:digits});
const allocations=[
 {value:40,title:"TOKEN BUYBACKS",text:"Used to repurchase BULLE from the open market through documented treasury activity."},
 {value:30,title:"GIVEAWAYS & TOURNAMENTS",text:"Funds competitive Bear Smash seasons, tournament prizes and verified player rewards."},
 {value:20,title:"COMMUNITY GIVEAWAYS",text:"Reserved for holders, creators, missions and active community participation."},
 {value:5,title:"CREATOR",text:"Supports the creator responsible for operating and growing the BulleCoin ecosystem."},
 {value:5,title:"CHARACTER & PLATFORM",text:"Funds new Cyber Bull skins, game content, security, website improvements and updates."},
];

export default function TokenomicsPanel({onCopy,copied}:{onCopy:()=>void;copied:boolean}){
 const [data,setData]=useState<TreasuryData|null>(null);
 useEffect(()=>{const refresh=async()=>{try{const response=await fetch("/api/launch-data",{cache:"no-store"});if(response.ok)setData(await response.json() as TreasuryData)}catch{}};void refresh();const timer=window.setInterval(()=>void refresh(),30000);return()=>window.clearInterval(timer)},[]);
 return <section className={`arenaTokenomicsPanel tokenomicsLore ${TOKEN_LIVE?"":"tokenomicsPrelaunch"}`}>
  <div className="tokenomicsMotion" aria-hidden="true"><img src="/bulle-arena-hero.png" alt=""/><i/><i/></div>
  <header className="tokenomicsLoreHeader"><div><small>BULLECOIN // THE ARENA ECONOMY</small><h2>LORE &<br/><span>TOKENOMICS</span></h2><p>A community-powered game ecosystem built around the eternal market battle between bulls and bears.</p></div><div className="tokenomicsBullSeal"><img src="/bulle-logo.jpg" alt="BulleCoin emblem"/><b>THE CYBER BULL OF SOLANA</b></div></header>
  <div className="tokenomicsStoryGrid"><article><small>CHAPTER 01</small><h3>THE RISE OF CYBER BULL</h3><p>Cyber Bull was forged in the deepest blocks of Solana, where speed, conviction and community move faster than fear. He emerged to defend the Herd from manipulation, panic and the forces that profit from its division.</p></article><article><small>CHAPTER 02</small><h3>WHY THE BEAR IS HIS RIVAL</h3><p>The Bear represents fear, doubt and downward pressure. Every time the Bears invade the arena, they attempt to weaken the Herd and stop its momentum. Cyber Bull does not fight ordinary animals—he smashes the forces that turn confidence into panic.</p></article><article><small>CHAPTER 03</small><h3>BEAR SMASH</h3><p>Inside Bear Smash, every hit becomes progression. Players protect Cyber Bull, build combinations, unlock skins and evolve their equipment. Story Mode grows the fighter; Tournament Mode tests pure skill under equal conditions.</p></article><article><small>THE NEXT CHAPTER</small><h3>AN EVOLVING STORY</h3><p>The story never truly ends. New Bears, arenas, Bull skins, hammers and chapters can enter as the community expands. Existing profiles keep their level and progression when the next season arrives.</p></article></div>
  <div className="tokenomicsSectionTitle"><small>TRANSPARENT ALLOCATION</small><h3>HOW CREATOR FEES ARE USED</h3><p>Applied only to creator fees actually received from BULLE trading activity.</p></div>
  <div className="tokenomicsAllocationGrid">{allocations.map(item=><article key={item.title}><strong>{item.value}%</strong><h4>{item.title}</h4><p>{item.text}</p><span><i style={{width:`${item.value}%`}}/></span></article>)}</div>
  <div className="tokenomicsTreasury"><div className="tokenomicsTreasuryHero"><small>ON-CHAIN TRANSPARENCY</small><h3>TREASURY WALLET</h3><p>This temporary public treasury holds ecosystem funds while a dedicated treasury architecture is prepared.</p><code>{TREASURY}</code><div><a href={`https://solscan.io/account/${TREASURY}`} target="_blank" rel="noreferrer">VIEW ON SOLSCAN ↗</a><button onClick={()=>navigator.clipboard.writeText(TREASURY)}>COPY WALLET</button></div></div><div className="tokenomicsTreasuryStats"><span><small>ESTIMATED VALUE</small><b>{money(data?.treasuryValueUsd??null)}</b></span><span><small>SOL BALANCE</small><b>{amount(data?.treasurySol??null,4)} SOL</b></span><span><small>BULLE BALANCE</small><b>{amount(data?.treasuryBulle??null,0)} BULLE</b></span><span><small>TOURNAMENT ALLOCATION</small><b>{amount(data?.rewardPoolSol??0,4)} SOL</b></span><em><i/> LIVE ON SOLANA · REFRESHES EVERY 30 SEC</em></div></div>
  <div className="tokenomicsTournament"><article><small>COMPETITIVE ECONOMY</small><h3>TOURNAMENT REWARDS</h3><p>30% of verified creator fees is reserved for giveaways and competitive tournaments. Bear Smash rankings reward skill, while server validation protects the Herd from automated or manipulated scores.</p></article><article><small>PLAYER PROGRESSION</small><h3>70 / 30 POINT SPLIT</h3><p>70% of Story points power levels, skins and hammers. 30% become Reward Points. Redemption activates only when verified fees are available in the reward pool.</p></article><article><small>FEE VERIFICATION</small><h3>PUMP.FUN SOURCE</h3><p>Creator fee totals are published only after confirmation through the official Pump.fun creator dashboard. Treasury balances remain independently verifiable on Solana.</p>{TOKEN_LIVE?<a href={PUMP_URL} target="_blank" rel="noreferrer">VERIFY BULLE ON PUMP.FUN ↗</a>:<span className="tokenomicsLaunchPending">OFFICIAL TOKEN DETAILS AVAILABLE AT LAUNCH</span>}</article></div>
  <footer className="tokenomicsLoreFooter"><p>Tokenomics describes the intended allocation policy and does not guarantee revenue, rewards or token value. All distributions depend on fees actually received, eligibility and published competition rules.</p>{TOKEN_LIVE?<button type="button" onClick={onCopy}>{copied?"CONTRACT COPIED":"COPY OFFICIAL CA"}</button>:<button type="button" disabled>CA AVAILABLE AT LAUNCH</button>}</footer>
 </section>
}
