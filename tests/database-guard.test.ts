import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeDatabaseForDestructiveOps,
  isHostedOrProductionDatabase,
} from "@/lib/db/guard";

test("Database Guard: Detects hosted and production database connection strings", () => {
  // Hosted providers
  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://postgres:pass@db.pcscnigceelxlnssuivc.supabase.co:5432/postgres",
    ),
    true,
    "Must detect direct Supabase URL",
  );

  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://postgres.pcscnigceelxlnssuivc:pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
    ),
    true,
    "Must detect Supabase Session Pooler",
  );

  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://user:pass@ep-cool-fog-1234.eu-central-1.aws.neon.tech/neondb",
    ),
    true,
    "Must detect Neon database",
  );

  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://user:pass@production-db.imsufoss.com:5432/imsu",
    ),
    true,
    "Must detect imsufoss.com domain",
  );

  // Local loopback URLs
  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://user:pass@localhost:5432/local_test",
    ),
    false,
    "Localhost should not be flagged as hosted production",
  );

  assert.equal(
    isHostedOrProductionDatabase(
      "postgresql://user:pass@127.0.0.1:5432/local_test",
    ),
    false,
    "127.0.0.1 should not be flagged as hosted production",
  );
});

test("Database Guard: Blocks destructive operations against hosted databases", () => {
  const hostedUrl =
    "postgresql://postgres.tenant:secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

  const originalEnv = process.env.ALLOW_DESTRUCTIVE_DB_RESETS;
  delete process.env.ALLOW_DESTRUCTIVE_DB_RESETS;

  try {
    // Should throw with clear critical error
    assert.throws(
      () => {
        assertSafeDatabaseForDestructiveOps("testDestructiveReset", hostedUrl);
      },
      /CRITICAL DATABASE SAFETY GUARD/,
      "Must throw safety guard error when attempting destructive op on hosted database",
    );

    // When explicitly overridden with ALLOW_DESTRUCTIVE_DB_RESETS="true"
    process.env.ALLOW_DESTRUCTIVE_DB_RESETS = "true";
    assert.doesNotThrow(() => {
      assertSafeDatabaseForDestructiveOps("testDestructiveReset", hostedUrl);
    }, "Must allow operation when ALLOW_DESTRUCTIVE_DB_RESETS is explicitly set to true");
  } finally {
    if (originalEnv !== undefined) {
      process.env.ALLOW_DESTRUCTIVE_DB_RESETS = originalEnv;
    } else {
      delete process.env.ALLOW_DESTRUCTIVE_DB_RESETS;
    }
  }
});
