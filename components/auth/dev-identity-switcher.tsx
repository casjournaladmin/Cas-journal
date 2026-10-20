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
    <details className="group mt-6 rounded-xl border border-dashed border-sky-400/25 bg-[#032338]/60 text-xs backdrop-blur-sm transition-colors">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl p-3.5 font-medium text-sky-200/80 select-none hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-90"
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
          <span className="rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
            DEV ONLY
          </span>
        </span>
        <span className="text-[11px] text-sky-300/60 group-open:hidden">
          Expand
        </span>
      </summary>

      <div className="space-y-4 border-t border-sky-500/20 p-4 pt-3">
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {activeUsers.map((item) => (
            <form key={item.key} action={switchDevIdentityAction}>
              <input type="hidden" name="identity" value={item.key} />
              {returnTo ? (
                <input type="hidden" name="returnTo" value={returnTo} />
              ) : null}
              <button
                type="submit"
                className="flex w-full cursor-pointer flex-col items-start rounded-lg border border-sky-500/20 bg-[#021827]/80 p-2.5 text-left transition hover:border-sky-400 hover:bg-[#03243a] hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white">
                    {item.name}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${item.color}`}
                  >
                    {item.role}
                  </span>
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-sky-300/70">
                  {item.email}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </details>
  );
}
