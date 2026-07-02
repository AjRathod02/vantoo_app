export default function RefundPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold text-ink">Refund Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          Prepaid orders cancelled before dispatch are eligible for a full refund
          within 5–7 business days to the original payment method.
        </p>
        <p>
          If you receive damaged, incorrect, or missing items, contact support
          within 24 hours of delivery with order ID and photos. Approved refunds
          are processed after verification.
        </p>
        <p>
          Cash on Delivery orders are refunded via wallet credit or bank transfer
          where applicable. Refund status can be tracked from your order details.
        </p>
      </div>
    </div>
  );
}
