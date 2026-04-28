// Shared SSRF-safe URL validation and fetch helpers for outbound webhooks.
// Blocks private/loopback/link-local IP ranges and non-http(s) schemes to
// prevent authenticated users from probing the function's internal network
// via user-supplied webhook URLs.

const PRIVATE_IPV4_PATTERNS: RegExp[] = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^192\.0\.2\./,
  /^198\.(1[89])\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^22[4-9]\./,
  /^23\d\./,
  /^24\d\./,
  /^25[0-5]\./,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata.goog",
]);

function isBlockedIPv4(ip: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((re) => re.test(ip));
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::" || lower === "0:0:0:0:0:0:0:1") return true;
  // Unique local fc00::/7
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // IPv4-mapped ::ffff:a.b.c.d
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped && isBlockedIPv4(mapped[1])) return true;
  return false;
}

export type SafeUrlResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

export function validateOutboundUrl(raw: string): SafeUrlResult {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only http(s) URLs are allowed" };
  }

  // Disallow embedded credentials
  if (url.username || url.password) {
    return { ok: false, error: "URLs with credentials are not allowed" };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".internal")) {
    return { ok: false, error: "Hostname is not allowed" };
  }

  // IPv4 literal
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isBlockedIPv4(host)) return { ok: false, error: "Private/reserved IP addresses are not allowed" };
  }

  // IPv6 literal
  if (host.includes(":")) {
    if (isBlockedIPv6(host)) return { ok: false, error: "Private/reserved IPv6 addresses are not allowed" };
  }

  return { ok: true, url };
}

export async function safeFetch(
  raw: string,
  init: RequestInit & { timeoutMs?: number; maxBodyBytes?: number } = {},
): Promise<{ status: number; bodyText: string }> {
  const validated = validateOutboundUrl(raw);
  if (!validated.ok) throw new Error(validated.error);

  const { timeoutMs = 8000, maxBodyBytes = 64 * 1024, ...rest } = init;

  const r = await fetch(validated.url.toString(), {
    ...rest,
    redirect: "manual", // prevent redirect-based SSRF bypass
    signal: AbortSignal.timeout(timeoutMs),
  });

  // Reject redirects to internal targets
  if (r.status >= 300 && r.status < 400) {
    await r.body?.cancel();
    throw new Error(`Redirects are not followed (got ${r.status})`);
  }

  // Cap body size
  const reader = r.body?.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBodyBytes) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c.subarray(0, Math.min(c.byteLength, maxBodyBytes - offset)), offset);
    offset += c.byteLength;
    if (offset >= maxBodyBytes) break;
  }
  const bodyText = new TextDecoder().decode(merged);
  return { status: r.status, bodyText };
}
