"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { BrowserWalletProvider, connectBrowserWallet, getProvider, isMobileBrowser, WalletName, walletBrowserUrl, walletInstallUrls } from "../lib/clientWallet";

const wallets: Array<{ name: WalletName; mark: string; tone: string }> = [
  { name: "Phantom", mark: "P", tone: "#a98bff" },
  { name: "Solflare", mark: "S", tone: "#ff9c38" },
  { name: "Backpack", mark: "B", tone: "#ff5b50" },
];

export default function WalletPicker({ onClose, onConnected }: { onClose: () => void; onConnected: (provider: BrowserWalletProvider, address: string) => void | Promise<void> }) {
  const [status, setStatus] = useState("");

  async function choose(name: WalletName) {
    if (!getProvider(name)) {
      if (isMobileBrowser()) {
        setStatus(`OPENING BULLECOIN INSIDE ${name.toUpperCase()}...`);
        window.location.href = walletBrowserUrl(name);
      } else {
        window.open(walletInstallUrls[name], "_blank", "noopener,noreferrer");
        setStatus(`${name.toUpperCase()} EXTENSION IS NOT INSTALLED`);
      }
      return;
    }
    try {
      setStatus(`CONNECTING ${name.toUpperCase()}...`);
      const result = await connectBrowserWallet(name);
      await onConnected(result.provider, result.address);
    } catch (error) {
      setStatus(error instanceof Error && /reject/i.test(error.message) ? "CONNECTION CANCELLED" : "CONNECTION FAILED");
    }
  }

  const mobile = isMobileBrowser();
  const installedCount = wallets.filter(wallet=>Boolean(getProvider(wallet.name))).length;
  if (typeof document === "undefined") return null;
  return createPortal(<div className="bulleWalletModal" role="dialog" aria-modal="true" aria-label="Connect a Solana wallet"><section><header><div><small>BULL HUB // SOLANA</small><h2>CONNECT WALLET</h2><p>{mobile?"Open BulleCoin inside your wallet browser, then connect and approve there.":"Choose an installed browser wallet. Every transaction still requires your approval."}</p><span className="bulleWalletDetected">{installedCount?`${installedCount} WALLET${installedCount>1?"S":""} DETECTED`:mobile?"CHOOSE AN APP":"NO EXTENSIONS DETECTED"}</span></div><button onClick={onClose}>×</button></header><div className="bulleWalletChoices">{wallets.map(wallet=>{const installed=Boolean(getProvider(wallet.name));const action=installed?"CONNECT":mobile?"OPEN APP ↗":"GET ↗";return <button key={wallet.name} onClick={()=>void choose(wallet.name)}><i style={{"--wallet-tone":wallet.tone} as React.CSSProperties}>{wallet.mark}</i><span><b>{wallet.name}</b><small>{installed?"READY TO CONNECT":mobile?"OPEN IN-APP BROWSER":"INSTALL EXTENSION"}</small></span><strong>{action}</strong></button>})}</div>{status&&<p className="bulleWalletStatus">{status}</p>}<footer>Compatible with Jupiter swaps. Bull Hub never requests a seed phrase or private key.</footer></section></div>,document.body);
}
