/**
 * Database Operation Safety Guards
 *
 * Prevents catastrophic data loss caused by destructive operations
 * (such as unconditional .deleteMany({})) executing against shared
 * or production database environments.
 */

export function isHostedOrProductionDatabase(url?: string): boolean {
  const dbUrl = url || process.env.DATABASE_URL || "";
  if (!dbUrl) return false;

  try {
    const parsed = new URL(dbUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Check known cloud hosted providers
    if (
      hostname.includes("supabase.com") ||
      hostname.includes("pooler.supabase") ||
      hostname.includes("imsufoss.com") ||
      hostname.includes("neon.tech") ||
      hostname.includes("cockroachlabs.cloud") ||
      hostname.includes("render.com") ||
      hostname.includes("railway.app")
    ) {
      return true;
    }

    // If hostname is not local loopback
    if (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      hostname !== "::1"
    ) {
      return true;
    }

    return false;
  } catch {
    // If URL cannot be parsed safely, treat as potentially dangerous
    return true;
  }
}

export function assertSafeDatabaseForDestructiveOps(
  operationName: string,
  explicitDbUrl?: string,
): void {
  const isHosted = isHostedOrProductionDatabase(explicitDbUrl);

  if (isHosted && process.env.ALLOW_DESTRUCTIVE_DB_RESETS !== "true") {
    const dbUrl = explicitDbUrl || process.env.DATABASE_URL || "";
    let safeHost = "unknown";
    try {
      safeHost = new URL(dbUrl).hostname;
    } catch {
      // ignore parse failure
    }

    throw new Error(
      `[CRITICAL DATABASE SAFETY GUARD] Blocked destructive operation "${operationName}". ` +
        `The current database environment appears to be hosted/shared (${safeHost}). ` +
        `Unconditional bulk deletes are forbidden to prevent production data loss. ` +
        `If you intentionally wish to reset a test database, explicitly set ALLOW_DESTRUCTIVE_DB_RESETS="true".`,
    );
  }
}
