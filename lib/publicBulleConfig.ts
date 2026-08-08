export const BULLE_V1_MINT = "EfMyYFLjPHR9nfnoJbaNdYPHv4Btzs96Q3ikxmRppump";
export const PUBLIC_BULLE_MINT = process.env.NEXT_PUBLIC_BULLE_TOKEN_ADDRESS?.trim() || BULLE_V1_MINT;
export const PUBLIC_BULLE_VERSION = process.env.NEXT_PUBLIC_BULLE_TOKEN_VERSION?.trim().toUpperCase() || "V1";
export const PUBLIC_BULLE_MIGRATION_STATUS = process.env.NEXT_PUBLIC_BULLE_MIGRATION_STATUS?.trim().toLowerCase() || "v1";
export const PUBLIC_BULLE_PUMP_URL = process.env.NEXT_PUBLIC_BULLE_PUMP_URL?.trim() || `https://pump.fun/coin/${PUBLIC_BULLE_MINT}`;
export const PUBLIC_LAUNCH_MODE = process.env.NEXT_PUBLIC_LAUNCH_MODE?.trim().toLowerCase() || "countdown";
export const PUBLIC_LAUNCH_AT_UTC = process.env.NEXT_PUBLIC_LAUNCH_AT_UTC?.trim() || "2026-08-11T00:00:00Z";
