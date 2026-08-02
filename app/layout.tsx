import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bullecoin.io"),
  title: "BULLE — The Cyber Bull of Solana",
  description: "BULLE is a community-first Web3 brand built for the Solana ecosystem. Stronger Community. Stronger Future.",
  openGraph: {
    title: "BULLE — The Cyber Bull of Solana",
    description: "Stronger Community. Stronger Future.",
    url: "https://bullecoin.io",
    siteName: "BULLE",
    images: [{ url: "/bulle-logo.jpg", width: 1024, height: 1024, alt: "BULLE official logo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BULLE — The Cyber Bull of Solana",
    description: "Stronger Community. Stronger Future.",
    images: ["/bulle-logo.jpg"],
  },
  icons: { icon: "/bulle-logo.jpg", apple: "/bulle-logo.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable}`}>{children}</body>
    </html>
  );
}
