import { GlobalRole, JournalRole } from "@prisma/client";

export const DEV_IDENTITY_COOKIE_NAME = "cas_dev_identity";

export type DevIdentityKey =
  | "test-author-one"
  | "test-author-two"
  | "test-editor-one"
  | "test-editor-two"
  | "test-user-five"
  | "author-one"
  | "author-two"
  | "editor-one"
  | "editor-two"
  | "admin-izu";

const izuJournalData = {
  id: "cmve0lnmo0005p3v16c6jlw7b",
  slug: "izu",
  name: "Izu: Journal of Critical Perspectives",
  shortName: "IZU",
  isActive: true,
  department: {
    id: "cmve0lnf30004p3v16192x6j0",
    slug: "izu-dept",
    name: "Critical Perspectives",
    isActive: true,
  },
};

export const IZU_DEV_IDENTITIES = {
  "author-one": {
    key: "author-one" as DevIdentityKey,
    id: "00000000-0000-4000-a000-000000000001",
    email: "author.one@izu.test",
    displayName: "Author One",
    description: "Submitting author for Izu journal workflow testing",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Critical Perspectives",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-dev-auth-1",
        userId: "00000000-0000-4000-a000-000000000001",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "author-two": {
    key: "author-two" as DevIdentityKey,
    id: "00000000-0000-4000-a000-000000000002",
    email: "author.two@izu.test",
    displayName: "Author Two",
    description: "Independent second author for cross-author isolation testing",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Critical Perspectives",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-dev-auth-2",
        userId: "00000000-0000-4000-a000-000000000002",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "editor-one": {
    key: "editor-one" as DevIdentityKey,
    id: "00000000-0000-4000-a000-000000000003",
    email: "editor.one@izu.test",
    displayName: "Editor One",
    description: "Peer reviewer / editor scoped strictly to Izu",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Critical Perspectives",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-dev-ed-1",
        userId: "00000000-0000-4000-a000-000000000003",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [
      {
        id: "jr-dev-ed-1",
        userId: "00000000-0000-4000-a000-000000000003",
        journalId: izuJournalData.id,
        role: JournalRole.EDITOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        journal: izuJournalData,
      },
    ],
  },
  "editor-two": {
    key: "editor-two" as DevIdentityKey,
    id: "00000000-0000-4000-a000-000000000004",
    email: "editor.two@izu.test",
    displayName: "Editor Two",
    description: "Second peer reviewer / editor scoped strictly to Izu",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Critical Perspectives",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-dev-ed-2",
        userId: "00000000-0000-4000-a000-000000000004",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [
      {
        id: "jr-dev-ed-2",
        userId: "00000000-0000-4000-a000-000000000004",
        journalId: izuJournalData.id,
        role: JournalRole.EDITOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        journal: izuJournalData,
      },
    ],
  },
  "admin-izu": {
    key: "admin-izu" as DevIdentityKey,
    id: "00000000-0000-4000-a000-000000000005",
    email: "admin@izu.test",
    displayName: "Izu Journal Administrator",
    description:
      "Journal administrator scoped to Izu (no platform Super Admin)",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Critical Perspectives",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-dev-adm-1",
        userId: "00000000-0000-4000-a000-000000000005",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [
      {
        id: "jr-dev-adm-1",
        userId: "00000000-0000-4000-a000-000000000005",
        journalId: izuJournalData.id,
        role: JournalRole.JOURNAL_ADMIN,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        journal: izuJournalData,
      },
    ],
  },
};

export const CAS_DEV_IDENTITIES = {
  "test-author-one": {
    key: "test-author-one" as DevIdentityKey,
    id: "00000000-0000-4000-d000-000000000001",
    email: "test.author.one@cas.test",
    displayName: "Test Author One",
    description: "Primary testing author for manuscript submission and queries",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Social Sciences",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-test-auth-1",
        userId: "00000000-0000-4000-d000-000000000001",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "test-author-two": {
    key: "test-author-two" as DevIdentityKey,
    id: "00000000-0000-4000-d000-000000000002",
    email: "test.author.two@cas.test",
    displayName: "Test Author Two",
    description:
      "Independent second author for isolation and multi-author workflows",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Social Sciences",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-test-auth-2",
        userId: "00000000-0000-4000-d000-000000000002",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "test-editor-one": {
    key: "test-editor-one" as DevIdentityKey,
    id: "00000000-0000-4000-d000-000000000003",
    email: "test.editor.one@cas.test",
    displayName: "Test Editor One",
    description:
      "Staff account with minimal AUTHOR role — assignable via /admin/access",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Social Sciences",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-test-ed-1",
        userId: "00000000-0000-4000-d000-000000000003",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "test-editor-two": {
    key: "test-editor-two" as DevIdentityKey,
    id: "00000000-0000-4000-d000-000000000004",
    email: "test.editor.two@cas.test",
    displayName: "Test Editor Two",
    description:
      "Second staff account with minimal AUTHOR role — assignable via /admin/access",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Social Sciences",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-test-ed-2",
        userId: "00000000-0000-4000-d000-000000000004",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
  "test-user-five": {
    key: "test-user-five" as DevIdentityKey,
    id: "00000000-0000-4000-d000-000000000005",
    email: "test.user.five@cas.test",
    displayName: "Test User Five",
    description:
      "Flexible testing user with minimal AUTHOR role — assignable via /admin/access",
    isActive: true,
    institution: "CAS Testing Academy",
    department: "Social Sciences",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    globalRoles: [
      {
        id: "gr-test-user-5",
        userId: "00000000-0000-4000-d000-000000000005",
        role: GlobalRole.AUTHOR,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    journalRoles: [],
  },
};

export const ALL_DEV_IDENTITIES = {
  ...CAS_DEV_IDENTITIES,
  ...IZU_DEV_IDENTITIES,
};

export function isDevIdentityEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getDevIdentityById(id: string) {
  if (!isDevIdentityEnabled()) return null;
  return (
    Object.values(ALL_DEV_IDENTITIES).find((identity) => identity.id === id) ??
    null
  );
}

export async function getActiveDevIdentity() {
  if (!isDevIdentityEnabled()) return null;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const rawKey = cookieStore.get(DEV_IDENTITY_COOKIE_NAME)?.value;
    if (!rawKey || !(rawKey in ALL_DEV_IDENTITIES)) return null;
    return ALL_DEV_IDENTITIES[rawKey as DevIdentityKey];
  } catch {
    return null;
  }
}

export {
  switchDevIdentityAction,
  clearDevIdentityAction,
} from "@/lib/auth/dev-actions";
