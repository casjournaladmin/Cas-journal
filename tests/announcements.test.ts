import assert from "node:assert/strict";
import test from "node:test";

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementBySlug,
  getPublicAnnouncements,
  toggleAnnouncementActive,
  updateAnnouncement,
} from "@/lib/editorial/announcements-store";

const superAdminActor = {
  id: "admin-super",
  email: "superadmin@imsu-foss.ng",
  globalRoles: [{ role: "SUPER_ADMIN" as const }],
  journalRoles: [],
};

const psychologyAdminActor = {
  id: "admin-psych",
  email: "psychadmin@imsu-foss.ng",
  globalRoles: [{ role: "AUTHOR" as const }],
  journalRoles: [
    {
      journalId: "njcp",
      role: "JOURNAL_ADMIN" as const,
      journal: { slug: "njcp" },
    },
  ],
};

const authorActor = {
  id: "author-1",
  email: "author@gmail.com",
  globalRoles: [{ role: "AUTHOR" as const }],
  journalRoles: [],
};

test("Announcements: Public retrieval and filtering", async () => {
  const createdIds: string[] = [];
  try {
    const allRes = await createAnnouncement({
      title: "Platform-Wide Editorial Policy Update",
      category: "EDITORIAL_UPDATE",
      targetJournal: "ALL",
      content:
        "All CAS Journals manuscripts now undergo updated ethical compliance screening prior to peer review.",
      authorName: "Editorial Office",
      actor: superAdminActor,
    });
    if (allRes.announcement?.id) createdIds.push(allRes.announcement.id);

    const njcpRes = await createAnnouncement({
      title: "NJCP Call for Clinical Research Manuscripts",
      category: "CALL_FOR_PAPERS",
      targetJournal: "njcp",
      content:
        "The Nigerian Journal of Clinical Psychology invites original empirical submissions for its upcoming volume.",
      authorName: "NJCP Editor-in-Chief",
      actor: superAdminActor,
    });
    if (njcpRes.announcement?.id) createdIds.push(njcpRes.announcement.id);

    const ajsbsRes = await createAnnouncement({
      title: "AJSBS Special Issue Notice",
      category: "GENERAL",
      targetJournal: "ajsbs",
      content:
        "The African Journal of Social and Behavioural Sciences announces its interdisciplinary thematic issue.",
      authorName: "AJSBS Editorial Board",
      actor: superAdminActor,
    });
    if (ajsbsRes.announcement?.id) createdIds.push(ajsbsRes.announcement.id);

    const publicAnnouncements = await getPublicAnnouncements();
    assert.ok(Array.isArray(publicAnnouncements));
    assert.ok(publicAnnouncements.length >= 3);
    assert.ok(publicAnnouncements.every((a) => a.isActive));

    // Filter by journal
    const njcpAnnouncements = await getPublicAnnouncements("njcp");
    assert.ok(njcpAnnouncements.length >= 2);
    assert.ok(
      njcpAnnouncements.every(
        (a) => a.targetJournal === "njcp" || a.targetJournal === "ALL",
      ),
    );

    // Retrieve single announcement by slug
    const first = publicAnnouncements[0];
    const bySlug = await getAnnouncementBySlug(first.slug);
    assert.ok(bySlug);
    assert.equal(bySlug.id, first.id);
  } finally {
    for (const announcementId of createdIds) {
      await deleteAnnouncement({
        announcementId,
        actor: superAdminActor,
      });
    }
  }
});

test("Announcements: Creation, authorization, and updates", async () => {
  // 1. Author cannot create announcement
  const authorCreateRes = await createAnnouncement({
    title: "Unauthorized Call",
    category: "CALL_FOR_PAPERS",
    targetJournal: "njcp",
    content: "Some content here for testing unauthorized creation.",
    authorName: "Author",
    actor: authorActor,
  });
  assert.equal(authorCreateRes.success, false);
  assert.ok(authorCreateRes.error?.includes("Unauthorized"));

  // 2. Psychology admin can create NJCP announcement with imageUrl
  const createRes = await createAnnouncement({
    title: "NJCP 2026 Special Call for Cognitive Studies",
    category: "SPECIAL_ISSUE",
    targetJournal: "njcp",
    content:
      "We welcome submissions exploring cognitive behavioral interventions in Nigerian tertiary institutions.",
    imageUrl: "https://example.com/poster.jpg",
    authorName: "Prof Nkwam C. Uwaoma",
    actor: psychologyAdminActor,
  });
  assert.equal(createRes.success, true);
  assert.ok(createRes.announcement);
  assert.equal(
    createRes.announcement!.imageUrl,
    "https://example.com/poster.jpg",
  );
  const createdId = createRes.announcement!.id;

  // 3. Psychology admin CANNOT edit AJSBS announcement
  const ajsbsCreateRes = await createAnnouncement({
    title: "AJSBS Flagship Conference 2026",
    category: "GENERAL",
    targetJournal: "ajsbs",
    content: "Annual social science symposium registration.",
    authorName: "Dean of Faculty",
    actor: superAdminActor,
  });
  assert.equal(ajsbsCreateRes.success, true);
  const ajsbsId = ajsbsCreateRes.announcement!.id;

  const psychEditDenied = await updateAnnouncement({
    announcementId: ajsbsId,
    title: "Hacked Title",
    category: "GENERAL",
    targetJournal: "ajsbs",
    content: "Unauthorized content",
    isActive: true,
    actor: psychologyAdminActor,
  });
  assert.equal(psychEditDenied.success, false);
  assert.ok(psychEditDenied.error?.includes("Unauthorized"));

  // 3b. Psychology admin updates NJCP announcement image
  const updateRes = await updateAnnouncement({
    announcementId: createdId,
    title: "NJCP 2026 Special Call for Cognitive Studies (Updated)",
    category: "SPECIAL_ISSUE",
    targetJournal: "njcp",
    content: "Updated details...",
    imageUrl: "https://example.com/new-poster.jpg",
    isActive: true,
    actor: psychologyAdminActor,
  });
  assert.equal(updateRes.success, true);
  assert.equal(
    updateRes.announcement?.imageUrl,
    "https://example.com/new-poster.jpg",
  );

  // 4. Toggle active status
  const toggleRes = await toggleAnnouncementActive({
    announcementId: createdId,
    actor: psychologyAdminActor,
  });
  assert.equal(toggleRes.success, true);
  assert.equal(toggleRes.isActive, false);

  // 5. Cleanup / deletion
  const deleteRes = await deleteAnnouncement({
    announcementId: createdId,
    actor: psychologyAdminActor,
  });
  assert.equal(deleteRes.success, true);

  const deleteAjsbsRes = await deleteAnnouncement({
    announcementId: ajsbsId,
    actor: superAdminActor,
  });
  assert.equal(deleteAjsbsRes.success, true);
});

test("Announcements: Public navigation link and draft/expired filtering", async () => {
  const { siteConfig } = await import("@/lib/config/site");

  // 1. Verify Announcements is integrated in public navigation
  const navItem = siteConfig.publicNavigation.find(
    (item) => item.label === "Announcements",
  );
  assert.ok(navItem, "Announcements link must be present in public navigation");
  assert.equal(navItem.href, "/announcements");

  // 2. Verify draft/inactive announcements are excluded from public results
  const draftRes = await createAnnouncement({
    title: "Draft Call - Not Yet Public",
    category: "CALL_FOR_PAPERS",
    targetJournal: "ALL",
    content:
      "This is a draft announcement that should not be visible publicly.",
    isActive: false,
    actor: superAdminActor,
  });
  assert.equal(draftRes.success, true);
  const draftId = draftRes.announcement!.id;

  // 3. Verify expired announcements are excluded from public results
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const expiredRes = await createAnnouncement({
    title: "Expired Call - Past Deadline",
    category: "SPECIAL_ISSUE",
    targetJournal: "ALL",
    content: "This announcement has expired.",
    expiresAt: pastDate,
    isActive: true,
    actor: superAdminActor,
  });
  assert.equal(expiredRes.success, true);
  const expiredId = expiredRes.announcement!.id;

  try {
    const publicList = await getPublicAnnouncements();
    const foundDraft = publicList.some((a) => a.id === draftId);
    const foundExpired = publicList.some((a) => a.id === expiredId);

    assert.equal(
      foundDraft,
      false,
      "Draft/inactive announcements must not appear publicly",
    );
    assert.equal(
      foundExpired,
      false,
      "Expired announcements must not appear publicly",
    );
  } finally {
    await deleteAnnouncement({
      announcementId: draftId,
      actor: superAdminActor,
    });
    await deleteAnnouncement({
      announcementId: expiredId,
      actor: superAdminActor,
    });
  }
});
