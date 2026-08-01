import { COUNTRIES } from "@/lib/countries";

export type Continent = "Afrique" | "Europe" | "Asie" | "Amérique" | "Océanie";

export const CONTINENT_BY_CODE: Record<string, Continent> = {
  MG: "Afrique", KM: "Afrique", ZA: "Afrique", NG: "Afrique", KE: "Afrique",
  SN: "Afrique", CI: "Afrique", CM: "Afrique", MA: "Afrique", TN: "Afrique",
  DZ: "Afrique", EG: "Afrique", GH: "Afrique", TZ: "Afrique", UG: "Afrique",
  CD: "Afrique", CG: "Afrique", GA: "Afrique", ML: "Afrique", BF: "Afrique",
  NE: "Afrique", TD: "Afrique", RW: "Afrique", MU: "Afrique", SC: "Afrique",
  FR: "Europe", DE: "Europe", GB: "Europe", BE: "Europe", CH: "Europe",
  IT: "Europe", ES: "Europe", PT: "Europe", RU: "Europe",
  JP: "Asie", CN: "Asie", IN: "Asie",
  US: "Amérique", CA: "Amérique", BR: "Amérique", AR: "Amérique", MX: "Amérique",
  AU: "Océanie",
};

export const CONTINENT_ORDER: Continent[] = ["Afrique", "Europe", "Asie", "Amérique", "Océanie"];

export interface RegionItem {
  code: string;
  name: string;
  flag: string;
  continent: Continent;
}

export const REGIONS: RegionItem[] = COUNTRIES.map((c) => ({
  code: c.code,
  name: c.name,
  flag: c.flag,
  continent: CONTINENT_BY_CODE[c.code] ?? "Afrique",
}));

/** Régions mises en avant au premier niveau. */
export const FEATURED_REGION_CODES = ["MG", "KM", "FR", "CA"];

export const FEATURED_REGIONS = FEATURED_REGION_CODES
  .map((code) => REGIONS.find((r) => r.code === code))
  .filter((r): r is RegionItem => Boolean(r));

export function groupByContinent(items: RegionItem[]) {
  return CONTINENT_ORDER
    .map((continent) => ({ continent, items: items.filter((i) => i.continent === continent) }))
    .filter((g) => g.items.length > 0);
}
