"use server";

import { cookies } from "next/headers";

import {
  DEV_IDENTITY_COOKIE_NAME,
  ALL_DEV_IDENTITIES,
  isDevIdentityEnabled,
  type DevIdentityKey,
} from "@/lib/auth/dev-identities";
import { getPostLoginDestination } from "@/lib/auth/workspaces";

export async function switchDevIdentityAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  if (!isDevIdentityEnabled()) {
    redirect("/login");
  }

  const rawKey = String(formData.get("identity") ?? "").trim();
  if (!rawKey || !(rawKey in ALL_DEV_IDENTITIES)) {
    redirect("/login");
  }

  const identity = ALL_DEV_IDENTITIES[rawKey as DevIdentityKey];

  if (process.env.NODE_ENV !== "production") {
    try {
      const { ensureCasDevUsersInDatabase } =
        await import("@/lib/auth/dev-database-users");
      await ensureCasDevUsersInDatabase();
    } catch {
      // Ignore background error
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_IDENTITY_COOKIE_NAME, rawKey, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  const returnTo = formData.get("returnTo");

  // Check if user has updated roles in DB (e.g. assigned as Editor or Admin via /admin/access)
  let effectiveUser = identity;
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const { applicationUserInclude } = await import("@/lib/auth/authorization");
    const dbUser = await prisma.user.findUnique({
      where: { id: identity.id },
      include: applicationUserInclude,
    });
    if (dbUser) {
      effectiveUser = dbUser as unknown as typeof identity;
    }
  } catch {
    // Fallback to static identity
  }

  const destination = getPostLoginDestination(effectiveUser, returnTo);
  redirect(destination);
}

export async function clearDevIdentityAction() {
  const { redirect } = await import("next/navigation");
  if (!isDevIdentityEnabled()) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEV_IDENTITY_COOKIE_NAME);
  redirect("/login");
}
