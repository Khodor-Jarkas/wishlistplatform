/**
 * Resize + re-encode an image client-side before upload.
 *
 * Modern phone photos are 4-12MB; uploading them raw to Supabase Storage takes
 * 5-30s on mobile networks. Compressing to ~1280px JPEG @ 0.82 quality drops
 * a typical photo to ~300-500KB and uploads finish in under a second.
 *
 * Never throws — falls back to the original file on any error so an upload
 * always proceeds even if the browser can't decode the format (e.g. HEIC).
 *
 * Wrapped in an overall 20s timeout so even a hung canvas.toBlob (which iOS
 * Safari can do on large images under memory pressure) can't leave the UI
 * stuck in "Uploading…" forever.
 */
export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number; bypassUnder?: number } = {}
): Promise<{ blob: Blob; contentType: string; ext: string }> {
  const { maxDim = 1280, quality = 0.82, bypassUnder = 200_000 } = opts

  const passthrough = () => ({
    blob: file as Blob,
    contentType: file.type || "application/octet-stream",
    ext: extOf(file),
  })

  // Skip cases where compression isn't useful or would lose information.
  if (file.type === "image/gif" || file.type === "image/svg+xml" || file.size < bypassUnder) {
    return passthrough()
  }

  try {
    const result = await withTimeout(compressInternal(file, maxDim, quality), 20_000)
    if (!result) return passthrough()
    console.log(
      `[compressImage] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(result.blob.size)}`
    )
    return result
  } catch (e) {
    console.warn("[compressImage] failed, uploading original:", e)
    return passthrough()
  }
}

async function compressInternal(file: File, maxDim: number, quality: number) {
  const img = await loadImage(file)
  const canvas = document.createElement("canvas")
  const { width, height } = img
  const ratio = Math.min(1, maxDim / Math.max(width, height))
  canvas.width  = Math.max(1, Math.round(width  * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))

  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // canvas.toBlob can hang on large images on iOS Safari — race it with a
  // hard timeout so a hung encode doesn't block the whole compress step.
  const blob = await withTimeout(
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality)),
    12_000,
  )
  if (!blob) return null
  return { blob: blob as Blob, contentType: "image/jpeg", ext: "jpg" }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error("Image decode timed out (10s)"))
    }, 10_000)
    img.onload = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { clearTimeout(timeout); URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Step timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}

function extOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "bin"
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

/**
 * Wrap a Supabase storage upload with a hard timeout. Without this the
 * promise can hang indefinitely on slow/dropped mobile networks, leaving
 * the UI stuck in "uploading…" forever.
 *
 * 60s default — generous enough for a 4-5MB JPEG over a poor cellular
 * connection (compression failed or got bypassed), short enough to surface
 * a real error before the user gives up.
 */
export function withUploadTimeout<T>(promise: Promise<T>, ms = 60_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Upload timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}
