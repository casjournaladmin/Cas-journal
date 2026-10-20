import assert from "node:assert/strict";
import test from "node:test";

import {
  createReviewerApplication,
  deleteReviewerApplication,
  formatAcademicName,
  getReviewerApplicationForUser,
  getReviewerApplications,
  updateReviewerApplicationStatus,
} from "@/lib/editorial/reviewer-applications-store";

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

test("Reviewer Applications: Validation and Application Creation", async () => {
  // 1. Missing required fields fails validation
  const invalidRes = await createReviewerApplication({
    fullName: "",
    academicTitle: "Dr.",
    email: "",
    phone: "",
    affiliation: "",
    academicRank: "",
    specializationKeywords: "",
    targetJournal: "njcp",
    statement: "",
  });
  assert.equal(invalidRes.success, false);
  assert.ok(invalidRes.error?.includes("required"));

  // 2. Valid creation generates a formatted tracking code
  const validRes = await createReviewerApplication({
    fullName: "Dr. Chioma Okonkwo",
    academicTitle: "Dr.",
    email: "chioma.okonkwo@imsu.edu.ng",
    phone: "+2348012345678",
    affiliation: "Imo State University, Department of Psychology",
    academicRank: "Senior Lecturer",
    specializationKeywords:
      "Clinical Psychology, Cognitive Behavioural Therapy",
    targetJournal: "njcp",
    profileUrl: "https://orcid.org/0000-0002-1825-0097",
    statement:
      "Interested in contributing to peer review for behavioral health manuscripts.",
  });

  assert.equal(validRes.success, true);
  assert.ok(validRes.trackingCode?.startsWith("REV-NJCP-"));
  assert.ok(validRes.application);
  assert.equal(validRes.application.status, "PENDING");
  assert.equal(validRes.application.targetJournal, "njcp");

  // Scoped cleanup
  if (validRes.application?.id) {
    await deleteReviewerApplication({
      applicationId: validRes.application.id,
      actor: superAdminActor,
    });
  }
});

test("Reviewer Applications: List and Scoped Retrieval", async () => {
  const createdIds: string[] = [];
  try {
    const njcpRes = await createReviewerApplication({
      fullName: "Dr. Ngozi Okeke",
      academicTitle: "Dr.",
      email: "ngozi.okeke.test@example.com",
      phone: "+2348011223344",
      affiliation: "University of Lagos",
      academicRank: "Senior Lecturer",
      specializationKeywords: "Clinical Psychology, Psychometrics",
      targetJournal: "njcp",
      statement: "Willing to review clinical psychology manuscripts.",
    });
    if (njcpRes.application?.id) createdIds.push(njcpRes.application.id);

    const ajsbsRes = await createReviewerApplication({
      fullName: "Prof. Tunde Bello",
      academicTitle: "Prof.",
      email: "tunde.bello.test@example.com",
      phone: "+2348022334455",
      affiliation: "University of Ibadan",
      academicRank: "Professor",
      specializationKeywords: "Sociology, Behavioral Economics",
      targetJournal: "ajsbs",
      statement: "Willing to review interdisciplinary social science papers.",
    });
    if (ajsbsRes.application?.id) createdIds.push(ajsbsRes.application.id);

    const allApps = await getReviewerApplications(superAdminActor);
    assert.ok(Array.isArray(allApps));
    assert.ok(allApps.length >= 2);

    // Filter by journal
    const psychApps = await getReviewerApplications(superAdminActor, {
      journalSlug: "njcp",
    });
    assert.ok(psychApps.length >= 1);
    assert.ok(
      psychApps.every(
        (a) => a.targetJournal === "njcp" || a.targetJournal === "ALL",
      ),
    );
  } finally {
    for (const applicationId of createdIds) {
      await deleteReviewerApplication({
        applicationId,
        actor: superAdminActor,
      });
    }
  }
});

test("Reviewer Applications: Status Transition and Department Authorization", async () => {
  // Create an application specifically for NJCP
  const res = await createReviewerApplication({
    fullName: "Prof. Emeka Obi",
    academicTitle: "Prof.",
    email: "emeka.obi@example.com",
    phone: "+2348099887766",
    affiliation: "University of Nigeria, Nsukka",
    academicRank: "Professor",
    specializationKeywords: "Social Psychology, Organizational Behavior",
    targetJournal: "njcp",
    statement: "Willing to review manuscripts on organizational behavior.",
  });
  assert.equal(res.success, true);
  const appId = res.application!.id;

  // 1. Author cannot approve or decline
  const authorActionRes = await updateReviewerApplicationStatus({
    applicationId: appId,
    status: "APPROVED",
    actor: authorActor,
  });
  assert.equal(authorActionRes.success, false);
  assert.ok(authorActionRes.error?.includes("Unauthorized"));

  // 2. Psychology admin can approve NJCP application
  const psychApproveRes = await updateReviewerApplicationStatus({
    applicationId: appId,
    status: "APPROVED",
    actor: psychologyAdminActor,
  });
  assert.equal(psychApproveRes.success, true);

  // 3. Verify status updated
  const updatedApps = await getReviewerApplications(superAdminActor);
  const updatedApp = updatedApps.find((a) => a.id === appId);
  assert.ok(updatedApp);
  assert.equal(updatedApp.status, "APPROVED");

  // 4. Psychology admin cannot delete an AJSBS application
  const ajsbsRes = await createReviewerApplication({
    fullName: "Dr. AJSBS Reviewer",
    academicTitle: "Dr.",
    email: "ajsbs.reviewer@example.com",
    phone: "+2348011112222",
    affiliation: "Faculty of Social Sciences",
    academicRank: "Reader",
    specializationKeywords: "Social Sciences",
    targetJournal: "ajsbs",
    statement: "Reviewing for AJSBS flagship.",
  });
  assert.equal(ajsbsRes.success, true);
  const ajsbsAppId = ajsbsRes.application!.id;

  const psychDeleteDenied = await deleteReviewerApplication({
    applicationId: ajsbsAppId,
    actor: psychologyAdminActor,
  });
  assert.equal(psychDeleteDenied.success, false);
  assert.ok(psychDeleteDenied.error?.includes("Unauthorized"));

  // 5. Super Admin can delete
  const superDeleteAllowed = await deleteReviewerApplication({
    applicationId: ajsbsAppId,
    actor: superAdminActor,
  });
  assert.equal(superDeleteAllowed.success, true);

  // Clean up initial test application
  await deleteReviewerApplication({
    applicationId: appId,
    actor: superAdminActor,
  });
});

test("Reviewer Applications: Authenticated submission preserves applicantUserId", async () => {
  const validUserUuid = "a0000000-0000-0000-0000-000000001234";
  const authRes = await createReviewerApplication({
    fullName: "Dr. Authenticated Scholar",
    academicTitle: "Dr.",
    email: "auth.scholar@example.com",
    phone: "+2348055555555",
    affiliation: "IMSU Department of Psychology",
    academicRank: "Senior Lecturer",
    specializationKeywords: "Developmental Psychology",
    targetJournal: "njcp",
    statement: "Experienced reviewer.",
    applicantUserId: validUserUuid,
  });

  assert.equal(authRes.success, true);
  assert.ok(authRes.application);
  assert.equal(authRes.application.applicantUserId, validUserUuid);
  assert.equal(authRes.application.status, "PENDING");

  // Lookup for user by userId
  const foundByUserId = await getReviewerApplicationForUser({
    id: validUserUuid,
  });
  assert.ok(foundByUserId);
  assert.equal(foundByUserId.id, authRes.application.id);

  // Lookup for user by email
  const foundByEmail = await getReviewerApplicationForUser({
    email: "auth.scholar@example.com",
  });
  assert.ok(foundByEmail);
  assert.equal(foundByEmail.id, authRes.application.id);

  // Clean up authenticated test application
  if (authRes.application?.id) {
    await deleteReviewerApplication({
      applicationId: authRes.application.id,
      actor: superAdminActor,
    });
  }
});

test("Reviewer Applications: formatAcademicName prevents duplicate titles", () => {
  // Title already present in fullName
  assert.equal(
    formatAcademicName("Prof.", "Prof. Emeka Obi"),
    "Prof. Emeka Obi",
  );
  assert.equal(formatAcademicName("Prof.", "Prof Emeka Obi"), "Prof Emeka Obi");
  assert.equal(
    formatAcademicName("Dr.", "Dr. Chioma Okonkwo"),
    "Dr. Chioma Okonkwo",
  );
  assert.equal(
    formatAcademicName("Dr.", "Dr Chioma Okonkwo"),
    "Dr Chioma Okonkwo",
  );
  assert.equal(
    formatAcademicName("Assoc. Prof.", "Assoc. Prof. Nkwam C. Uwaoma"),
    "Assoc. Prof. Nkwam C. Uwaoma",
  );

  // Title not present in fullName
  assert.equal(formatAcademicName("Prof.", "Emeka Obi"), "Prof. Emeka Obi");
  assert.equal(
    formatAcademicName("Dr.", "Chioma Okonkwo"),
    "Dr. Chioma Okonkwo",
  );
  assert.equal(formatAcademicName("", "Chioma Okonkwo"), "Chioma Okonkwo");
  assert.equal(formatAcademicName("Dr.", ""), "");
});

test("Reviewer Applications: Duplicate active application prevention", async () => {
  const email = "duplicate.test.referee@example.com";
  const userUuid = "b0000000-0000-0000-0000-000000005678";

  // 1. Initial application succeeds
  const firstRes = await createReviewerApplication({
    fullName: "Dr. Unique Candidate",
    academicTitle: "Dr.",
    email,
    phone: "+2348011119999",
    affiliation: "Federal University of Technology, Owerri",
    academicRank: "Senior Lecturer",
    specializationKeywords: "Information Systems, Software Engineering",
    targetJournal: "cjmr",
    statement: "Specialist in enterprise systems and empirical software.",
    applicantUserId: userUuid,
  });
  assert.equal(firstRes.success, true);
  assert.ok(firstRes.application?.id);
  const firstId = firstRes.application!.id;

  try {
    // 2. Duplicate submission with same userUuid fails
    const dupUserRes = await createReviewerApplication({
      fullName: "Dr. Unique Candidate",
      academicTitle: "Dr.",
      email: "different.email@example.com",
      phone: "+2348011119999",
      affiliation: "Federal University of Technology, Owerri",
      academicRank: "Senior Lecturer",
      specializationKeywords: "Information Systems",
      targetJournal: "cjmr",
      statement: "Attempting duplicate with same userId.",
      applicantUserId: userUuid,
    });
    assert.equal(dupUserRes.success, false);
    assert.ok(
      dupUserRes.error?.includes("already have an active reviewer application"),
    );

    // 3. Duplicate submission with same email fails
    const dupEmailRes = await createReviewerApplication({
      fullName: "Dr. Another Candidate",
      academicTitle: "Dr.",
      email,
      phone: "+2348011119999",
      affiliation: "Federal University of Technology, Owerri",
      academicRank: "Senior Lecturer",
      specializationKeywords: "Information Systems",
      targetJournal: "cjmr",
      statement: "Attempting duplicate with same email.",
      applicantUserId: "c0000000-0000-0000-0000-000000009999",
    });
    assert.equal(dupEmailRes.success, false);
    assert.ok(
      dupEmailRes.error?.includes(
        "already have an active reviewer application",
      ),
    );
  } finally {
    await deleteReviewerApplication({
      applicationId: firstId,
      actor: superAdminActor,
    });
  }
});

test("Reviewer Applications: Approval does NOT automatically grant EDITOR role", async () => {
  const { prisma } = await import("@/lib/db/prisma");
  const crypto = await import("node:crypto");

  const email = "no.auto.editor@example.com";
  const userId = crypto.randomUUID();

  // Create or retrieve a test user
  const testUser = await prisma.user.upsert({
    where: { email },
    update: { isActive: true },
    create: {
      id: userId,
      email,
      displayName: "Dr. Candidate Author",
      isActive: true,
      globalRoles: {
        create: [{ role: "AUTHOR" }],
      },
    },
  });

  // Verify user initially has no EDITOR journal role
  const initialEditorRoles = await prisma.journalRoleAssignment.findMany({
    where: { userId: testUser.id, role: "EDITOR" },
  });
  assert.equal(initialEditorRoles.length, 0);

  // Submit application
  const appRes = await createReviewerApplication({
    fullName: "Dr. Candidate Author",
    academicTitle: "Dr.",
    email,
    phone: "+2348088887777",
    affiliation: "University of Port Harcourt",
    academicRank: "Senior Lecturer",
    specializationKeywords: "Political Economy, Development Studies",
    targetJournal: "polis",
    statement: "Experienced peer reviewer in political studies.",
    applicantUserId: testUser.id,
  });
  assert.equal(appRes.success, true);
  const appId = appRes.application!.id;

  try {
    // Approve the application as Super Admin
    const approveRes = await updateReviewerApplicationStatus({
      applicationId: appId,
      status: "APPROVED",
      actor: superAdminActor,
    });
    assert.equal(approveRes.success, true);

    // Verify application status is APPROVED
    const appRecord = await prisma.reviewerApplication.findUnique({
      where: { id: appId },
    });
    assert.equal(appRecord?.status, "APPROVED");

    // CRITICAL AUTHORIZATION CHECK: User must NOT have been silently assigned the EDITOR role
    const postApprovalEditorRoles = await prisma.journalRoleAssignment.findMany(
      {
        where: { userId: testUser.id, role: "EDITOR" },
      },
    );
    assert.equal(
      postApprovalEditorRoles.length,
      0,
      "Reviewer approval must not silently grant EDITOR journal role",
    );

    // User's global roles must remain unchanged (only AUTHOR)
    const userGlobalRoles = await prisma.userGlobalRole.findMany({
      where: { userId: testUser.id },
    });
    assert.equal(userGlobalRoles.length, 1);
    assert.equal(userGlobalRoles[0].role, "AUTHOR");
  } finally {
    await deleteReviewerApplication({
      applicationId: appId,
      actor: superAdminActor,
    });
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => null);
  }
});

test("Reviewer Applications: Safe login return path validation", async () => {
  const { getSafeLoginReturnPath } =
    await import("@/lib/auth/submission-entry");
  const { getPostLoginDestination } = await import("@/lib/auth/workspaces");

  // 1. Safe return path validation
  assert.equal(
    getSafeLoginReturnPath("/author/apply-reviewer"),
    "/author/apply-reviewer",
  );
  assert.equal(
    getSafeLoginReturnPath("/author/apply-reviewer?journal=existentia"),
    "/author/apply-reviewer?journal=existentia",
  );
  assert.equal(
    getSafeLoginReturnPath("/author/apply-reviewer?journal=polis"),
    "/author/apply-reviewer?journal=polis",
  );

  // 2. Post-login destination preserves reviewer destination for Authors
  const authorUser = {
    id: "author-test-id",
    isActive: true,
    email: "author@test.com",
    displayName: "Test Author",
    globalRoles: [{ role: "AUTHOR" as const }],
    journalRoles: [],
  };
  assert.equal(
    getPostLoginDestination(
      authorUser,
      "/author/apply-reviewer?journal=existentia",
    ),
    "/author/apply-reviewer?journal=existentia",
  );

  // 3. Post-login destination denies non-authors
  const nonAuthorUser = {
    id: "non-author-id",
    isActive: true,
    email: "outsider@test.com",
    displayName: "Non Author",
    globalRoles: [],
    journalRoles: [],
  };
  assert.equal(
    getPostLoginDestination(nonAuthorUser, "/author/apply-reviewer"),
    "/unauthorized?reason=author",
  );
});
