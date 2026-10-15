import { redirect } from "next/navigation";

import { OverviewPreviewDashboard } from "@/components/admin/overview-preview/overview-preview-dashboard";
import { AuthenticatedShell } from "@/components/app/authenticated-shell";
import { requireApplicationArea } from "@/lib/auth/authorization";
import { getAvailableWorkspaces } from "@/lib/auth/workspaces";

export default async function AdminOverviewPreviewPage() {
  const user = await requireApplicationArea("admin");
  const workspaces = getAvailableWorkspaces(user);

  const workspace =
    workspaces.find((item) => item.area === "platform") ?? workspaces[0];
  if (!workspace) redirect("/unauthorized?reason=workspace");

  return (
    <AuthenticatedShell
      user={user}
      workspace={workspace}
      workspaces={workspaces}
      navigation={[
        { href: "/admin", label: "Overview (Live)" },
        {
          href: "/admin/overview-preview",
          label: "Overview (Proposed Redesign)",
        },
        { href: "/admin/submissions", label: "Manuscripts" },
        { href: "/admin/articles", label: "Articles & Content" },
        { href: "/admin/editorial-board", label: "Editorial Board" },
        { href: "/admin/reviewers", label: "Reviewers" },
        { href: "/admin/announcements", label: "Announcements" },
        { href: "/admin/access", label: "Users" },
      ]}
    >
      <OverviewPreviewDashboard />
    </AuthenticatedShell>
  );
}
