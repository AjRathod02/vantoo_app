export const ORDER_STATUS_FLOW = [
    "pending",
    "confirmed",
    "preparing",
    "packed",
    "assigned",
    "picked",
    "in_transit",
    "delivered",
];
export const VALID_STATUS_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["packed", "cancelled"],
    packed: ["assigned", "cancelled"],
    assigned: ["picked", "cancelled"],
    picked: ["in_transit", "cancelled"],
    in_transit: ["delivered", "cancelled"],
    delivered: ["returned"],
    cancelled: [],
    returned: ["refunded", "exchanged"],
    refunded: [],
    exchanged: [],
};
export const CUSTOMER_VISIBLE_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "packed",
    "assigned",
    "picked",
    "in_transit",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
    "exchanged",
];
export function canTransition(from, to) {
    return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function isTerminalStatus(status) {
    return ["delivered", "cancelled", "refunded", "exchanged"].includes(status);
}
export function isActiveOrder(status) {
    return !isTerminalStatus(status);
}
/** Map enterprise status to simplified customer tracking step index */
export function getTrackingStepIndex(status) {
    const steps = ["confirmed", "preparing", "packed", "in_transit", "delivered"];
    const mapped = status === "assigned" || status === "picked" ? "in_transit" : status;
    const idx = steps.indexOf(mapped);
    if (status === "cancelled" || status === "returned" || status === "refunded")
        return -1;
    if (status === "pending")
        return 0;
    return idx >= 0 ? idx : 0;
}
