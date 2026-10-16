import { getSafeLoginReturnPath } from "@/lib/auth/submission-entry";

export function getApplicationUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) throw new Error("NEXT_PUBLIC_APP_URL is required.");

  const url = new URL(configured);
  if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP or HTTPS.");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

export function getOAuthCallbackUrl(
  returnTo: unknown,
  originOverride?: string | null,
) {
  let base: URL;

  if (originOverride) {
    try {
      const parsed = new URL(originOverride);
      const isLocal =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      const appUrl = getApplicationUrl();
      const isConfiguredHost = parsed.host === appUrl.host;

      if (
        (isLocal || isConfiguredHost) &&
        (parsed.protocol === "http:" || parsed.protocol === "https:")
      ) {
        parsed.pathname = "/";
        parsed.search = "";
        parsed.hash = "";
        base = parsed;
      } else {
        base = appUrl;
      }
    } catch {
      base = getApplicationUrl();
    }
  } else {
    base = getApplicationUrl();
  }

  const callback = new URL("/auth/callback", base);
  const safeReturn = getSafeLoginReturnPath(returnTo);
  if (safeReturn) callback.searchParams.set("next", safeReturn);
  return callback.toString();
}
