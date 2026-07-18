import { getSessionUser } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";
import { getOrder as getMemoryOrder } from "@/lib/server/orderStore";
import { subscribeRiderLocation } from "@/lib/tracking/broadcaster";
import type { RiderLocationUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const order = (await getOrder(params.id, user.id)) ?? getMemoryOrder(params.id);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  if (order.userId && order.userId !== user.id && user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }
  if (!order.userId && user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: RiderLocationUpdate) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      if (order.tracking?.riderLat && order.tracking?.riderLng) {
        send({
          orderId: params.id,
          lat: order.tracking.riderLat,
          lng: order.tracking.riderLng,
          speed: order.tracking.riderSpeed,
          heading: order.tracking.riderHeading,
          timestamp: order.tracking.updatedAt,
          riderName: order.tracking.riderName,
          riderPhone: order.tracking.riderPhone,
          riderRating: order.tracking.riderRating,
          etaMinutes: order.tracking.etaMinutes,
          distanceKm: order.tracking.distanceKm,
          distanceRemainingM: order.tracking.distanceRemainingM,
        });
      }

      unsubscribe = subscribeRiderLocation(params.id, send);

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
