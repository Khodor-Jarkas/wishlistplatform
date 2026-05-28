/**
 * Currency codes available in the wish price selector.
 * Order: USD/EUR/GBP first (most common), then a curated set of major
 * regional currencies. Keep this list short enough to be scannable in
 * a dropdown — exotic currencies can be added on request.
 */
export const CURRENCIES = [
  // Reserve top — used most often
  "USD", "EUR", "GBP",

  // Other major Western
  "CHF", "CAD", "AUD", "NZD",

  // Asia / Pacific
  "JPY", "CNY", "HKD", "SGD", "KRW", "TWD",
  "INR", "IDR", "MYR", "THB", "PHP", "VND", "PKR", "BDT",

  // MENA / Levant
  "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "JOD",
  "EGP", "ILS", "TRY", "IRR", "IQD", "LYD", "TND", "MAD",
  "LBP",

  // Africa
  "ZAR", "NGN", "KES", "GHS", "ETB",

  // Latin America
  "MXN", "BRL", "ARS", "CLP", "COP", "PEN",

  // Northern + Eastern Europe
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON",

  // Other
  "RUB", "UAH",
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]
