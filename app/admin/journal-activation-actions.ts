"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { setJournalOperationalState } from "@/lib/editorial/journal-activation";

export async function setJournalOperationalStateAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAuthenticatedUser();
  const journalSlug = String(formData.get("journalSlug") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "true") === "true";

  if (!journalSlug) {
    return { error: "Journal is required." };
  }

  const result = await setJournalOperationalState({
    journalSlug,
    enabled,
    actor: user,
  });

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/");
  revalidatePath(`/journals/${journalSlug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/${journalSlug}`);
  revalidatePath("/workspaces");
  revalidatePath("/author");

  return { success: true };
}

export async function upsertJournalMetadataAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAuthenticatedUser();
  if (!isSuperAdmin(user)) {
    return {
      error: "Unauthorized: Super Admin privileges are required.",
    };
  }

  const rawSlug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "")
    .trim()
    .toUpperCase();
  const departmentName = String(formData.get("departmentName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!rawSlug || !name) {
    return { error: "Journal slug and full title are required." };
  }

  let departmentId: string | null = null;
  if (departmentName) {
    const deptSlug = departmentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const dept = await prisma.department.upsert({
      where: { slug: deptSlug },
      update: { name: departmentName, isActive: true },
      create: {
        slug: deptSlug,
        name: departmentName,
        description: `${departmentName} editorial scope`,
        isActive: true,
      },
    });
    departmentId = dept.id;
  }

  await prisma.journal.upsert({
    where: { slug: rawSlug },
    update: {
      name,
      shortName: shortName || null,
      description: description || null,
      ...(departmentId ? { departmentId } : {}),
      isActive: true,
    },
    create: {
      slug: rawSlug,
      name,
      shortName: shortName || null,
      description: description || null,
      departmentId,
      isActive: true,
    },
  });

  revalidatePath("/");
  revalidatePath(`/journals/${rawSlug}`);
  revalidatePath("/archives");
  revalidatePath("/admin");
  revalidatePath("/admin/access");

  return { success: true };
}
