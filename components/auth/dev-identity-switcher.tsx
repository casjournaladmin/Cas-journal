import { isDevIdentityEnabled } from "@/lib/auth/dev-identities";
import {
  switchDevIdentityAction,
  clearDevIdentityAction,
} from "@/lib/auth/dev-actions";

export function DevIdentitySwitcher({ returnTo }: { returnTo?: string } = {}) {
  if (!isDevIdentityEnabled()) {
    return null;
  }

  const databaseUsers = [
    {
      key: "test-author-one",
      name: "Test Author One",
      role: "Author",
      email: "test.author.one@cas.test",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      key: "test-author-two",
      name: "Test Author Two",
      role: "Author",
      email: "test.author.two@cas.test",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      key: "test-editor-one",
      name: "Test Editor One",
      role: "Author (Assignable)",
      email: "test.editor.one@cas.test",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      key: "test-editor-two",
      name: "Test Editor Two",
      role: "Author (Assignable)",
      email: "test.editor.two@cas.test",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      key: "test-user-five",
      name: "Test User Five",
      role: "Author (Assignable)",
      email: "test.user.five@cas.test",
      color:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
  ];

  const izuWorkflowIdentities = [
    {
      key: "author-one",
      name: "Author One",
      role: "Author (Izu)",
      email: "author.one@izu.test",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      key: "author-two",
      name: "Author Two",
      role: "Author (Izu)",
      email: "author.two@izu.test",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      key: "editor-one",
      name: "Editor One",
      role: "Editor (Izu)",
      email: "editor.one@izu.test",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      key: "editor-two",
      name: "Editor Two",
      role: "Editor (Izu)",
      email: "editor.two@izu.test",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      key: "admin-izu",
      name: "Izu Journal Admin",
      role: "Journal Admin (Izu)",
      email: "admin@izu.test",
      color:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
  ];

  return (
    <div className="mt-8 space-y-4">
      {/* 5 Database-Backed Development Accounts */}
      <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/60 p-4">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-2">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[color:var(--color-accent)] uppercase">
              CAS Database-Backed Test Users
            </p>
            <p className="text-[10px] text-[color:var(--color-muted)]">
              5 persistent accounts with initial Author role. Assign roles via
              /admin/access.
            </p>
          </div>
          <form action={clearDevIdentityAction}>
            <button
              type="submit"
              className="text-[10px] font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] hover:underline"
            >
              Clear Dev Session
            </button>
          </form>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {databaseUsers.map((item) => (
            <form key={item.key} action={switchDevIdentityAction}>
              <input type="hidden" name="identity" value={item.key} />
              {returnTo ? (
                <input type="hidden" name="returnTo" value={returnTo} />
              ) : null}
              <button
                type="submit"
                className="flex w-full flex-col items-start rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2.5 text-left transition hover:border-[color:var(--color-accent)] hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-[color:var(--color-foreground)]">
                    {item.name}
                  </span>
                  <span
                    className={`rounded border px-1 py-0.5 text-[9px] font-semibold ${item.color}`}
                  >
                    {item.role}
                  </span>
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-[color:var(--color-muted)]">
                  {item.email}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Pre-configured Izu Scoped Roles */}
      <details className="group rounded-xl border border-[color:var(--color-border)]/50 bg-[color:var(--color-surface)]/40 p-3 text-xs">
        <summary className="cursor-pointer font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
          ▶ Pre-configured Izu Role Testing Accounts (Instant Scoped Roles)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {izuWorkflowIdentities.map((item) => (
            <form key={item.key} action={switchDevIdentityAction}>
              <input type="hidden" name="identity" value={item.key} />
              {returnTo ? (
                <input type="hidden" name="returnTo" value={returnTo} />
              ) : null}
              <button
                type="submit"
                className="flex w-full flex-col items-start rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2.5 text-left transition hover:border-[color:var(--color-accent)] hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-[color:var(--color-foreground)]">
                    {item.name}
                  </span>
                  <span
                    className={`rounded border px-1 py-0.5 text-[9px] font-semibold ${item.color}`}
                  >
                    {item.role}
                  </span>
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-[color:var(--color-muted)]">
                  {item.email}
                </span>
              </button>
            </form>
          ))}
        </div>
      </details>
    </div>
  );
}
