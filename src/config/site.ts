/**
 * Site-wide metadata — edit this file to change what Discord, Slack,
 * Twitter/X, iMessage, and other link-preview tools show when someone
 * shares a Wish It URL.
 *
 * After editing, redeploy (git push) for the changes to take effect.
 */

export const siteConfig = {
  name: "Wish It",
  tagline: "All your wishes in one place.",
  description:
    "Wish It makes it easy to save and share your wishlists with friends and family.",

  /** Canonical URL of the deployed site (no trailing slash). */
  url: "https://wish-it-nine.vercel.app",

  /**
   * The image shown in link previews.
   * Recommended size: 1200 × 630 px, < 8 MB.
   * Place the file in /public and reference it as "/your-image.png",
   * or use an absolute https:// URL to an externally hosted image.
   */
  ogImage: "/og.png",

  /** Shown as the Twitter/X card author tag (@handle). Optional. */
  twitterHandle: undefined as string | undefined,
}
