import assert from "node:assert/strict";
import test from "node:test";
import {
  createNotification,
  dismissAllNotifications,
  dismissNotification,
  generateIdempotencyKey,
  getUnreadCount,
  isSafeInternalActionUrl,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationValidationError,
  resolveJournalAdminRecipients,
  resolveManuscriptRecipients,
  resolveRequestRecipients,
  resolveSuperAdminRecipients,
} from "@/lib/notifications";
import {
  handleEditorialDecisionIssued,
  handleInternalChatMessageSent,
  handleManuscriptSubmitted,
  handleRequestMessageSent,
  handleReviewerAssigned,
  handleTrackingAssigned,
} from "@/lib/notifications/event-handlers";
import type {
  NotificationRecord,
  NotificationType,
} from "@/lib/notifications/types";

// Helper to create an in-memory test database client
function createInMemoryNotificationDb() {
  const notifications = new Map<string, NotificationRecord>();
  let idCounter = 1;

  const userGlobalRoles: Array<{ userId: string; role: string }> = [];
  const journalRoleAssignments: Array<{
    userId: string;
    journalId: string;
    role: string;
  }> = [];
  const reviewAssignments: Array<{
    editorId: string;
    status: string;
    reviewRound: { submissionId: string };
  }> = [];
  const submissions = new Map<
    string,
    { id: string; ownerId: string; journalId: string }
  >();
  const submissionRequests = new Map<
    string,
    {
      id: string;
      authorId: string;
      journalId: string;
      journal?: { slug: string; shortName: string };
    }
  >();
  const journals = new Map<
    string,
    { id: string; slug: string; shortName: string; name: string }
  >();

  const client = {
    _store: {
      notifications,
      userGlobalRoles,
      journalRoleAssignments,
      reviewAssignments,
      submissions,
      submissionRequests,
      journals,
    },
    notification: {
      findUnique: async ({ where }: { where: { idempotencyKey?: string } }) => {
        if (!where.idempotencyKey) return null;
        for (const item of notifications.values()) {
          if (item.idempotencyKey === where.idempotencyKey) {
            return { ...item };
          }
        }
        return null;
      },
      findFirst: async ({
        where,
      }: {
        where: {
          id?: string;
          userId?: string;
          idempotencyKey?: string;
          isDismissed?: boolean;
        };
      }) => {
        for (const item of notifications.values()) {
          let match = true;
          if (where.id && item.id !== where.id) match = false;
          if (where.userId && item.userId !== where.userId) match = false;
          if (
            where.idempotencyKey &&
            item.idempotencyKey !== where.idempotencyKey
          )
            match = false;
          if (
            typeof where.isDismissed === "boolean" &&
            (item.isDismissed ?? false) !== where.isDismissed
          )
            match = false;
          if (match) return { ...item };
        }
        return null;
      },
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take = 25,
      }: {
        where: { userId: string; isRead?: boolean; isDismissed?: boolean };
        orderBy?: { createdAt: "asc" | "desc" };
        skip?: number;
        take?: number;
      }) => {
        const results = Array.from(notifications.values()).filter((item) => {
          if (item.userId !== where.userId) return false;
          if (
            typeof where.isDismissed === "boolean" &&
            (item.isDismissed ?? false) !== where.isDismissed
          )
            return false;
          if (typeof where.isRead === "boolean" && item.isRead !== where.isRead)
            return false;
          return true;
        });

        results.sort((a, b) => {
          const diff = b.createdAt.getTime() - a.createdAt.getTime();
          return orderBy?.createdAt === "asc" ? -diff : diff;
        });

        return results.slice(skip, skip + take).map((r) => ({ ...r }));
      },
      count: async ({
        where,
      }: {
        where: { userId: string; isRead?: boolean; isDismissed?: boolean };
      }) => {
        return Array.from(notifications.values()).filter((item) => {
          if (item.userId !== where.userId) return false;
          if (
            typeof where.isDismissed === "boolean" &&
            (item.isDismissed ?? false) !== where.isDismissed
          )
            return false;
          if (typeof where.isRead === "boolean" && item.isRead !== where.isRead)
            return false;
          return true;
        }).length;
      },
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          journalId: string | null;
          type: NotificationType;
          title: string;
          message: string;
          actionUrl: string;
          resourceType: string | null;
          resourceId: string | null;
          idempotencyKey: string | null;
        };
      }) => {
        // Enforce unique constraint check on idempotencyKey
        if (data.idempotencyKey) {
          for (const item of notifications.values()) {
            if (item.idempotencyKey === data.idempotencyKey) {
              const err = Object.assign(
                new Error(
                  "Unique constraint failed on the fields: (`idempotencyKey`)",
                ),
                { code: "P2002" },
              );
              throw err;
            }
          }
        }
        const id = `notif-${idCounter++}`;
        const record: NotificationRecord = {
          id,
          userId: data.userId,
          journalId: data.journalId ?? null,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
          isRead: false,
          readAt: null,
          isDismissed: false,
          dismissedAt: null,
          createdAt: new Date(),
        };
        notifications.set(id, record);
        return { ...record };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          isRead?: boolean;
          readAt?: Date;
          isDismissed?: boolean;
          dismissedAt?: Date;
        };
      }) => {
        const item = notifications.get(where.id);
        if (!item) throw new Error("Record to update not found.");
        const updated = { ...item, ...data };
        notifications.set(where.id, updated);
        return { ...updated };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { userId: string; isRead?: boolean; isDismissed?: boolean };
        data: {
          isRead?: boolean;
          readAt?: Date;
          isDismissed?: boolean;
          dismissedAt?: Date;
        };
      }) => {
        let count = 0;
        for (const [id, item] of notifications.entries()) {
          if (item.userId !== where.userId) continue;
          if (
            typeof where.isDismissed === "boolean" &&
            (item.isDismissed ?? false) !== where.isDismissed
          )
            continue;
          if (typeof where.isRead === "boolean" && item.isRead !== where.isRead)
            continue;
          notifications.set(id, { ...item, ...data });
          count++;
        }
        return { count };
      },
    },
    userGlobalRole: {
      findMany: async ({ where }: { where: { role: string } }) => {
        return userGlobalRoles.filter((item) => item.role === where.role);
      },
    },
    journalRoleAssignment: {
      findMany: async ({
        where,
      }: {
        where: { journalId: string; role: string | { in?: string[] } };
      }) => {
        return journalRoleAssignments.filter((item) => {
          if (item.journalId !== where.journalId) return false;
          if (typeof where.role === "string") return item.role === where.role;
          if (
            where.role &&
            typeof where.role === "object" &&
            Array.isArray(where.role.in)
          ) {
            return where.role.in.includes(item.role);
          }
          return true;
        });
      },
    },
    journal: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const item = journals.get(where.id);
        return item ? { ...item } : null;
      },
    },
    reviewAssignment: {
      findMany: async ({
        where,
      }: {
        where: {
          reviewRound: { submissionId: string };
          status?: { notIn?: string[] };
        };
      }) => {
        return reviewAssignments.filter((item) => {
          if (item.reviewRound.submissionId !== where.reviewRound.submissionId)
            return false;
          if (where.status?.notIn?.includes(item.status)) return false;
          return true;
        });
      },
    },
    submission: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const item = submissions.get(where.id);
        return item ? { ...item } : null;
      },
    },
    submissionRequest: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const item = submissionRequests.get(where.id);
        return item ? { ...item } : null;
      },
    },
  };

  return client;
}

const VALID_USER_UUID = "11111111-1111-4111-8111-111111111111";
const SECOND_USER_UUID = "22222222-2222-4222-8222-222222222222";
const THIRD_USER_UUID = "33333333-3333-4333-8333-333333333333";

test("Safe Action URL Validation: Correctly permits safe relative routes", () => {
  assert.equal(isSafeInternalActionUrl("/admin/submissions"), true);
  assert.equal(
    isSafeInternalActionUrl("/author/requests/req-123?tab=messages"),
    true,
  );
  assert.equal(
    isSafeInternalActionUrl("/editor/psychology/submissions/sub-456#round-1"),
    true,
  );
  assert.equal(isSafeInternalActionUrl("/"), true);
});

test("Safe Action URL Validation: Rejects dangerous schemes, external URLs, and protocol-relative links", () => {
  // Protocol-relative (open redirect vector)
  assert.equal(isSafeInternalActionUrl("//evil.com/phish"), false);
  assert.equal(isSafeInternalActionUrl("/\\evil.com"), false);

  // External schemes
  assert.equal(isSafeInternalActionUrl("https://evil.com"), false);
  assert.equal(isSafeInternalActionUrl("http://imsufoss.com"), false);
  assert.equal(isSafeInternalActionUrl("ftp://file-server.com"), false);

  // Script injection vectors
  assert.equal(isSafeInternalActionUrl("javascript:alert(1)"), false);
  assert.equal(isSafeInternalActionUrl("/javascript:alert(1)"), false);
  assert.equal(isSafeInternalActionUrl("data:text/html,<script>"), false);
  assert.equal(isSafeInternalActionUrl("vbscript:msgbox(1)"), false);

  // Control characters / backslash tricks
  assert.equal(isSafeInternalActionUrl("/admin\r\nSet-Cookie: test"), false);
  assert.equal(isSafeInternalActionUrl("/foo\\bar"), false);

  // Empty or invalid types
  assert.equal(isSafeInternalActionUrl(""), false);
  assert.equal(isSafeInternalActionUrl("   "), false);
  assert.equal(isSafeInternalActionUrl(null), false);
  assert.equal(isSafeInternalActionUrl(123), false);
});

test("Validation & Creation: Valid notification creation succeeds with in-memory DB", async () => {
  const db = createInMemoryNotificationDb();

  const result = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "MANUSCRIPT_SUBMITTED",
      title: "New Manuscript Received",
      message: "An author has submitted a manuscript for review.",
      actionUrl: "/admin/psychology/submissions/sub-100",
      journalId: "njcp",
      resourceType: "Submission",
      resourceId: "sub-100",
    },
    db,
  );

  assert.equal(result.duplicate, false);
  assert.equal(result.notification.userId, VALID_USER_UUID);
  assert.equal(result.notification.type, "MANUSCRIPT_SUBMITTED");
  assert.equal(result.notification.title, "New Manuscript Received");
  assert.equal(result.notification.isRead, false);
  assert.equal(result.notification.readAt, null);
  assert.ok(result.notification.id.startsWith("notif-"));
});

test("Validation: Rejects invalid UUID, invalid types, and malformed inputs", async () => {
  const db = createInMemoryNotificationDb();

  // Invalid UUID
  await assert.rejects(
    () =>
      createNotification(
        {
          userId: "not-a-uuid",
          type: "MANUSCRIPT_SUBMITTED",
          title: "Title",
          message: "Message",
          actionUrl: "/admin",
        },
        db,
      ),
    NotificationValidationError,
  );

  // Unknown notification type
  await assert.rejects(
    () =>
      createNotification(
        {
          userId: VALID_USER_UUID,
          type: "NON_EXISTENT_TYPE" as unknown as NotificationType,
          title: "Title",
          message: "Message",
          actionUrl: "/admin",
        },
        db,
      ),
    NotificationValidationError,
  );

  // Missing title
  await assert.rejects(
    () =>
      createNotification(
        {
          userId: VALID_USER_UUID,
          type: "MANUSCRIPT_SUBMITTED",
          title: "",
          message: "Message",
          actionUrl: "/admin",
        },
        db,
      ),
    NotificationValidationError,
  );

  // Unsafe action URL
  await assert.rejects(
    () =>
      createNotification(
        {
          userId: VALID_USER_UUID,
          type: "MANUSCRIPT_SUBMITTED",
          title: "Title",
          message: "Message",
          actionUrl: "https://evil.com/phish",
        },
        db,
      ),
    NotificationValidationError,
  );
});

test("Idempotency & Duplicate Prevention: Deterministic key generation and deduplication", async () => {
  const db = createInMemoryNotificationDb();

  const key1 = generateIdempotencyKey({
    userId: VALID_USER_UUID,
    type: "MANUSCRIPT_SUBMITTED",
    resourceId: "sub-999",
  });
  assert.equal(key1, `${VALID_USER_UUID}:MANUSCRIPT_SUBMITTED:sub-999`);

  const keyWithQualifier = generateIdempotencyKey({
    userId: VALID_USER_UUID,
    type: "EDITORIAL_DECISION",
    resourceId: "sub-999",
    eventQualifier: "round-2",
  });
  assert.equal(
    keyWithQualifier,
    `${VALID_USER_UUID}:EDITORIAL_DECISION:sub-999:round-2`,
  );

  // First creation
  const first = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "MANUSCRIPT_SUBMITTED",
      title: "First Attempt",
      message: "Should create notification.",
      actionUrl: "/admin/submissions/sub-999",
      idempotencyKey: key1,
    },
    db,
  );
  assert.equal(first.duplicate, false);

  // Second identical creation attempt with same key
  const second = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "MANUSCRIPT_SUBMITTED",
      title: "First Attempt (Duplicate)",
      message: "Should NOT create duplicate.",
      actionUrl: "/admin/submissions/sub-999",
      idempotencyKey: key1,
    },
    db,
  );
  assert.equal(second.duplicate, true);
  assert.equal(second.notification.id, first.notification.id);

  // Verify only 1 record exists
  const unreadCount = await getUnreadCount(VALID_USER_UUID, db);
  assert.equal(unreadCount, 1);
});

test("Recipient Resolution: Platform-wide Super Admins", async () => {
  const db = createInMemoryNotificationDb();
  db._store.userGlobalRoles.push(
    { userId: VALID_USER_UUID, role: "SUPER_ADMIN" },
    { userId: SECOND_USER_UUID, role: "SUPER_ADMIN" },
    { userId: THIRD_USER_UUID, role: "AUTHOR" },
  );

  const superAdmins = await resolveSuperAdminRecipients(db);
  assert.equal(superAdmins.length, 2);
  assert.ok(superAdmins.includes(VALID_USER_UUID));
  assert.ok(superAdmins.includes(SECOND_USER_UUID));
  assert.ok(!superAdmins.includes(THIRD_USER_UUID));
});

test("Recipient Resolution: Journal-scoped Administrators", async () => {
  const db = createInMemoryNotificationDb();
  db._store.journalRoleAssignments.push(
    { userId: VALID_USER_UUID, journalId: "njcp", role: "JOURNAL_ADMIN" },
    { userId: SECOND_USER_UUID, journalId: "ajsbs", role: "JOURNAL_ADMIN" },
    { userId: THIRD_USER_UUID, journalId: "njcp", role: "EDITOR" },
  );

  const njcpAdmins = await resolveJournalAdminRecipients("njcp", db);
  assert.deepEqual(njcpAdmins, [VALID_USER_UUID]);

  const ajsbsAdmins = await resolveJournalAdminRecipients("ajsbs", db);
  assert.deepEqual(ajsbsAdmins, [SECOND_USER_UUID]);

  const nonExistent = await resolveJournalAdminRecipients("unknown", db);
  assert.deepEqual(nonExistent, []);
});

test("Recipient Resolution: Manuscript Authors and Assigned Editors", async () => {
  const db = createInMemoryNotificationDb();
  const submissionId = "sub-test-123";

  db._store.submissions.set(submissionId, {
    id: submissionId,
    ownerId: VALID_USER_UUID,
    journalId: "njcp",
  });

  db._store.reviewAssignments.push(
    {
      editorId: SECOND_USER_UUID,
      status: "ASSIGNED",
      reviewRound: { submissionId },
    },
    {
      editorId: THIRD_USER_UUID,
      status: "DECLINED", // Declined should be excluded
      reviewRound: { submissionId },
    },
  );

  // Author + assigned active editors
  const recipients = await resolveManuscriptRecipients(
    submissionId,
    { includeAuthor: true, includeAssignedEditors: true },
    db,
  );
  assert.equal(recipients.length, 2);
  assert.ok(recipients.includes(VALID_USER_UUID));
  assert.ok(recipients.includes(SECOND_USER_UUID));
  assert.ok(!recipients.includes(THIRD_USER_UUID));
});

test("Recipient Resolution: Author-Operator Request Communication", async () => {
  const db = createInMemoryNotificationDb();
  const requestId = "req-test-456";

  db._store.submissionRequests.set(requestId, {
    id: requestId,
    authorId: VALID_USER_UUID,
    journalId: "njcp",
  });

  db._store.userGlobalRoles.push({
    userId: SECOND_USER_UUID,
    role: "SUPER_ADMIN",
  });
  db._store.journalRoleAssignments.push({
    userId: THIRD_USER_UUID,
    journalId: "njcp",
    role: "JOURNAL_ADMIN",
  });

  const recipients = await resolveRequestRecipients(requestId, {}, db);
  // Expect Author (VALID_USER_UUID) + Super Admin (SECOND_USER_UUID) + Journal Admin (THIRD_USER_UUID)
  assert.equal(recipients.length, 3);
  assert.ok(recipients.includes(VALID_USER_UUID));
  assert.ok(recipients.includes(SECOND_USER_UUID));
  assert.ok(recipients.includes(THIRD_USER_UUID));
});

test("Unread Count & Read Status Transitions: Mark single and mark all", async () => {
  const db = createInMemoryNotificationDb();

  // Create 3 unread notifications for VALID_USER_UUID
  const n1 = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Notif 1",
      message: "Msg 1",
      actionUrl: "/admin/submissions",
    },
    db,
  );

  const n2 = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "TRACKING_ASSIGNED",
      title: "Notif 2",
      message: "Msg 2",
      actionUrl: "/author/requests",
    },
    db,
  );

  const n3 = await createNotification(
    {
      userId: VALID_USER_UUID,
      type: "CORRECTION_REQUESTED",
      title: "Notif 3",
      message: "Msg 3",
      actionUrl: "/author/submissions",
    },
    db,
  );
  assert.ok(n3.notification.id.startsWith("notif-"));

  // Create 1 notification for SECOND_USER_UUID
  await createNotification(
    {
      userId: SECOND_USER_UUID,
      type: "ARTICLE_PUBLISHED",
      title: "Notif Other",
      message: "Msg Other",
      actionUrl: "/articles",
    },
    db,
  );

  // Check initial counts
  assert.equal(await getUnreadCount(VALID_USER_UUID, db), 3);
  assert.equal(await getUnreadCount(SECOND_USER_UUID, db), 1);

  // 1. Mark single notification as read
  const marked1 = await markNotificationAsRead(
    n1.notification.id,
    VALID_USER_UUID,
    db,
  );
  assert.equal(marked1?.isRead, true);
  assert.ok(marked1?.readAt instanceof Date);
  assert.equal(await getUnreadCount(VALID_USER_UUID, db), 2);

  // 2. Ownership enforcement: SECOND_USER_UUID cannot mark VALID_USER_UUID's notification
  const crossUserMark = await markNotificationAsRead(
    n2.notification.id,
    SECOND_USER_UUID,
    db,
  );
  assert.equal(crossUserMark, null);
  assert.equal(await getUnreadCount(VALID_USER_UUID, db), 2); // Unchanged

  // 3. Mark all as read for VALID_USER_UUID
  const markAllResult = await markAllNotificationsAsRead(VALID_USER_UUID, db);
  assert.equal(markAllResult.count, 2);
  assert.equal(await getUnreadCount(VALID_USER_UUID, db), 0);

  // SECOND_USER_UUID's unread notification remains untouched
  assert.equal(await getUnreadCount(SECOND_USER_UUID, db), 1);
});

test("List Notifications: Pagination and unread filtering", async () => {
  const db = createInMemoryNotificationDb();

  // Create 5 notifications
  for (let i = 1; i <= 5; i++) {
    await createNotification(
      {
        userId: VALID_USER_UUID,
        type: "INTERNAL_CHAT_MESSAGE",
        title: `Message ${i}`,
        message: `Body ${i}`,
        actionUrl: `/admin/chat/${i}`,
      },
      db,
    );
  }

  // Page 1, pageSize 2
  const page1 = await listNotifications(
    VALID_USER_UUID,
    { page: 1, pageSize: 2 },
    db,
  );
  assert.equal(page1.notifications.length, 2);
  assert.equal(page1.totalCount, 5);
  assert.equal(page1.unreadCount, 5);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.hasMore, true);

  // Mark 1 as read
  await markNotificationAsRead(page1.notifications[0].id, VALID_USER_UUID, db);

  // Filter unread only
  const unreadOnly = await listNotifications(
    VALID_USER_UUID,
    { filter: "unread", page: 1, pageSize: 10 },
    db,
  );
  assert.equal(unreadOnly.notifications.length, 4);
  assert.equal(unreadOnly.totalCount, 4);
  assert.equal(unreadOnly.unreadCount, 4);
});

test("Event Handler: handleInternalChatMessageSent routes admin vs editor and excludes sender", async () => {
  const db = createInMemoryNotificationDb();

  const journalId = "j-izu-001";
  db._store.journals.set(journalId, {
    id: journalId,
    slug: "izu",
    shortName: "Izu",
    name: "Izu: Journal of Social Sciences",
  });

  const superAdminId = "00000000-0000-4000-a000-000000000001";
  const journalAdminId = "00000000-0000-4000-a000-000000000002";
  const editorId = "00000000-0000-4000-a000-000000000003";

  // Super Admin
  db._store.userGlobalRoles.push({ userId: superAdminId, role: "SUPER_ADMIN" });
  // Journal Admin
  db._store.journalRoleAssignments.push({
    userId: journalAdminId,
    journalId,
    role: "JOURNAL_ADMIN",
  });
  // Editor
  db._store.journalRoleAssignments.push({
    userId: editorId,
    journalId,
    role: "EDITOR",
  });

  // Editor sends message
  await handleInternalChatMessageSent(
    {
      journalId,
      messageId: "msg-001",
      senderId: editorId,
      senderName: "Editor One",
    },
    db,
  );

  // Recipient notifications
  const allNotifs = Array.from(db._store.notifications.values());

  // Sender (editorId) must NOT have received a notification
  const editorNotifs = allNotifs.filter((n) => n.userId === editorId);
  assert.equal(editorNotifs.length, 0);

  // Super Admin must have received notification with /admin/izu/chat
  const saNotif = allNotifs.find((n) => n.userId === superAdminId);
  assert.ok(saNotif);
  assert.equal(saNotif.actionUrl, "/admin/izu/chat");
  assert.equal(saNotif.type, "INTERNAL_CHAT_MESSAGE");
  assert.match(saNotif.message, /Editor One posted/);

  // Journal Admin must have received notification with /admin/izu/chat
  const jaNotif = allNotifs.find((n) => n.userId === journalAdminId);
  assert.ok(jaNotif);
  assert.equal(jaNotif.actionUrl, "/admin/izu/chat");

  // Now, if Journal Admin sends a message, Editor must receive /editor/izu/chat
  await handleInternalChatMessageSent(
    {
      journalId,
      messageId: "msg-002",
      senderId: journalAdminId,
      senderName: "Admin User",
    },
    db,
  );

  const editorNotif = Array.from(db._store.notifications.values()).find(
    (n) => n.userId === editorId && n.resourceId === "msg-002",
  );
  assert.ok(editorNotif);
  assert.equal(editorNotif.actionUrl, "/editor/izu/chat");
});

test("Event Handler: handleRequestMessageSent notifies correct recipient parties", async () => {
  const db = createInMemoryNotificationDb();

  const authorId = "00000000-0000-4000-a000-000000000010";
  const journalAdminId = "00000000-0000-4000-a000-000000000011";
  const journalId = "j-existentia-001";

  db._store.submissionRequests.set("req-001", {
    id: "req-001",
    authorId,
    journalId,
    journal: { slug: "existentia", shortName: "Existentia" },
  });

  db._store.journalRoleAssignments.push({
    userId: journalAdminId,
    journalId,
    role: "JOURNAL_ADMIN",
  });

  // Author sends message -> Admin should receive notification
  await handleRequestMessageSent(
    {
      requestId: "req-001",
      messageId: "m-001",
      senderId: authorId,
      senderName: "Dr. Author",
    },
    db,
  );

  const adminNotif = Array.from(db._store.notifications.values()).find(
    (n) => n.userId === journalAdminId,
  );
  assert.ok(adminNotif);
  assert.equal(adminNotif.type, "REQUEST_MESSAGE");
  assert.equal(adminNotif.actionUrl, "/admin/existentia/requests/req-001");

  // Admin replies -> Author should receive notification
  await handleRequestMessageSent(
    {
      requestId: "req-001",
      messageId: "m-002",
      senderId: journalAdminId,
      senderName: "Journal Editor",
    },
    db,
  );

  const authorNotif = Array.from(db._store.notifications.values()).find(
    (n) => n.userId === authorId,
  );
  assert.ok(authorNotif);
  assert.equal(authorNotif.type, "REQUEST_MESSAGE");
  assert.equal(authorNotif.actionUrl, "/author/requests/req-001");
});

test("Event Handler: handleManuscriptSubmitted notifies admins and sends author submission confirmation", async () => {
  const db = createInMemoryNotificationDb();

  const authorId = "00000000-0000-4000-a000-000000000010";
  const superAdminId = "00000000-0000-4000-a000-000000000099";
  const journalAdminId = "00000000-0000-4000-a000-000000000011";
  const journalId = "j-izu-001";

  db._store.userGlobalRoles.push({
    userId: superAdminId,
    role: "SUPER_ADMIN",
  });
  db._store.journalRoleAssignments.push({
    userId: journalAdminId,
    journalId,
    role: "JOURNAL_ADMIN",
  });

  db._store.submissions.set("sub-101", {
    id: "sub-101",
    ownerId: authorId,
    journalId,
    title: "Critical Perspectives in Modern Academia",
    journal: { slug: "izu", name: "Izu Journal", shortName: "IZU" },
  } as unknown as { id: string; ownerId: string; journalId: string });

  await handleManuscriptSubmitted("sub-101", db);

  const notifs = Array.from(db._store.notifications.values());

  // Submitting author receives submission confirmation
  const authorNotif = notifs.find((n) => n.userId === authorId);
  assert.ok(authorNotif, "Author must receive submission confirmation");
  assert.equal(authorNotif.type, "MANUSCRIPT_SUBMITTED");
  assert.equal(authorNotif.title, "Manuscript Submission Received");
  assert.equal(authorNotif.actionUrl, "/author/requests");

  // Super admin receives intake notification
  const superAdminNotif = notifs.find((n) => n.userId === superAdminId);
  assert.ok(superAdminNotif, "Super admin must receive intake notification");
  assert.equal(superAdminNotif.title, "New Manuscript Submitted");
  assert.equal(superAdminNotif.actionUrl, "/admin/izu/submissions/sub-101");

  // Journal admin receives intake notification
  const journalAdminNotif = notifs.find((n) => n.userId === journalAdminId);
  assert.ok(
    journalAdminNotif,
    "Journal admin must receive intake notification",
  );
  assert.equal(journalAdminNotif.title, "New Manuscript Submitted");

  // Re-dispatching does not create duplicates (idempotency)
  await handleManuscriptSubmitted("sub-101", db);
  const notifsAfterRetry = Array.from(db._store.notifications.values());
  assert.equal(
    notifsAfterRetry.length,
    3,
    "Idempotency must prevent duplicate notifications on retry",
  );
});

test("Event Handler: handleTrackingAssigned notifies submitting author", async () => {
  const db = createInMemoryNotificationDb();

  const authorId = "00000000-0000-4000-a000-000000000010";
  const journalId = "j-izu-001";

  db._store.submissions.set("sub-102", {
    id: "sub-102",
    ownerId: authorId,
    journalId,
    title: "Understanding Epistemology",
  } as unknown as { id: string; ownerId: string; journalId: string });

  await handleTrackingAssigned(
    {
      submissionId: "sub-102",
      trackingNumber: "CAS-IZU-2026-00001",
    },
    db,
  );

  const notifs = Array.from(db._store.notifications.values());
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].userId, authorId);
  assert.equal(notifs[0].type, "TRACKING_ASSIGNED");
  assert.ok(notifs[0].message.includes("CAS-IZU-2026-00001"));
  assert.equal(notifs[0].actionUrl, "/author/submissions/sub-102");
});

test("Event Handler: handleReviewerAssigned notifies assigned editor", async () => {
  const db = createInMemoryNotificationDb();

  const editorId = "00000000-0000-4000-a000-000000000003";
  const journalId = "j-izu-001";

  db._store.submissions.set("sub-103", {
    id: "sub-103",
    ownerId: "some-author",
    journalId,
    title: "Philosophy of Logic",
    journal: { slug: "izu" },
  } as unknown as { id: string; ownerId: string; journalId: string });

  await handleReviewerAssigned(
    {
      submissionId: "sub-103",
      editorId,
      roundNumber: 1,
    },
    db,
  );

  const notifs = Array.from(db._store.notifications.values());
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].userId, editorId);
  assert.equal(notifs[0].type, "REVIEWER_ASSIGNED");
  assert.equal(notifs[0].actionUrl, "/editor/izu");
});

test("Event Handler: handleEditorialDecisionIssued notifies author", async () => {
  const db = createInMemoryNotificationDb();

  const authorId = "00000000-0000-4000-a000-000000000010";
  const journalId = "j-izu-001";

  db._store.submissions.set("sub-104", {
    id: "sub-104",
    ownerId: authorId,
    journalId,
    title: "Metaphysics of Presence",
  } as unknown as { id: string; ownerId: string; journalId: string });

  await handleEditorialDecisionIssued(
    {
      submissionId: "sub-104",
      decision: "ACCEPT",
      roundNumber: 1,
    },
    db,
  );

  const notifs = Array.from(db._store.notifications.values());
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].userId, authorId);
  assert.equal(notifs[0].type, "EDITORIAL_DECISION");
  assert.equal(notifs[0].actionUrl, "/author/submissions/sub-104");
});

test("Notification Lifecycle: dismissNotification removes notification from active lists and unread count", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";

  const { notification: n1 } = await createNotification(
    {
      userId,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Manuscript 1",
      message: "First notification",
      actionUrl: "/author/submissions/1",
    },
    db,
  );

  const { notification: n2 } = await createNotification(
    {
      userId,
      type: "CORRECTION_REQUESTED",
      title: "Manuscript 2",
      message: "Second notification",
      actionUrl: "/author/submissions/2",
    },
    db,
  );

  // Initial state: 2 unread, 2 in list
  assert.equal(await getUnreadCount(userId, db), 2);
  let list = await listNotifications(userId, undefined, db);
  assert.equal(list.totalCount, 2);
  assert.equal(list.unreadCount, 2);

  // Dismiss n1
  const dismissed = await dismissNotification(n1.id, userId, db);
  assert.ok(dismissed);
  assert.equal(dismissed.isDismissed, true);
  assert.ok(dismissed.dismissedAt instanceof Date);

  // Unread count decreases to 1
  assert.equal(await getUnreadCount(userId, db), 1);

  // Active list only contains n2
  list = await listNotifications(userId, undefined, db);
  assert.equal(list.totalCount, 1);
  assert.equal(list.unreadCount, 1);
  assert.equal(list.notifications[0].id, n2.id);

  // Still exists in underlying store for audit/archival
  const rawRecord = db._store.notifications.get(n1.id);
  assert.ok(rawRecord);
  assert.equal(rawRecord.isDismissed, true);
});

test("Notification Lifecycle: dismissNotification enforces strict user ownership", async () => {
  const db = createInMemoryNotificationDb();
  const user1 = "00000000-0000-4000-a000-000000000001";
  const user2 = "00000000-0000-4000-a000-000000000002";

  const { notification } = await createNotification(
    {
      userId: user1,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Private notification",
      message: "For User 1 only",
      actionUrl: "/author/submissions/1",
    },
    db,
  );

  // User 2 attempts to dismiss User 1's notification -> denied (returns null)
  const result = await dismissNotification(notification.id, user2, db);
  assert.equal(result, null);

  // User 1's notification is untouched
  const list = await listNotifications(user1, undefined, db);
  assert.equal(list.totalCount, 1);
  assert.equal(list.notifications[0].isDismissed, false);
});

test("Notification Lifecycle: dismissNotification is idempotent", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";

  const { notification } = await createNotification(
    {
      userId,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Test",
      message: "Test message",
      actionUrl: "/author",
    },
    db,
  );

  const first = await dismissNotification(notification.id, userId, db);
  assert.ok(first);
  assert.equal(first.isDismissed, true);

  // Second call does not fail or duplicate
  const second = await dismissNotification(notification.id, userId, db);
  assert.ok(second);
  assert.equal(second.isDismissed, true);
});

test("Notification Lifecycle: dismissAllNotifications clears active list for user", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";
  const otherUser = "00000000-0000-4000-a000-000000000002";

  // Create 3 for user 1
  for (let i = 1; i <= 3; i++) {
    await createNotification(
      {
        userId,
        type: "MANUSCRIPT_SUBMITTED",
        title: `Notification ${i}`,
        message: `Message ${i}`,
        actionUrl: `/author/${i}`,
      },
      db,
    );
  }

  // Create 1 for user 2
  await createNotification(
    {
      userId: otherUser,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Other user notification",
      message: "Should remain",
      actionUrl: "/author/other",
    },
    db,
  );

  assert.equal(await getUnreadCount(userId, db), 3);
  assert.equal(await getUnreadCount(otherUser, db), 1);

  // Dismiss all for user 1
  const res = await dismissAllNotifications(userId, db);
  assert.equal(res.count, 3);

  // User 1 list is empty
  const user1List = await listNotifications(userId, undefined, db);
  assert.equal(user1List.totalCount, 0);
  assert.equal(user1List.unreadCount, 0);
  assert.equal(await getUnreadCount(userId, db), 0);

  // User 2 list is untouched
  const user2List = await listNotifications(otherUser, undefined, db);
  assert.equal(user2List.totalCount, 1);
  assert.equal(user2List.unreadCount, 1);
  assert.equal(await getUnreadCount(otherUser, db), 1);
});

test("Notification Lifecycle: markAllNotificationsAsRead only affects non-dismissed unread records", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";

  const { notification: activeUnread } = await createNotification(
    {
      userId,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Active Unread",
      message: "Active message",
      actionUrl: "/author/active",
    },
    db,
  );

  const { notification: dismissedUnread } = await createNotification(
    {
      userId,
      type: "TRACKING_ASSIGNED",
      title: "Dismissed Unread",
      message: "Dismissed message",
      actionUrl: "/author/dismissed",
    },
    db,
  );

  // Dismiss one while it is unread
  await dismissNotification(dismissedUnread.id, userId, db);

  // Mark all as read
  const markRes = await markAllNotificationsAsRead(userId, db);
  assert.equal(markRes.count, 1); // Only the active one was touched

  // Active unread is now read
  const activeCheck = await db.notification.findFirst({
    where: { id: activeUnread.id },
  });
  assert.equal(activeCheck?.isRead, true);

  // Dismissed unread remains unread (or unchanged) in history without interfering
  const dismissedCheck = await db.notification.findFirst({
    where: { id: dismissedUnread.id },
  });
  assert.equal(dismissedCheck?.isDismissed, true);
  assert.equal(dismissedCheck?.isRead, false);
});

test("Notification Lifecycle: All vs Unread filtering correctly reflects read and dismissed states", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";

  // Item 1: Unread active
  const { notification: n1 } = await createNotification(
    {
      userId,
      type: "MANUSCRIPT_SUBMITTED",
      title: "Unread 1",
      message: "msg 1",
      actionUrl: "/1",
    },
    db,
  );

  // Item 2: Read active
  const { notification: n2 } = await createNotification(
    {
      userId,
      type: "TRACKING_ASSIGNED",
      title: "Read 2",
      message: "msg 2",
      actionUrl: "/2",
    },
    db,
  );
  await markNotificationAsRead(n2.id, userId, db);

  // Item 3: Dismissed unread
  const { notification: n3 } = await createNotification(
    {
      userId,
      type: "CORRECTION_REQUESTED",
      title: "Dismissed 3",
      message: "msg 3",
      actionUrl: "/3",
    },
    db,
  );
  await dismissNotification(n3.id, userId, db);

  // All active notifications (should be n1 and n2, excluding dismissed n3)
  const allList = await listNotifications(userId, { filter: "all" }, db);
  assert.equal(allList.totalCount, 2);
  assert.equal(allList.unreadCount, 1);
  assert.deepEqual(
    allList.notifications.map((n) => n.id).sort(),
    [n1.id, n2.id].sort(),
  );

  // Unread active notifications (should be n1 only)
  const unreadList = await listNotifications(userId, { filter: "unread" }, db);
  assert.equal(unreadList.totalCount, 1);
  assert.equal(unreadList.unreadCount, 1);
  assert.equal(unreadList.notifications[0].id, n1.id);
});

test("Notification Lifecycle: Historical records remain in database after dismissal", async () => {
  const db = createInMemoryNotificationDb();
  const userId = "00000000-0000-4000-a000-000000000001";

  const { notification } = await createNotification(
    {
      userId,
      type: "ARTICLE_PUBLISHED",
      title: "Permanent Record",
      message: "Must not be deleted",
      actionUrl: "/articles/test",
    },
    db,
  );

  await dismissNotification(notification.id, userId, db);

  // Active list is empty
  const activeList = await listNotifications(userId, undefined, db);
  assert.equal(activeList.totalCount, 0);

  // Direct database query proves record was NOT deleted
  const directRecord = await db.notification.findFirst({
    where: { id: notification.id },
  });
  assert.ok(directRecord, "Historical record must remain in database");
  assert.equal(directRecord.isDismissed, true);
  assert.ok(directRecord.dismissedAt instanceof Date);
});
