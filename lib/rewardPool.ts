export const BULLE_MINT = "EfMyYFLjPHR9nfnoJbaNdYPHv4Btzs96Q3ikxmRppump";
export const REWARD_TREASURY = "DHGJ1QA3Um7v2aAWFP6YafPYrXQHQC15SWKnxyY2AfjB";
export const REWARD_PAYER = "AWNsGEGg5bNFm9yb7mGaFnv8VwHXPp2LmK3Fc23UgoiK";
export const RP_PER_USD = 10_000;
export const DAILY_USD_LIMIT = 2;

type TokenAccountResponse={result?:{value?:Array<{account?:{data?:{parsed?:{info?:{tokenAmount?:{uiAmountString?:string;uiAmount?:number}}}}}}>} };
type DexPair={baseToken?:{address?:string};priceUsd?:string;liquidity?:{usd?:number}};

export async function readRewardPool(){
 const rpc=process.env.SOLANA_RPC_URL?.trim()||"https://api.mainnet-beta.solana.com";
 const [tokenResponse,solResponse,payerTokenResponse,payerSolResponse,priceResponse]=await Promise.all([
  fetch(rpc,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"getTokenAccountsByOwner",params:[REWARD_TREASURY,{mint:BULLE_MINT},{encoding:"jsonParsed"}]}),cache:"no-store"}),
  fetch(rpc,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:2,method:"getBalance",params:[REWARD_TREASURY]}),cache:"no-store"}),
  fetch(rpc,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:3,method:"getTokenAccountsByOwner",params:[REWARD_PAYER,{mint:BULLE_MINT},{encoding:"jsonParsed"}]}),cache:"no-store"}),
  fetch(rpc,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:4,method:"getBalance",params:[REWARD_PAYER]}),cache:"no-store"}),
  fetch(`https://api.dexscreener.com/tokens/v1/solana/${BULLE_MINT}`,{headers:{Accept:"application/json"},cache:"no-store"})
 ]);
 const tokenJson=await tokenResponse.json() as TokenAccountResponse;
 const solJson=await solResponse.json() as {result?:{value?:number}};
 const payerTokenJson=await payerTokenResponse.json() as TokenAccountResponse;
 const payerSolJson=await payerSolResponse.json() as {result?:{value?:number}};
 const pairs=priceResponse.ok?await priceResponse.json() as DexPair[]:[];
 const balanceBulle=(tokenJson.result?.value||[]).reduce((sum,item)=>sum+Number(item.account?.data?.parsed?.info?.tokenAmount?.uiAmountString??item.account?.data?.parsed?.info?.tokenAmount?.uiAmount??0),0);
 const best=(Array.isArray(pairs)?pairs:[]).filter(x=>x.baseToken?.address===BULLE_MINT).sort((a,b)=>(b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0];
 const priceUsd=Number(best?.priceUsd||0);
 const balanceSol=typeof solJson.result?.value==="number"?solJson.result.value/1e9:0;
 const payerBalanceBulle=(payerTokenJson.result?.value||[]).reduce((sum,item)=>sum+Number(item.account?.data?.parsed?.info?.tokenAmount?.uiAmountString??item.account?.data?.parsed?.info?.tokenAmount?.uiAmount??0),0);
 const payerBalanceSol=typeof payerSolJson.result?.value==="number"?payerSolJson.result.value/1e9:0;
 return {wallet:REWARD_TREASURY,mint:BULLE_MINT,balanceBulle,balanceSol,priceUsd,valueUsd:balanceBulle*priceUsd,funded:balanceBulle>0,payerWallet:REWARD_PAYER,payerBalanceBulle,payerBalanceSol,payerFunded:payerBalanceBulle>0&&payerBalanceSol>0,payoutEnabled:process.env.REWARD_PAYOUTS_ENABLED==="true",updatedAt:new Date().toISOString()};
}
