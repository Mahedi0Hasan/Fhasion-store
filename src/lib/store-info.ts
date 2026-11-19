/**
 * Store contact details, read from environment variables so they're set per
 * deployment. Anything left unset is simply hidden on the site — we never
 * show placeholder phone numbers or addresses to customers.
 */
const env = (k: string) => process.env[k]?.trim() || undefined;

export const STORE = {
  name: "DEMO",
  email: env("NEXT_PUBLIC_STORE_EMAIL"),
  phone: env("NEXT_PUBLIC_STORE_PHONE"), // e.g. +8801712345678
  whatsapp: env("NEXT_PUBLIC_STORE_WHATSAPP"), // digits only, e.g. 8801712345678
  address: { en: env("NEXT_PUBLIC_STORE_ADDRESS_EN"), bn: env("NEXT_PUBLIC_STORE_ADDRESS_BN") },
  hours: { en: "Saturday to Thursday, 10am to 7pm (Bangladesh time)", bn: "শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে সন্ধ্যা ৭টা (বাংলাদেশ সময়)" },
  returnDays: 7,
  policiesUpdated: "2026-11-19",
};
