import en from "./en.json";
import th from "./th.json";

export const translations = { th, en } as const;
export type Translation = typeof th;
