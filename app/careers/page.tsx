export default function CareersPage() {
  return (
    <ContentLayout title="Careers">
      <p>
        We are building the everyday super-app for food, groceries, medicine, and
        shopping — and we are always looking for talented, driven people to join
        the journey.
      </p>
      <p>
        Whether you are an engineer, designer, operations specialist, or support
        star, there is a place for you at Vantoo. We value ownership, speed, and
        a relentless focus on our customers, vendors, and delivery partners.
      </p>
      <p>
        No open roles are listed right now. Send your resume to{" "}
        <a
          href="mailto:careers@vantoo.com"
          className="text-brand-primary hover:underline"
        >
          careers@vantoo.com
        </a>{" "}
        and we will reach out when something matches your skills.
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
