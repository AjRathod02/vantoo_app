import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { statusMeta } from "@/lib/orderStatus";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
