import type { CountryCode } from "libphonenumber-js";

/** Countries we ship to. Bangladesh first; the rest alphabetical. */
export const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: "BD", name: "Bangladesh" },
  ...([
    ["AE", "United Arab Emirates"], ["AU", "Australia"], ["BH", "Bahrain"], ["CA", "Canada"], ["DE", "Germany"],
    ["FR", "France"], ["GB", "United Kingdom"], ["IE", "Ireland"], ["IN", "India"], ["IT", "Italy"], ["JP", "Japan"],
    ["KW", "Kuwait"], ["MY", "Malaysia"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["OM", "Oman"], ["QA", "Qatar"],
    ["SA", "Saudi Arabia"], ["SE", "Sweden"], ["SG", "Singapore"], ["US", "United States"],
  ] as [CountryCode, string][]).map(([code, name]) => ({ code, name })),
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];
