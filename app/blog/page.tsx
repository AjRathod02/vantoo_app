export default function BlogPage() {
  return (
    <ContentLayout title="Blog">
      <p>
        Stories, product updates, and tips from the Vantoo team are on the way.
      </p>
      <p>
        We will share how we build the platform, spotlight partner vendors and
        delivery heroes, and help you get the most out of Vantoo for food,
        groceries, medicine, and shopping.
      </p>
      <p>Check back soon — our first posts are being written.</p>
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
