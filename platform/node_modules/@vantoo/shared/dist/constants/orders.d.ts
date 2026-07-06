import type { OrderStatus } from "../types/order.js";
export declare const ORDER_STATUS_FLOW: OrderStatus[];
export declare const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare const CUSTOMER_VISIBLE_STATUSES: OrderStatus[];
export declare function canTransition(from: OrderStatus, to: OrderStatus): boolean;
export declare function isTerminalStatus(status: OrderStatus): boolean;
export declare function isActiveOrder(status: OrderStatus): boolean;
/** Map enterprise status to simplified customer tracking step index */
export declare function getTrackingStepIndex(status: OrderStatus): number;
