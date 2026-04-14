/**
 * Merge class names (lightweight — no clsx/cn dependency needed yet)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Format a price number to a locale-aware currency string.
 * e.g. formatPrice(49.99, "USD") → "$49.99"
 */
export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

/**
 * Compute avatar initials from profile fields.
 * Priority: first+last name → full_name → username → "?"
 */
export function getInitials(profile: {
  first_name?: string | null
  last_name?:  string | null
  full_name?:  string | null
  username?:   string | null
}): string {
  if (profile.first_name || profile.last_name) {
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean).join("").toUpperCase()
  }
  if (profile.full_name) {
    return profile.full_name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }
  return profile.username?.[0]?.toUpperCase() ?? "?"
}

/**
 * Return a human-readable "time ago" string from an ISO date.
 * e.g. "just now", "3 minutes ago", "2 days ago"
 */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * Generate a URL-safe slug from a string.
 * e.g. slugify("My Birthday 2025!") → "my-birthday-2025"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
