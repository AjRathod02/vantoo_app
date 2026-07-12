"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Heart,
  Laptop,
  MapPin,
  Rocket,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";

type Department =
  | "All"
  | "Engineering"
  | "Design"
  | "Operations"
  | "Support"
  | "Marketing"
  | "Internship";

interface Job {
  id: string;
  title: string;
  department: Exclude<Department, "All">;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

const jobs: Job[] = [
  {
    id: "eng-fullstack",
    title: "Full-Stack Engineer",
    department: "Engineering",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    summary:
      "Build customer-facing and partner experiences across Next.js, APIs, and realtime systems.",
    responsibilities: [
      "Ship features across web storefront and partner portals",
      "Improve checkout reliability and order tracking experiences",
      "Collaborate with design and product on high-impact releases",
    ],
    requirements: [
      "Strong TypeScript/React experience",
      "Familiarity with Node.js APIs and Postgres",
      "Bias for ownership and clear communication",
    ],
  },
  {
    id: "design-product",
    title: "Product Designer",
    department: "Design",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    summary:
      "Design intuitive flows for ordering, tracking, and partner tools that millions can use.",
    responsibilities: [
      "Own end-to-end UX for key customer journeys",
      "Create high-fidelity UI aligned with Vantoo branding",
      "Run usability feedback loops with research and support",
    ],
    requirements: [
      "Portfolio showing mobile-first product work",
      "Systems thinking and strong visual craft",
      "Comfort collaborating with engineers weekly",
    ],
  },
  {
    id: "ops-city",
    title: "City Operations Lead",
    department: "Operations",
    location: "Multiple Cities · On-site",
    type: "Full-time",
    summary:
      "Scale delivery excellence, partner onboarding, and service quality in your city.",
    responsibilities: [
      "Own SLA metrics for delivery and fulfillment",
      "Grow vendor and rider networks responsibly",
      "Solve day-to-day operational bottlenecks",
    ],
    requirements: [
      "2+ years in marketplace or logistics ops",
      "Strong stakeholder management",
      "Comfort with field work and data dashboards",
    ],
  },
  {
    id: "support-cx",
    title: "Customer Experience Specialist",
    department: "Support",
    location: "Remote · India",
    type: "Full-time",
    summary:
      "Help customers resolve order, payment, and delivery questions with empathy and speed.",
    responsibilities: [
      "Handle tickets across chat, email, and phone",
      "Escalate complex cases with clear documentation",
      "Share product feedback from real conversations",
    ],
    requirements: [
      "Excellent written and spoken communication",
      "Prior CX or BPO experience preferred",
      "Calm problem-solving under pressure",
    ],
  },
  {
    id: "mkt-growth",
    title: "Growth Marketing Associate",
    department: "Marketing",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    summary:
      "Drive acquisition and retention campaigns across digital channels and city activations.",
    responsibilities: [
      "Plan and measure performance campaigns",
      "Partner with product on referral and promo flows",
      "Tell the Vantoo brand story locally",
    ],
    requirements: [
      "Hands-on digital marketing experience",
      "Comfort with analytics and experimentation",
      "Creative storytelling skills",
    ],
  },
  {
    id: "intern-eng",
    title: "Software Engineering Intern",
    department: "Internship",
    location: "Bengaluru · On-site",
    type: "Internship · 3–6 months",
    summary:
      "Learn by shipping real features with mentorship from senior engineers.",
    responsibilities: [
      "Contribute to frontend or backend tickets",
      "Write tests and participate in code reviews",
      "Present demos of your work each sprint",
    ],
    requirements: [
      "Strong fundamentals in JS/TS or Python",
      "Personal projects or open-source contributions",
      "Curiosity and willingness to learn fast",
    ],
  },
];

const departments: Department[] = [
  "All",
  "Engineering",
  "Design",
  "Operations",
  "Support",
  "Marketing",
  "Internship",
];

const benefits = [
  { title: "Competitive pay", desc: "Market-aligned compensation with performance rewards." },
  { title: "Health cover", desc: "Medical insurance for you and eligible dependents." },
  { title: "Flexible work", desc: "Hybrid options for eligible roles across teams." },
  { title: "Learning budget", desc: "Courses, conferences, and internal mentorship." },
  { title: "Meal & wellness", desc: "Team meals, wellness stipends, and delivery credits." },
  { title: "Growth path", desc: "Clear leveling, feedback, and promotion frameworks." },
];

const culture = [
  { title: "Own outcomes", desc: "We hire people who take responsibility end to end.", icon: Rocket },
  { title: "Move with care", desc: "Speed matters — quality and kindness do too.", icon: Heart },
  { title: "Build together", desc: "Cross-functional collaboration is the default.", icon: Users },
  { title: "Stay curious", desc: "Ask questions, share learnings, raise the bar.", icon: Sparkles },
];

const hiringSteps = [
  { title: "Apply", desc: "Submit your application with resume and role preference." },
  { title: "Screen", desc: "A short recruiter conversation about fit and expectations." },
  { title: "Interview", desc: "Role-specific rounds with hiring managers and peers." },
  { title: "Offer", desc: "Decision, offer discussion, and a warm onboarding plan." },
];

const careerFaqs = [
  {
    q: "How long does the hiring process take?",
    a: "Most roles move from application to decision within 2–3 weeks, depending on interview scheduling.",
  },
  {
    q: "Do you offer internships?",
    a: "Yes. We run internship opportunities across engineering, design, operations, and marketing. Filter by Internship to see open roles.",
  },
  {
    q: "Can I apply if I don't see a matching role?",
    a: "Absolutely. Choose “General Application” in the form and tell us how you’d like to contribute.",
  },
  {
    q: "Is remote work available?",
    a: "Some roles are remote or hybrid. Each job listing notes the expected work arrangement.",
  },
];

export default function CareersPage() {
  const [dept, setDept] = useState<Department>("All");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id ?? null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState(jobs[0]?.title ?? "General Application");
  const [coverLetter, setCoverLetter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resumeName, setResumeName] = useState("");

  const filtered = useMemo(
    () => (dept === "All" ? jobs : jobs.filter((j) => j.department === dept)),
    [dept]
  );

  const selectedJob =
    filtered.find((j) => j.id === selectedJobId) ?? filtered[0] ?? null;

  const applyFor = (job: Job) => {
    setPosition(job.title);
    setSelectedJobId(job.id);
    document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeName) {
      toast.error("Please upload your resume");
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      const message = [
        `Position: ${position}`,
        `Phone: ${phone}`,
        linkedin ? `LinkedIn: ${linkedin}` : null,
        portfolio ? `Portfolio: ${portfolio}` : null,
        `Resume: ${resumeName}`,
        "",
        "Cover Letter:",
        coverLetter,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contact",
          name,
          email,
          phone,
          subject: `[Careers] Application — ${position}`,
          message,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      toast.success("Application submitted. We'll be in touch.");
      setCoverLetter("");
      setLinkedin("");
      setPortfolio("");
      setResumeName("");
    } catch {
      toast.error("Could not submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-orange-100 bg-gradient-to-br from-brand-surface via-white to-orange-50">
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <p className="text-sm font-semibold text-brand-primary">Careers at Vantoo</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Build the everyday super-app with us
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
            We are looking for talented, driven people across engineering, design,
            operations, support, and more. Own meaningful work that helps cities
            get what they need — faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#open-roles">
              <Button size="lg">View Open Roles</Button>
            </a>
            <a href="#apply-form">
              <Button size="lg" variant="secondary">
                Apply Now
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Why Work at Vantoo
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            High ownership, real impact, and a team that ships for customers every day.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {culture.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-surface text-brand-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-xs text-ink-muted sm:text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-surface/60 py-14 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Company Culture
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              We value ownership, speed, and a relentless focus on customers, vendors,
              and delivery partners.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                icon: Laptop,
                title: "Product craft",
                desc: "Ship thoughtful experiences, not just features.",
              },
              {
                icon: Users,
                title: "Partner empathy",
                desc: "Respect the people who cook, pack, and deliver.",
              },
              {
                icon: Briefcase,
                title: "Clear growth",
                desc: "Know what great looks like and how to get there.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white bg-white p-5 text-center shadow-card"
              >
                <item.icon className="mx-auto h-6 w-6 text-brand-primary" />
                <h3 className="mt-3 text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-xs text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Employee Benefits
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-gray-100 p-5 shadow-card"
            >
              <h3 className="text-sm font-bold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="open-roles" className="scroll-mt-24 border-y border-orange-100 bg-white py-14 sm:py-16">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Current Open Positions
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Filter by department to find your next role.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {departments.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDept(d);
                  setSelectedJobId(null);
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  dept === d
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface text-ink-muted hover:text-brand-primary"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-ink-muted">
                  No open roles in this department right now. Send a general
                  application below.
                </p>
              ) : (
                filtered.map((job) => {
                  const active = selectedJob?.id === job.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-brand-primary bg-brand-surface shadow-card"
                          : "border-gray-100 bg-white hover:border-brand-primary/40"
                      }`}
                    >
                      <p className="text-sm font-bold text-ink">{job.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                        <span>{job.department}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card lg:col-span-3">
              {selectedJob ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    {selectedJob.type}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink">
                    {selectedJob.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {selectedJob.department} · {selectedJob.location}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    {selectedJob.summary}
                  </p>
                  <h4 className="mt-6 text-sm font-bold text-ink">
                    Responsibilities
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                    {selectedJob.responsibilities.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                  <h4 className="mt-6 text-sm font-bold text-ink">Requirements</h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                    {selectedJob.requirements.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6"
                    onClick={() => applyFor(selectedJob)}
                  >
                    Apply Now
                  </Button>
                </>
              ) : (
                <p className="text-sm text-ink-muted">
                  Select a role to view details.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Hiring Process
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hiringSteps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-gray-100 p-5 shadow-card"
            >
              <span className="text-2xl font-bold text-brand-primary/20">
                0{i + 1}
              </span>
              <h3 className="mt-2 text-sm font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-xs text-ink-muted sm:text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-primary to-brand-primaryDark py-12 text-white">
        <div className="container-page flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-xl font-bold">Internship Opportunities</h2>
              <p className="mt-1 max-w-xl text-sm text-white/85">
                Learn from operators and builders shipping real products. Filter
                open roles by Internship or apply generally below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDept("Internship");
              document.getElementById("open-roles")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            <span className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-brand-primary">
              View Internships
            </span>
          </button>
        </div>
      </section>

      <section
        id="apply-form"
        className="container-page scroll-mt-24 py-14 sm:py-16"
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Application Form
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Apply for an open role or send a general application.
          </p>

          {success && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Application received</p>
                <p className="mt-1 text-green-700">
                  Thanks for applying. Our talent team will review and reach out
                  if there&apos;s a match.
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8"
          >
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Mobile Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Position Applying For
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="General Application">General Application</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Resume Upload
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-brand-surface/40 px-4 py-3 text-sm text-ink-muted hover:border-brand-primary">
                <Upload className="h-4 w-4 text-brand-primary" />
                <span className="truncate">
                  {resumeName || "Upload PDF or DOC (max 5MB)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setResumeName("");
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Resume must be under 5MB");
                      e.target.value = "";
                      return;
                    }
                    setResumeName(file.name);
                  }}
                />
              </label>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                required
                minLength={20}
                rows={5}
                placeholder="Tell us why you want to join Vantoo..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <Input
              label="LinkedIn Profile (Optional)"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
            <Input
              label="Portfolio (Optional)"
              type="url"
              placeholder="https://..."
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
            />
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </section>

      <section className="bg-brand-surface/50 py-14 sm:py-16">
        <div className="container-page mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-3">
            {careerFaqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="text-sm font-semibold text-ink">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-gray-50 px-5 pb-4 pt-3 text-sm text-ink-muted">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-page py-12 text-center">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-ink-muted sm:text-sm">
          <strong className="text-ink">Equal Opportunity Statement:</strong>{" "}
          Vantoo is an equal opportunity employer. We celebrate diversity and are
          committed to creating an inclusive environment for all employees. We do
          not discriminate on the basis of race, religion, colour, national origin,
          gender, sexual orientation, age, marital status, veteran status, or
          disability status.
        </p>
        <p className="mt-6 text-sm text-ink-muted">
          Questions? Email{" "}
          <a
            href="mailto:careers@vantoo.com"
            className="font-semibold text-brand-primary hover:underline"
          >
            careers@vantoo.com
          </a>{" "}
          or{" "}
          <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
