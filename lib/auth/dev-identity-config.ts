/**
 * Client-safe development environment flags.
 * This module has zero database, Prisma, or server dependencies so it can be
 * safely imported into client components or tree-shaken in production.
 */
export function isDevIdentityEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
