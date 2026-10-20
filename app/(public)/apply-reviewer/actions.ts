"use server";

import { getCurrentUser } from "@/lib/auth/authorization";
import { hasGlobalRole } from "@/lib/auth/permissions";
import { createReviewerApplication } from "@/lib/editorial/reviewer-applications-store";

export type ReviewerApplicationActionState = {
  success?: boolean;
  error?: string;
  trackingCode?: string;
};

export async function applyAsReviewerAction(
  _prevState: ReviewerApplicationActionState,
  formData: FormData,
): Promise<ReviewerApplicationActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error:
        "Authentication required. Please sign in with Google to apply as a reviewer.",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: "Your account is inactive. Please contact the administrator.",
    };
  }

  if (!hasGlobalRole(user, "AUTHOR")) {
    return {
      success: false,
      error: "Author privileges are required to submit a reviewer application.",
    };
  }

  const fullName = formData.get("fullName")?.toString() ?? "";
  const academicTitle = formData.get("academicTitle")?.toString() ?? "Dr.";
  const email = formData.get("email")?.toString() || user.email || "";
  const phone = formData.get("phone")?.toString() ?? "";
  const affiliation = formData.get("affiliation")?.toString() ?? "";
  const academicRank = formData.get("academicRank")?.toString() ?? "";
  const specializationKeywords =
    formData.get("specializationKeywords")?.toString() ?? "";
  const targetJournal = formData.get("targetJournal")?.toString() ?? "ALL";
  const profileUrl = formData.get("profileUrl")?.toString() ?? "";
  const statement = formData.get("statement")?.toString() ?? "";

  const res = await createReviewerApplication({
    fullName,
    academicTitle,
    email,
    phone,
    affiliation,
    academicRank,
    specializationKeywords,
    targetJournal,
    profileUrl,
    statement,
    applicantUserId: user.id,
  });

  return res;
}
