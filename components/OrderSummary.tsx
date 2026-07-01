import { formatINR } from "@/lib/utils";

export function OrderSummary({
  subtotal,
  deliveryFee,
  tax,
  discount,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="space-y-2.5 text-sm">
      <Row label="Subtotal" value={formatINR(subtotal)} />
      {discount > 0 && (
        <Row
          label="Discount"
          value={`- ${formatINR(discount)}`}
          valueClass="text-brand-accent"
        />
      )}
      <Row label="Delivery Fee" value={formatINR(deliveryFee)} />
      <Row label="Taxes (5%)" value={formatINR(tax)} />
      <div className="my-2 border-t border-dashed border-gray-200" />
      <div className="flex items-center justify-between text-base font-bold text-ink">
        <span>Total</span>
        <span>{formatINR(total)}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-ink-muted">
      <span>{label}</span>
      <span className={valueClass ?? "font-medium text-ink"}>{value}</span>
    </div>
  );
}
