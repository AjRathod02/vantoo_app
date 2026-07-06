import type { DeliveryTask, OrderStatus } from "@vantoo/shared";
export declare class DeliveryService {
    listAvailableOrders(city?: string): Promise<any[]>;
    listRiderTasks(riderId: string, activeOnly?: boolean): Promise<{
        task: DeliveryTask;
        orderNumber: string;
        orderStatus: string;
        totalAmount: number;
        deliveryAddress: any;
        serviceType: string;
        customerUserId: string;
    }[]>;
    acceptOrder(riderId: string, riderName: string, riderPhone: string, orderId: string): Promise<DeliveryTask>;
    updateOrderStatus(riderId: string, orderId: string, status: OrderStatus, riderName: string, riderPhone: string): Promise<{
        id: string;
        status: OrderStatus;
    }>;
    updateLocation(riderId: string, riderName: string, riderPhone: string, input: {
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
        accuracy?: number;
        orderId?: string;
    }): Promise<{
        riderId: string;
        latitude: number;
        longitude: number;
        recordedAt: string;
    }>;
    getTrackingForOrder(orderId: string): Promise<{
        orderId: string;
        riderId: string;
        riderName: string;
        riderPhone: string;
        riderLat: number | null;
        riderLng: number | null;
        status: string;
        updatedAt: string;
    } | null>;
    addDeliveryProof(taskId: string, riderId: string, input: {
        proofType: string;
        fileUrl: string;
    }): Promise<any>;
    listEarnings(riderId: string): Promise<{
        id: string;
        riderId: string;
        orderId: string | null;
        amount: number;
        earningType: string;
        status: string;
        createdAt: string;
    }[]>;
}
export declare const deliveryService: DeliveryService;
