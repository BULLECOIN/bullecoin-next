"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
};

declare global {
  interface Window { solana?: PhantomProvider; }
}

type Score = { nickname: string; score: number; wallet: string; createdAt: string };
const SCORE_KEY = "bulle-runner-scores-v1";
const START_KEY = "bulle-runner-beta-start-v1";
const BETA_MS = 15 * 24 * 60 * 60 * 1000;

function shortWallet(value: string) { return `${value.slice(0,4)}...${value.slice(-4)}`; }
function remainingParts(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function BullRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const gameRef = useRef({ running:false, score:0, y:240, vy:0, speed:6, last:0, lastObstacle:0, obstacles:[] as {x:number;w:number;h:number;type:"bear"|"candle"}[] });
  const [status,setStatus] = useState<"ready"|"running"|"over">("ready");
  const [score,setScore] = useState(0);
  const [nickname,setNickname] = useState("CyberBull");
  const [wallet,setWallet] = useState("");
  const [message,setMessage] = useState("");
  const [scores,setScores] = useState<Score[]>([]);
  const [remaining,setRemaining] = useState(BETA_MS);

  useEffect(() => {
    const img = new Image(); img.src = "/bulle-logo.jpg"; imageRef.current = img;
    const saved = localStorage.getItem(SCORE_KEY);
    if (saved) { try { setScores(JSON.parse(saved) as Score[]); } catch {} }
    let start = Number(localStorage.getItem(START_KEY));
    if (!start) { start = Date.now(); localStorage.setItem(START_KEY,String(start)); }
    const end = start + BETA_MS;
    const tick = () => setRemaining(Math.max(0,end-Date.now()));
    tick(); const timer = window.setInterval(tick,1000);
    return () => window.clearInterval(timer);
  },[]);

  const topFive = useMemo(() => [...scores].sort((a,b)=>b.score-a.score).slice(0,5),[scores]);
  const countdown = remainingParts(remaining);

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const g = gameRef.current;
    const W=960,H=420,ground=330,bullX=110,bullSize=70;
    const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#020402"); bg.addColorStop(1,"#071407");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(141,255,47,.08)"; ctx.lineWidth=1;
    for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.fillStyle="rgba(141,255,47,.12)";ctx.fillRect(0,ground,W,H-ground);
    ctx.strokeStyle="#8dff2f";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(W,ground);ctx.stroke();
    g.obstacles.forEach(o=>{
      const y=ground-o.h;
      if(o.type==="bear") { ctx.fillStyle="#ff5656"; ctx.font="38px Arial"; ctx.fillText("🐻",o.x,y+38); }
      else { ctx.fillStyle="#ff5656"; ctx.fillRect(o.x+10,y,o.w-20,o.h); ctx.strokeStyle="#ff5656";ctx.beginPath();ctx.moveTo(o.x+o.w/2,y-10);ctx.lineTo(o.x+o.w/2,y+o.h+10);ctx.stroke(); }
    });
    ctx.shadowColor="#8dff2f";ctx.shadowBlur=26;
    const img=imageRef.current;
    if(img?.complete){ctx.save();ctx.beginPath();ctx.arc(bullX+bullSize/2,g.y+bullSize/2,bullSize/2,0,Math.PI*2);ctx.clip();ctx.drawImage(img,bullX,g.y,bullSize,bullSize);ctx.restore();}
    ctx.shadowBlur=0;ctx.fillStyle="#8dff2f";ctx.font="700 20px Arial";ctx.fillText(`SCORE ${Math.floor(g.score)}`,24,36);
    ctx.fillStyle="#9ba799";ctx.font="14px Arial";ctx.fillText("SPACE / CLICK / TAP TO JUMP",24,62);
  }

  function finish() {
    const finalScore=Math.floor(gameRef.current.score); gameRef.current.running=false; setScore(finalScore); setStatus("over");
    const entry:Score={nickname:nickname.trim()||"CyberBull",score:finalScore,wallet:wallet||"guest",createdAt:new Date().toISOString()};
    setScores(current=>{const next=[...current,entry].sort((a,b)=>b.score-a.score).slice(0,20);localStorage.setItem(SCORE_KEY,JSON.stringify(next));return next;});
  }

  function loop(time:number){
    const g=gameRef.current; if(!g.running){draw();return;}
    const dt=Math.min(32,time-(g.last||time));g.last=time;g.score+=dt*.018;g.speed=Math.min(15,6+g.score/450);
    g.vy+=.0024*dt;g.y+=g.vy*dt;if(g.y>=260){g.y=260;g.vy=0;}
    if(time-g.lastObstacle>Math.max(650,1450-g.speed*45)){const type=Math.random()>.5?"bear":"candle";g.obstacles.push({x:1000,w:type==="bear"?58:44,h:type==="bear"?58:80,type});g.lastObstacle=time;}
    g.obstacles.forEach(o=>o.x-=g.speed*(dt/16));g.obstacles=g.obstacles.filter(o=>o.x+o.w>-10);
    const hit=g.obstacles.some(o=>110<o.x+o.w&&165>o.x&&g.y+8<330&&g.y+62>330-o.h);
    setScore(Math.floor(g.score));draw();if(hit){finish();return;}animationRef.current=requestAnimationFrame(loop);
  }

  function startGame(){if(animationRef.current) cancelAnimationFrame(animationRef.current);gameRef.current={running:true,score:0,y:260,vy:0,speed:6,last:performance.now(),lastObstacle:performance.now(),obstacles:[]};setScore(0);setStatus("running");animationRef.current=requestAnimationFrame(loop);}
  function jump(){const g=gameRef.current;if(status==="running"&&g.y>=258)g.vy=-.82;}

  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump();}};window.addEventListener("keydown",key);draw();return()=>window.removeEventListener("keydown",key);});

  async function connectWallet(){const provider=window.solana;if(!provider?.isPhantom){setMessage("Phantom was not detected. Install or open Phantom.");return;}try{const result=await provider.connect();setWallet(result.publicKey.toString());setMessage("Wallet connected. No transaction was requested.");}catch{setMessage("Wallet connection was cancelled.");}}

  return <section className="runnerSection" id="bull-runner"><div className="contentWidth">
    <p className="sectionLabel">04 / BULL RUNNER BETA</p>
    <div className="runnerHeader"><div><h2>RUN.<span>SURVIVE. RANK.</span></h2><p>Jump over bears and red candles, build your score and climb the weekly ranking. The beta is free and no token purchase is required.</p></div>
      <div className="runnerCountdown"><small>FREE BETA ENDS IN</small>{[[countdown.days,"DAYS"],[countdown.hours,"HRS"],[countdown.minutes,"MIN"],[countdown.seconds,"SEC"]].map(([v,l])=><div key={String(l)}><strong>{v}</strong><span>{l}</span></div>)}</div>
    </div>
    <div className="runnerLayout"><div className="runnerGamePanel">
      <div className="runnerControls"><input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={18} placeholder="Nickname"/><button onClick={connectWallet}>{wallet?shortWallet(wallet):"CONNECT PHANTOM"}</button><button onClick={startGame}>{status==="running"?"RESTART":"PLAY NOW"}</button></div>
      <div className="runnerCanvasWrap" onClick={jump} onTouchStart={e=>{e.preventDefault();jump();}}><canvas ref={canvasRef} width={960} height={420}/>{status!=="running"&&<div className="runnerOverlay"><strong>{status==="over"?"RUN COMPLETE":"BULL RUNNER"}</strong><span>{status==="over"?`Score: ${score}`:"Press Play, then tap or press Space to jump"}</span><button onClick={startGame}>{status==="over"?"RUN AGAIN":"START RUN"}</button></div>}</div>
      <div className="runnerGameFooter"><span>Current score: {score}</span><span>{wallet?`Wallet: ${shortWallet(wallet)}`:"Guest mode active"}</span></div>{message&&<p className="runnerWalletMessage">{message}</p>}
    </div><aside className="runnerSidebar"><div className="runnerPrizeCard"><small>WEEKLY CREATOR FEES CHAMPIONSHIP</small><h3>TOP 5 SHARE 30%</h3><ol>{[["1ST","10%"],["2ND","7%"],["3RD","5.5%"],["4TH","4%"],["5TH","3.5%"]].map(([a,b])=><li key={a}><span>{a}</span><strong>{b}</strong></li>)}</ol><p>Rewards are calculated from creator fees actually received during the published weekly competition period.</p></div>
      <div className="runnerLeaderboard"><div className="runnerLeaderboardTitle"><strong>LOCAL TOP 5</strong><small>Official online ranking coming next</small></div>{topFive.length?<ol>{topFive.map((s,i)=><li key={s.createdAt+i}><span>#{i+1}</span><div><strong>{s.nickname}</strong><small>{s.wallet==="guest"?"Guest":shortWallet(s.wallet)}</small></div><b>{s.score}</b></li>)}</ol>:<p>No local scores yet. Start the first run.</p>}</div></aside></div>
    <div className="runnerRules"><strong>BETA RULES</strong><p>Free entry. No purchase is required. Connecting a wallet only identifies the player and future payout address; the beta never asks the player to sign a transaction. Official weekly prizes require a persistent online leaderboard, anti-cheat review, published eligibility rules and verified scores before payouts.</p></div>
  </div></section>;
}
