import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TrendPool = {
  id?: string;
  attributes?: {
    address?: string;
    name?: string;
    base_token_price_usd?: string;
    market_cap_usd?: string | null;
    fdv_usd?: string | null;
    reserve_in_usd?: string;
    volume_usd?: { h24?: string };
    price_change_percentage?: { m5?: string; h1?: string; h6?: string; h24?: string };
    transactions?: { h24?: { buys?: number; sells?: number; buyers?: number; sellers?: number } };
  };
  relationships?: { base_token?: { data?: { id?: string } }; dex?: { data?: { id?: string } } };
};

type IncludedToken = {
  id?: string;
  attributes?: { image_url?: string | null };
};

function decodeXml(value = "") {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decodeXml(block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1]);
}

function parseNews(xml: string) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1];
    const image = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ?? "";
    return {
      title: readTag(block, "title"),
      url: readTag(block, "link"),
      summary: readTag(block, "description").slice(0, 260),
      author: readTag(block, "dc:creator") || "CoinDesk",
      publishedAt: new Date(readTag(block, "pubDate")).toISOString(),
      image: decodeXml(image),
      source: "CoinDesk",
    };
  }).filter((item) => item.title && item.url);

  const relevant = items.filter((item) => /solana|memecoin|meme coin|pump\.fun|bitcoin|\bbtc\b/i.test(`${item.title} ${item.summary}`));
  return [...relevant, ...items.filter((item) => !relevant.includes(item))].slice(0, 4);
}

export async function GET() {
  const [newsResult, trendsResult] = await Promise.allSettled([
    fetch("https://www.coindesk.com/arc/outboundfeeds/rss/", { next: { revalidate: 300 }, headers: { Accept: "application/rss+xml, application/xml" } }),
    fetch("https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1&include=base_token", { next: { revalidate: 60 }, headers: { Accept: "application/json" } }),
  ]);

  let news: ReturnType<typeof parseNews> = [];
  let trends: Array<Record<string, string | number | null>> = [];
  let movers: Array<Record<string, string | number | null>> = [];

  if (newsResult.status === "fulfilled" && newsResult.value.ok) {
    news = parseNews(await newsResult.value.text());
  }

  if (trendsResult.status === "fulfilled" && trendsResult.value.ok) {
    const payload = await trendsResult.value.json() as { data?: TrendPool[]; included?: IncludedToken[] };
    const tokenImages = new Map((payload.included ?? []).map((token) => [token.id ?? "", token.attributes?.image_url ?? ""]));
    const pools = (payload.data ?? []).map((pool) => {
      const attributes = pool.attributes ?? {};
      const liquidity = Number(attributes.reserve_in_usd ?? 0);
      const tokenId = pool.relationships?.base_token?.data?.id ?? "";
      const address = attributes.address ?? pool.id?.replace(/^solana_/, "") ?? "";
      return {
        name: attributes.name ?? "Unknown / SOL",
        tokenAddress: tokenId.replace(/^solana_/, ""),
        imageUrl: tokenImages.get(tokenId) || "",
        poolAddress: address,
        dex: pool.relationships?.dex?.data?.id ?? "Solana DEX",
        priceUsd: Number(attributes.base_token_price_usd ?? 0),
        change5m: Number(attributes.price_change_percentage?.m5 ?? 0),
        change1h: Number(attributes.price_change_percentage?.h1 ?? 0),
        change6h: Number(attributes.price_change_percentage?.h6 ?? 0),
        change24h: Number(attributes.price_change_percentage?.h24 ?? 0),
        volume24h: Number(attributes.volume_usd?.h24 ?? 0),
        liquidity,
        marketCap: Number(attributes.market_cap_usd ?? attributes.fdv_usd ?? 0) || null,
        buys24h: attributes.transactions?.h24?.buys ?? 0,
        sells24h: attributes.transactions?.h24?.sells ?? 0,
        activeWallets: (attributes.transactions?.h24?.buyers ?? 0) + (attributes.transactions?.h24?.sellers ?? 0),
        url: `https://www.geckoterminal.com/solana/pools/${address}`,
      };
    });
    const safer = pools.filter((pool) => pool.liquidity >= 25000);
    trends = [...safer, ...pools.filter((pool) => !safer.includes(pool)).sort((a, b) => b.liquidity - a.liquidity)].slice(0, 14);
    const pumpPools = pools.filter((pool) => pool.tokenAddress.toLowerCase().endsWith("pump"));
    movers = pumpPools
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 8);
  }

  return NextResponse.json({ news, trends, movers, updatedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
