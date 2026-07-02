export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold text-ink">Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          Vantoo collects information you provide during signup, checkout, and
          order delivery — including name, email, phone number, and delivery
          address.
        </p>
        <p>
          Payment data is processed securely through Razorpay. Vantoo does not
          store full card or UPI credentials on our servers.
        </p>
        <p>
          Location data may be used during live order tracking to show delivery
          progress. You can contact support to request account or data deletion.
        </p>
      </div>
    </div>
  );
}
