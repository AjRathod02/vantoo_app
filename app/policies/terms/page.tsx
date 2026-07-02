export default function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service">
      <p>
        By using Vantoo, you agree to use our platform for lawful purposes only.
        You must provide accurate account information and maintain the security of
        your login credentials.
      </p>
      <p>
        Vantoo connects customers with partner vendors for food, grocery, medicine,
        and e-commerce delivery. Product availability, pricing, and delivery timelines
        may vary by location and service type.
      </p>
      <p>
        We reserve the right to suspend accounts that violate these terms or engage
        in fraudulent activity, including payment abuse or repeated order
        cancellations.
      </p>
    </PolicyLayout>
  );
}

function PolicyLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold text-ink">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
      <p className="mt-8 text-xs text-ink-soft">
        Last updated: {new Date().toLocaleDateString("en-IN")}
      </p>
    </div>
  );
}
