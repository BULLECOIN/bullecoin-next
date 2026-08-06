export type BrowserWalletProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toString: () => string };
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage?: (message: Uint8Array, display?: string) => Promise<Uint8Array | { signature: Uint8Array }>;
  signAndSendTransaction: (transaction: unknown) => Promise<{ signature: string }>;
};

export type WalletName = "Phantom" | "Solflare" | "Backpack";

let activeProvider: BrowserWalletProvider | null = null;

function walletWindow() {
  return window as typeof window & {
    solana?: BrowserWalletProvider;
    phantom?: { solana?: BrowserWalletProvider };
    solflare?: BrowserWalletProvider;
    backpack?: BrowserWalletProvider;
  };
}

export function getProvider(name: WalletName) {
  const current = walletWindow();
  if (name === "Phantom") return current.phantom?.solana ?? (current.solana?.isPhantom ? current.solana : undefined);
  if (name === "Solflare") return current.solflare ?? (current.solana?.isSolflare ? current.solana : undefined);
  return current.backpack ?? (current.solana?.isBackpack ? current.solana : undefined);
}

export function getActiveProvider() {
  return activeProvider;
}

export async function connectBrowserWallet(name: WalletName) {
  const provider = getProvider(name);
  if (!provider) throw new Error(`${name} is not installed`);
  const response = await provider.connect();
  activeProvider = provider;
  return { provider, address: response.publicKey.toString() };
}

export function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function walletBrowserUrl(name: WalletName, targetUrl?: string) {
  const page = targetUrl || (typeof window !== "undefined" ? window.location.href : "https://bullecoin.io");
  const encodedPage = encodeURIComponent(page);
  const ref = encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "https://bullecoin.io");
  if (name === "Phantom") return `https://phantom.app/ul/browse/${encodedPage}?ref=${ref}`;
  if (name === "Solflare") return `https://solflare.com/ul/v1/browse/${encodedPage}?ref=${ref}`;
  return `https://backpack.app/ul/v1/browse/${encodedPage}?ref=${ref}`;
}

export const walletInstallUrls: Record<WalletName, string> = {
  Phantom: "https://phantom.app/download",
  Solflare: "https://www.solflare.com/download",
  Backpack: "https://backpack.app/download",
};
