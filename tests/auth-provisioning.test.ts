import assert from "node:assert/strict";
import test from "node:test";

import type { ProvisionedApplicationUser } from "@/lib/auth/provisioning";
import {
  getAuthorProfileInput,
  provisionAuthenticatedUser,
  type AuthorProfileInput,
  type AuthorProvisioningStore,
} from "@/lib/auth/provisioning";

class MemoryProvisioningStore implements AuthorProvisioningStore {
  users = new Map<string, AuthorProfileInput>();
  roles = new Map<string, Set<string>>();

  async ensureAuthorProfile(input: AuthorProfileInput) {
    const existing = this.users.get(input.id);
    this.users.set(
      input.id,
      existing ? { ...existing, email: input.email } : input,
    );
    const roles = this.roles.get(input.id) ?? new Set<string>();
    roles.add("AUTHOR");
    this.roles.set(input.id, roles);
    const user = this.users.get(input.id)!;
    return {
      ...user,
      isActive: true,
      institution: null,
      department: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      globalRoles: [...roles].map((role) => ({
        id: role,
        userId: input.id,
        role,
        createdAt: new Date(),
      })),
      journalRoles: [],
    } as ProvisionedApplicationUser;
  }
}

const googleIdentity = {
  id: "870c7af3-5ab6-49cb-af35-78f1226ee3b9",
  email: "New.Author@Example.com",
  user_metadata: { full_name: "New Author", role: "SUPER_ADMIN" },
};

test("first Google login creates a User with basic Author access", async () => {
  const store = new MemoryProvisioningStore();
  const user = await provisionAuthenticatedUser(googleIdentity, store);

  assert.equal(store.users.size, 1);
  assert.equal(user.email, "new.author@example.com");
  assert.deepEqual(
    user.globalRoles.map(({ role }) => role),
    ["AUTHOR"],
  );
});

test("repeated Google login is idempotent and reuses the existing User", async () => {
  const store = new MemoryProvisioningStore();
  const first = await provisionAuthenticatedUser(googleIdentity, store);
  const second = await provisionAuthenticatedUser(googleIdentity, store);

  assert.equal(store.users.size, 1);
  assert.equal(store.roles.get(first.id)?.size, 1);
  assert.equal(second.id, first.id);
});

test("Google metadata never grants a privileged application role", async () => {
  const store = new MemoryProvisioningStore();
  const user = await provisionAuthenticatedUser(googleIdentity, store);
  const roles = user.globalRoles.map(({ role }) => role);

  assert(!roles.includes("SUPER_ADMIN"));
  assert.equal(user.journalRoles.length, 0);
});

test("trusted Google identity supplies normalized email and display name", () => {
  assert.deepEqual(getAuthorProfileInput(googleIdentity), {
    id: googleIdentity.id,
    email: "new.author@example.com",
    displayName: "New Author",
  });
});

test("break-glass email helper normalizes case, trims whitespace, and detects configured admins", async () => {
  const { getBreakGlassSuperAdminEmails, isBreakGlassSuperAdminEmail } =
    await import("@/lib/auth/provisioning");

  const originalEnv = process.env.BREAK_GLASS_SUPERADMIN_EMAILS;
  try {
    process.env.BREAK_GLASS_SUPERADMIN_EMAILS =
      "  Primary.BreakGlass@example.com, Second.Admin@Example.org  ";

    const emails = getBreakGlassSuperAdminEmails();
    assert.ok(emails.size >= 2);
    assert.equal(emails.has("primary.breakglass@example.com"), true);
    assert.equal(emails.has("second.admin@example.org"), true);

    assert.equal(
      isBreakGlassSuperAdminEmail(" PRIMARY.BREAKGLASS@EXAMPLE.COM "),
      true,
    );
    assert.equal(isBreakGlassSuperAdminEmail("second.admin@example.org"), true);
    assert.equal(isBreakGlassSuperAdminEmail("attacker@example.com"), false);
    assert.equal(isBreakGlassSuperAdminEmail(null), false);
    assert.equal(isBreakGlassSuperAdminEmail(""), false);
  } finally {
    process.env.BREAK_GLASS_SUPERADMIN_EMAILS = originalEnv;
  }
});

test("CAS Database Development Users: 5 accounts defined with initial minimal AUTHOR role", async () => {
  const { CAS_DATABASE_DEV_USERS, ensureCasDevUsersInDatabase } =
    await import("@/lib/auth/dev-database-users");

  assert.equal(CAS_DATABASE_DEV_USERS.length, 5);

  const expectedNames = [
    "Test Author One",
    "Test Author Two",
    "Test Editor One",
    "Test Editor Two",
    "Test User Five",
  ];
  const names = CAS_DATABASE_DEV_USERS.map((u) => u.displayName);
  assert.deepEqual(names, expectedNames);

  // Validate UUIDs and unique emails
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const emails = new Set<string>();

  for (const user of CAS_DATABASE_DEV_USERS) {
    assert.match(user.id, uuidRegex);
    assert.ok(user.email.endsWith("@cas.test"));
    assert.equal(emails.has(user.email), false);
    emails.add(user.email);
  }

  // Mock DB to verify idempotency and role preservation
  const mockUsers = new Map<
    string,
    { id: string; email: string; displayName: string; isActive: boolean }
  >();
  const mockGlobalRoles = new Map<string, { userId: string; role: string }>();

  const mockDb = {
    user: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: {
          id: string;
          email: string;
          displayName: string;
          isActive: boolean;
        };
        update: { email: string; displayName: string; isActive: boolean };
      }) => {
        const existing = mockUsers.get(where.id);
        const record = existing ? { ...existing, ...update } : { ...create };
        mockUsers.set(where.id, record);
        return record;
      },
    },
    userGlobalRole: {
      upsert: async ({
        where,
        create,
      }: {
        where: { userId_role: { userId: string; role: string } };
        create: { userId: string; role: string };
      }) => {
        const key = `${where.userId_role.userId}:${where.userId_role.role}`;
        const existing = mockGlobalRoles.get(key);
        if (!existing) {
          mockGlobalRoles.set(key, create);
        }
        return existing || create;
      },
    },
  };

  await ensureCasDevUsersInDatabase(mockDb);

  assert.equal(mockUsers.size, 5);
  for (const user of CAS_DATABASE_DEV_USERS) {
    const persisted = mockUsers.get(user.id);
    assert.ok(persisted);
    assert.equal(persisted.isActive, true);
    assert.equal(persisted.displayName, user.displayName);

    const roleKey = `${user.id}:AUTHOR`;
    assert.ok(mockGlobalRoles.has(roleKey));
  }
});
