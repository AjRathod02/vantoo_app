import type { Rider, RiderApplyInput, RiderDashboardStats, RiderAvailability } from "@vantoo/shared";
export declare class RiderService {
    getByUserId(userId: string): Promise<Rider | null>;
    getById(id: string): Promise<Rider>;
    apply(userId: string, input: RiderApplyInput): Promise<Rider>;
    update(userId: string, patch: Record<string, unknown>): Promise<Rider>;
    listAll(status?: string): Promise<Rider[]>;
    approve(riderId: string, adminUserId: string): Promise<Rider>;
    reject(riderId: string, reason: string): Promise<Rider>;
    suspend(riderId: string): Promise<Rider>;
    getAvailability(riderId: string): Promise<RiderAvailability>;
    setAvailability(riderId: string, status: RiderAvailability["status"]): Promise<RiderAvailability>;
    getDashboardStats(riderId: string): Promise<RiderDashboardStats>;
}
export declare const riderService: RiderService;
