const SUPABASE_URL = "https://xkluvitzmftxhlmefckr.supabase.co"
const ANON_KEY     = "sb_publishable_KkOmSUSOUhnONxf1Vy6I_w_P5Hmv2Ys"

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screens = {
  loading: document.getElementById("screen-loading"),
  login:   document.getElementById("screen-login"),
  main:    document.getElementById("screen-main"),
  success: document.getElementById("screen-success"),
}

const $ = (id) => document.getElementById(id)

// ── Screen switching ──────────────────────────────────────────────────────────
function show(name) {
  Object.entries(screens).forEach(([k, el]) => {
    el.classList.toggle("hidden", k !== name)
  })
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
function authHeaders(token) {
  return {
    "apikey":        ANON_KEY,
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
  }
}

async function supabaseGet(path, token) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

async function supabasePost(path, body, token) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method:  "POST",
    headers: { ...authHeaders(token), "Prefer": "return=minimal" },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `POST ${path} → ${res.status}`)
  }
  // 204 No Content — nothing to parse
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Page data extraction (injected into active tab) ───────────────────────────
function extractPageData() {
  function meta(property) {
    const el =
      document.querySelector(`meta[property="${property}"]`) ||
      document.querySelector(`meta[name="${property}"]`)
    return el?.content?.trim() || ""
  }

  // JSON-LD — handles top-level object, array, and @graph
  let ldPrice = "", ldCurrency = "", ldImage = "", ldName = ""
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    outer: for (const s of scripts) {
      const d = JSON.parse(s.textContent)
      const items = Array.isArray(d) ? d : (d["@graph"] ? d["@graph"] : [d])
      for (const obj of items) {
        if (obj["@type"] === "Product") {
          ldName  = obj.name || ""
          ldImage = Array.isArray(obj.image) ? obj.image[0] : (obj.image || "")
          const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers
          if (offer) {
            ldPrice    = String(offer.price || "")
            ldCurrency = offer.priceCurrency || ""
          }
          break outer
        }
      }
    }
  } catch {}

  // Site-specific title selectors (Amazon, eBay, Shopify, WooCommerce)
  const specificTitle =
    document.querySelector("#productTitle")?.textContent?.trim() ||
    document.querySelector("h1[itemprop='name']")?.textContent?.trim() ||
    document.querySelector(".product_title")?.textContent?.trim() ||
    document.querySelector("h1.title")?.textContent?.trim() ||
    ""

  // Site-specific image selectors
  const amzImg = document.querySelector("#landingImage, #imgBlkFront")
  const specificImage =
    amzImg?.getAttribute("data-old-hires") ||
    amzImg?.src ||
    document.querySelector("[itemprop='image']")?.getAttribute("content") ||
    document.querySelector("[itemprop='image']")?.src ||
    ""

  const title =
    specificTitle ||
    ldName ||
    meta("og:title") ||
    meta("twitter:title") ||
    document.title

  const image =
    ldImage ||
    specificImage ||
    meta("og:image") ||
    meta("twitter:image") ||
    ""

  // Price
  let price = ldPrice
  let currency = ldCurrency
  if (!price) {
    const priceEl =
      document.querySelector('[itemprop="price"]') ||
      document.querySelector(".price") ||
      document.querySelector("[class*='price']")
    if (priceEl) {
      const raw = priceEl.getAttribute("content") || priceEl.textContent || ""
      const match = raw.match(/\d{1,6}[.,]\d{1,2}(?!\d)|\d{1,6}/)
      if (match) price = match[0].replace(",", ".")
    }
  }

  return {
    title:    title.slice(0, 200),
    image:    image.slice(0, 2000),
    price:    parseFloat(price) || "",
    currency: currency || "",
    url:      location.href,
  }
}

// ── Fetch wishlists and populate select ───────────────────────────────────────
async function loadWishlists(session) {
  const uid = session.user.id
  const rows = await supabaseGet(
    `/rest/v1/wishlists?user_id=eq.${uid}&select=id,title&order=created_at.desc`,
    session.access_token
  )

  const sel = $("wish-wishlist")
  sel.innerHTML = ""

  if (!rows.length) {
    sel.innerHTML = '<option value="">No wishlists yet</option>'
    $("btn-add").disabled = true
    return
  }

  rows.forEach((w) => {
    const opt = document.createElement("option")
    opt.value       = w.id
    opt.textContent = w.title
    sel.appendChild(opt)
  })

  $("btn-add").disabled = false
}

// ── Populate main screen with page data ───────────────────────────────────────
async function populateMainScreen(session) {
  // Inject extractor into active tab
  let pageData = null
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func:   extractPageData,
      })
      pageData = result?.result
    }
  } catch {
    // Can't inject (e.g., chrome:// page) — just leave fields blank
  }

  if (pageData) {
    if (pageData.title)  $("wish-title").value = pageData.title
    if (pageData.price)  $("wish-price").value = pageData.price

    // Currency
    if (pageData.currency) {
      const sel = $("wish-currency")
      const match = [...sel.options].find(
        (o) => o.value === pageData.currency
      )
      if (match) sel.value = pageData.currency
    }

    // Image preview
    if (pageData.image) {
      $("product-image").src = pageData.image
      $("image-wrap").classList.remove("hidden")
    }

    // Store URL for wish creation
    $("btn-add").dataset.url = pageData.url || ""
  }

  // Load wishlists
  try {
    await loadWishlists(session)
  } catch {
    showError("main-error", "Could not load wishlists. Are you online?")
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function showError(id, msg) {
  const el = $(id)
  el.textContent = msg
  el.classList.remove("hidden")
}

function clearError(id) {
  const el = $(id)
  el.textContent = ""
  el.classList.add("hidden")
}

// ── Google OAuth ──────────────────────────────────────────────────────────────
$("btn-google").addEventListener("click", async () => {
  const btn = $("btn-google")
  btn.disabled = true

  try {
    const redirectUrl = chrome.identity.getRedirectURL()
    const authUrl =
      `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
      `&redirect_to=${encodeURIComponent(redirectUrl)}`

    const responseUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        (url) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
          else resolve(url)
        }
      )
    })

    // Supabase returns tokens in the URL hash
    const hash = new URL(responseUrl).hash.slice(1)
    const params = new URLSearchParams(hash)

    const accessToken  = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const expiresAt    = params.get("expires_at")

    if (!accessToken) throw new Error("No access token in response")

    // Fetch the user object
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${accessToken}` },
    })
    const user = await userRes.json()

    const session = { access_token: accessToken, refresh_token: refreshToken, expires_at: Number(expiresAt), user }
    await chrome.storage.local.set({ session })

    show("loading")
    await populateMainScreen(session)
    show("main")
  } catch (err) {
    showError("login-error", err.message || "Google sign-in failed.")
  } finally {
    btn.disabled = false
  }
})

// ── Login ─────────────────────────────────────────────────────────────────────
$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault()
  clearError("login-error")

  const email    = $("login-email").value.trim()
  const password = $("login-password").value

  const btn = $("btn-login")
  btn.disabled    = true
  btn.textContent = "LOGGING IN…"

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method:  "POST",
        headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed")

    const session = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      user:          data.user,
    }
    await chrome.storage.local.set({ session })

    show("loading")
    await populateMainScreen(session)
    show("main")
  } catch (err) {
    showError("login-error", err.message)
  } finally {
    btn.disabled    = false
    btn.textContent = "LOG IN"
  }
})

// ── Logout ────────────────────────────────────────────────────────────────────
$("btn-logout").addEventListener("click", async () => {
  await chrome.storage.local.remove("session")
  $("wish-title").value = ""
  $("wish-price").value = ""
  $("product-image").src = ""
  $("image-wrap").classList.add("hidden")
  clearError("main-error")
  show("login")
})

// ── Add to wishlist ───────────────────────────────────────────────────────────
$("btn-add").addEventListener("click", async () => {
  clearError("main-error")

  const { session } = await chrome.storage.local.get("session")
  if (!session) { show("login"); return }

  const wishlistId = $("wish-wishlist").value
  if (!wishlistId) {
    showError("main-error", "Please select a wishlist.")
    return
  }

  const title = $("wish-title").value.trim()
  if (!title) {
    showError("main-error", "Please enter a title.")
    return
  }

  const priceRaw = $("wish-price").value
  const price    = priceRaw !== "" ? parseFloat(priceRaw) : null
  const currency = $("wish-currency").value
  const imageUrl = $("product-image").src || null
  const url      = $("btn-add").dataset.url || null

  const btn = $("btn-add")
  btn.disabled    = true
  btn.textContent = "ADDING…"

  try {
    await supabasePost(
      "/rest/v1/wishes",
      {
        wishlist_id: wishlistId,
        title,
        price:       price,
        currency:    price !== null ? currency : null,
        image_url:   imageUrl && imageUrl.startsWith("http") ? imageUrl : null,
        url,
      },
      session.access_token
    )

    // Show success screen
    const wishlistName = $("wish-wishlist").selectedOptions[0]?.text || ""
    $("success-wishlist-name").textContent = wishlistName
      ? `Added to "${wishlistName}"`
      : "Wish saved!"
    show("success")
  } catch (err) {
    showError("main-error", err.message || "Something went wrong.")
  } finally {
    btn.disabled    = false
    btn.textContent = "ADD TO WISHLIST"
  }
})

// ── Add another ───────────────────────────────────────────────────────────────
$("btn-add-another").addEventListener("click", async () => {
  clearError("main-error")
  show("loading")
  const { session } = await chrome.storage.local.get("session")
  if (!session) { show("login"); return }
  await populateMainScreen(session)
  show("main")
})

// ── Startup ───────────────────────────────────────────────────────────────────
;(async () => {
  show("loading")
  const { session } = await chrome.storage.local.get("session")

  if (!session?.access_token) {
    show("login")
    return
  }

  // Check if token is expired (with 60-second buffer)
  const expiresAt = session.expires_at * 1000
  if (Date.now() > expiresAt - 60_000) {
    // Try to refresh inline
    try {
      const res = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method:  "POST",
          headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
          body:    JSON.stringify({ refresh_token: session.refresh_token }),
        }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const refreshed = {
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    data.expires_at,
        user:          data.user,
      }
      await chrome.storage.local.set({ session: refreshed })
      await populateMainScreen(refreshed)
    } catch {
      await chrome.storage.local.remove("session")
      show("login")
      return
    }
  } else {
    await populateMainScreen(session)
  }

  show("main")
})()
