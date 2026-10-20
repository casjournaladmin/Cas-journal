"use client";

import { useFormStatus } from "react-dom";

import { signInWithGoogle } from "@/app/login/actions";
import {
  DevIdentitySwitcher,
  type DevUserItem,
} from "@/components/auth/dev-identity-switcher";

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] border border-sky-400/35 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(2,132,199,0.22),inset_0_1px_1px_rgba(255,255,255,0.18)] backdrop-blur-md transition-all duration-200 hover:border-sky-300/60 hover:bg-white/[0.14] hover:shadow-[0_6px_30px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
    >
      <div className="grid size-6 place-items-center rounded-full bg-white p-0.5 shadow-sm">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0">
          <path
            fill="#4285F4"
            d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.9A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.5 13.7a6 6 0 0 1 0-3.8V7H3.1a10 10 0 0 0 0 9.6l3.4-2.9Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7l3.4 2.9A5.9 5.9 0 0 1 12 5.8Z"
          />
        </svg>
      </div>
      <span className="tracking-[-0.01em]">
        {pending ? "Opening Google…" : "Continue with Google"}
      </span>
    </button>
  );
}

export function LoginForm({
  returnTo,
  oauthError,
  devUsers,
}: {
  returnTo?: string;
  oauthError?: string;
  devUsers?: DevUserItem[];
}) {
  return (
    <div className="mt-5 w-full">
      <form action={signInWithGoogle}>
        {returnTo ? (
          <input type="hidden" name="returnTo" value={returnTo} />
        ) : null}
        <GoogleSubmitButton />
      </form>

      {oauthError ? (
        <div aria-live="polite" className="pt-3">
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/20 px-3.5 py-2.5 text-xs leading-5 font-medium text-red-200"
          >
            Google sign-in is unavailable right now. Please try again shortly.
          </p>
        </div>
      ) : null}

      <div className="mt-3">
        <DevIdentitySwitcher returnTo={returnTo} users={devUsers} />
      </div>
    </div>
  );
}
