/** Session flag so checkout empty-cart guards do not race the success redirect. */
const SUCCESS_NAV_KEY = "vantoo:navigating-to-success";

export function markNavigatingToOrderSuccess() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SUCCESS_NAV_KEY, "1");
  }
}

export function clearNavigatingToOrderSuccess() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SUCCESS_NAV_KEY);
  }
}

export function isNavigatingToOrderSuccess() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SUCCESS_NAV_KEY) === "1";
}
