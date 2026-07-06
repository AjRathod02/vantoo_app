import { Redis } from "ioredis";
export declare function getRedis(): Redis;
export declare function closeRedis(): Promise<void>;
declare function channelKey(orderId: string): string;
export interface TrackingPayload {
    orderId: string;
    riderId: string;
    riderName: string;
    riderPhone: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
}
export declare function setTracking(orderId: string, data: Omit<TrackingPayload, "orderId" | "updatedAt">): Promise<TrackingPayload>;
export declare function getTracking(orderId: string): Promise<TrackingPayload | null>;
export { channelKey };
