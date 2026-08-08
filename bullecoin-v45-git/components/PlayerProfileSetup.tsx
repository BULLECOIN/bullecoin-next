"use client";

import { useState } from "react";

export type LocalPlayerProfile = { wallet: string; username: string; createdAt: string };

export const profileKey = (wallet: string) => `bulle-player-profile:${wallet}`;
export function readLocalProfile(wallet: string): LocalPlayerProfile | null {
  try { return JSON.parse(localStorage.getItem(profileKey(wallet)) || "null") as LocalPlayerProfile | null; } catch { return null; }
}

export default function PlayerProfileSetup({ wallet, onSaved, onClose }: { wallet: string; onSaved: (profile: LocalPlayerProfile) => void; onClose?: () => void }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  function save() {
    const clean = username.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(clean)) { setError("USE 3–16 LETTERS, NUMBERS OR UNDERSCORES"); return; }
    const profile = { wallet, username: clean, createdAt: new Date().toISOString() };
    localStorage.setItem(profileKey(wallet), JSON.stringify(profile));
    onSaved(profile);
  }
  return <div className="bulleProfileModal" role="dialog" aria-modal="true" aria-label="Create fighter profile"><section><header><div><small>BULLE // PLAYER IDENTITY</small><h2>CREATE YOUR FIGHTER</h2><p>Choose the username that will appear in the arena and rankings.</p></div>{onClose&&<button onClick={onClose}>×</button>}</header><label>USERNAME<input autoFocus value={username} maxLength={16} placeholder="CyberBull" onChange={event=>setUsername(event.target.value.replace(/\s/g,""))}/></label><div className="bulleProfileWallet"><small>CONNECTED WALLET</small><b>{wallet.slice(0,5)}...{wallet.slice(-5)}</b></div>{error&&<p>{error}</p>}<button className="bulleProfileSave" onClick={save}>ENTER THE HERD</button><footer>This beta profile is stored on this device. Wallet-verified cloud profiles activate with the rewards server.</footer></section></div>;
}
