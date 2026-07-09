export default function AboutPage() {
  return (
    <ContentLayout title="About Us">
      <p>
        Vantoo is your everyday super-app for food, groceries, medicine, and
        shopping — delivered fast with secure payments and live order tracking.
      </p>
      <p>
        We connect customers with trusted local vendors and a reliable delivery
        network, making it effortless to get what you need, when you need it.
        From your favourite restaurants to daily essentials and pharmacy orders,
        Vantoo brings everything together in one place.
      </p>
      <p>
        Our mission is to power local commerce with technology that is fast,
        transparent, and fair for customers, vendors, and delivery partners
        alike.
      </p>
    </ContentLayout>
  );
}

function ContentLayout({
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
    </div>
  );
}
