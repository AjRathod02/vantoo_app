const CART_SUMMARY_HIDDEN_ROUTES = [
  "/login",
  "/signup",
  "/cart",
  "/checkout",
] as const;

export function isCartSummaryHidden(pathname: string): boolean {
  if (
    CART_SUMMARY_HIDDEN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return true;
  }

  // Order success / tracking page after checkout
  if (/^\/orders\/[^/]+\/track/.test(pathname)) {
    return true;
  }

  return false;
}
