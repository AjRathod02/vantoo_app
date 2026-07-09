/** Routes that use dedicated portal layouts (not customer storefront chrome). */
export const PORTAL_PREFIXES = ["/admin", "/vendor", "/rider"] as const;

export function isPortalRoute(pathname: string): boolean {
  return PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
