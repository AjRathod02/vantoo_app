export default function CancellationPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold text-ink">Cancellation Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          You may cancel an order from the order details page while it is still
          in &quot;Confirmed&quot; or &quot;Packed&quot; status. Once the order is
          out for delivery, cancellation is not available.
        </p>
        <p>
          Cancelled prepaid orders automatically trigger a refund request. Our
          team processes refunds according to the Refund Policy.
        </p>
        <p>
          Vantoo may cancel orders in cases of stock unavailability, payment
          failure, or delivery restrictions. You will be notified and refunded
          where applicable.
        </p>
      </div>
    </div>
  );
}
