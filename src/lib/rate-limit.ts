const hits = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function checkRateLimit(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const timestamps = hits.get(key) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  const remaining = Math.max(0, maxRequests - valid.length);
  const resetIn = valid.length > 0 ? windowMs - (now - valid[0]) : 0;

  if (valid.length >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  valid.push(now);
  hits.set(key, valid);

  if (hits.size > 10000) {
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(k);
      else hits.set(k, fresh);
    }
  }

  return { allowed: true, remaining, resetIn };
}

export function rateLimitMiddleware(key: string, maxRequests = 60): { allowed: boolean; status: number; headers: Record<string, string> } {
  const result = checkRateLimit(key, maxRequests);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
  };

  if (!result.allowed) {
    return { allowed: false, status: 429, headers };
  }

  return { allowed: true, status: 200, headers };
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(
  request: Request,
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): Response | undefined {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`${key}:${ip}`, options?.maxRequests || 10, options?.windowMs || 60_000);

  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(options?.maxRequests || 10),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rl.resetIn / 1000)),
        "Retry-After": String(Math.ceil(rl.resetIn / 1000)),
      },
    });
  }

  return undefined;
}
