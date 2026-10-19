import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  tone?: "default" | "inverse";
};

export function BrandMark({
  href = "/",
  compact = false,
  tone = "default",
}: BrandMarkProps) {
  const isInverse = tone === "inverse";
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-focus)]"
    >
      <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[#0284c7] font-serif text-[15px] font-bold tracking-[-0.03em] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]">
        CJ
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span
            className={`block font-serif text-[15px] font-bold tracking-[-0.02em] ${
              isInverse ? "text-white" : "text-[color:var(--color-foreground)]"
            }`}
          >
            CAS Journals <span className="text-[#38bdf8]">.</span>
          </span>
          <span
            className={`mt-0.5 hidden xl:block text-[10px] font-semibold tracking-[0.08em] uppercase ${
              isInverse ? "text-sky-200/80" : "text-[color:var(--color-subtle)]"
            }`}
          >
            Scholarly Publishing
          </span>
        </span>
      )}
    </Link>
  );
}
