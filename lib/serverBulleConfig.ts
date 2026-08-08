import { BULLE_V1_MINT } from "./publicBulleConfig";

export const SERVER_BULLE_MINT = process.env.BULLE_TOKEN_MINT?.trim() || process.env.BULLE_TOKEN_ADDRESS?.trim() || process.env.NEXT_PUBLIC_BULLE_TOKEN_ADDRESS?.trim() || BULLE_V1_MINT;
export const SERVER_BULLE_MIGRATION_STATUS = process.env.BULLE_MIGRATION_STATUS?.trim().toLowerCase() || process.env.NEXT_PUBLIC_BULLE_MIGRATION_STATUS?.trim().toLowerCase() || "v1";
export const REWARDS_MIGRATION_LOCKED = SERVER_BULLE_MIGRATION_STATUS === "prelaunch";
