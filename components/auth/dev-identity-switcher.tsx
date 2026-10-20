import { isDevIdentityEnabled } from "@/lib/auth/dev-identities";
import {
  switchDevIdentityAction,
  clearDevIdentityAction,
} from "@/lib/auth/dev-actions";

export type DevUserItem = {
  key: string;
  name: string;
  role: string;
  email: string;
  color: string;
};

const DEFAULT_DATABASE_USERS: DevUserItem[] = [
  {
    key: "test-author-one",
    name: "Test Author One",
    role: "Author",
    email: "test.author.one@cas.test",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    key: "test-author-two",
    name: "Test Author Two",
    role: "Author",
    email: "test.author.two@cas.test",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    key: "test-editor-one",
    name: "Test Editor One",
    role: "Author",
    email: "test.editor.one@cas.test",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    key: "test-editor-two",
    name: "Test Editor Two",
    role: "Author",
    email: "test.editor.two@cas.test",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  {
    key: "test-user-five",
    name: "Test User Five",
    role: "Author",
    email: "test.user.five@cas.test",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
];

export function DevIdentitySwitcher({
  returnTo,
  users,
}: {
  returnTo?: string;
  users?: DevUserItem[];
} = {}) {
  if (!isDevIdentityEnabled()) {
    return null;
  }

  const activeUsers =
    users && users.length > 0 ? users : DEFAULT_DATABASE_USERS;

  return (
    <details className="group mt-6 rounded-xl border border-sky-400/20 bg-[#021422]/65 text-xs backdrop-blur-md transition-colors">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl p-3.5 font-medium text-sky-200/80 select-none hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 shrink-0 text-sky-400 transition-transform duration-200 group-open:rotate-90"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-white">
            Development testing accounts
          </span>
          <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-sky-300 uppercase">
            Dev Only
          </span>
        </span>
        <span className="text-[11px] text-sky-300/60 transition group-open:rotate-180">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </summary>

      <div className="space-y-3 border-t border-sky-500/20 p-4 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-sky-200/70">
            5 database-backed test accounts. Roles assigned via /admin/access.
          </p>
          <form action={clearDevIdentityAction}>
            <button
              type="submit"
              className="text-[11px] font-semibold text-sky-300/80 transition-colors hover:text-red-400 hover:underline"
            >
              Clear Dev Session
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {activeUsers.map((item) => (
            <form key={item.key} action={switchDevIdentityAction}>
              <input type="hidden" name="identity" value={item.key} />
              {returnTo ? (
                <input type="hidden" name="returnTo" value={returnTo} />
              ) : null}
              <button
                type="submit"
                className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-sky-500/20 bg-[#021827]/75 px-3 py-2.5 text-left transition hover:border-sky-400/50 hover:bg-[#03243a]/90 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                    <span className="truncate text-xs font-semibold text-white group-hover:text-sky-200">
                      {item.name}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] leading-none font-medium ${item.color}`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-sky-300/70 group-hover:text-sky-200/90">
                    {item.email}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-sky-400/60 transition group-hover:translate-x-0.5 group-hover:text-sky-300">
                  →
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </details>
  );
}
