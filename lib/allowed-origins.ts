// Allowed origins are configured via the `ALLOWED_ORIGINS` env var as a
// comma-separated list of full URLs, e.g.:
//   ALLOWED_ORIGINS=https://shoptimity.com,https://www.shoptimity.com,http://localhost:3000
//
// `NEXT_PUBLIC_APP_URL` and `AUTH_BASE_URL` are also implicitly trusted so a
// minimal deployment only needs those two set. Used by:
//   - lib/auth.ts (better-auth `trustedOrigins`)
//   - app/api/checkout/route.ts (cross-origin POST guard)

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

function collectRawOrigins(): string[] {
  const sources = [
    process.env.ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_BASE_URL,
  ]
  const out: string[] = []
  for (const src of sources) {
    if (!src) continue
    for (const part of src.split(",")) {
      const trimmed = part.trim()
      if (trimmed) out.push(trimmed)
    }
  }
  return out
}

let cachedUrls: string[] | null = null
let cachedHosts: Set<string> | null = null

function compute(): { urls: string[]; hosts: Set<string> } {
  const urls = new Set<string>()
  const hosts = new Set<string>()
  for (const raw of collectRawOrigins()) {
    const url = parseUrl(raw)
    if (!url) continue
    urls.add(`${url.protocol}//${url.host}`)
    hosts.add(url.host)
  }
  return { urls: Array.from(urls), hosts }
}

export function getAllowedOriginUrls(): string[] {
  if (cachedUrls === null) {
    const { urls, hosts } = compute()
    cachedUrls = urls
    cachedHosts = hosts
  }
  return cachedUrls
}

export function getAllowedOriginHosts(): Set<string> {
  if (cachedHosts === null) {
    const { urls, hosts } = compute()
    cachedUrls = urls
    cachedHosts = hosts
  }
  return cachedHosts
}
