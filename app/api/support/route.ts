import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import {
  addCustomerReply,
  createTicket,
  getUserTicket,
  listFaqs,
  listUserTickets,
  submitAppRating,
  submitContactMessage,
} from "@/lib/support/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "faqs") {
    const faqs = await listFaqs(searchParams.get("category") ?? undefined);
    return NextResponse.json({ faqs });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const kind = searchParams.get("kind") as "complaint" | "help" | null;
  const id = searchParams.get("id");
  if (id) {
    const ticket = await getUserTicket(user.id, id);
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket });
  }

  const tickets = await listUserTickets(user.id, kind ?? undefined);
  return NextResponse.json({ tickets });
}

const createSchema = z.object({
  kind: z.enum(["complaint", "help"]).default("complaint"),
  category: z.string().min(1),
  subject: z.string().min(3),
  description: z.string().min(10),
  orderId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  attachments: z.array(z.string()).optional(),
});

const contactSchema = z.object({
  action: z.literal("contact"),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

const rateSchema = z.object({
  action: z.literal("rate-app"),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  guestId: z.string().optional(),
});

const replySchema = z.object({
  action: z.literal("reply"),
  ticketId: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "contact") {
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact form" }, { status: 400 });
    }
    const user = await getSessionUser();
    await submitContactMessage({
      userId: user?.id,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "rate-app") {
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }
    const user = await getSessionUser();
    await submitAppRating({
      userId: user?.id,
      guestId: parsed.data.guestId,
      rating: parsed.data.rating,
      feedback: parsed.data.feedback,
    });
    return NextResponse.json({ ok: true });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (body.action === "reply") {
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
    }
    const reply = await addCustomerReply(
      user.id,
      parsed.data.ticketId,
      parsed.data.body,
      user.name
    );
    if (!reply) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reply });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Fill all required fields" }, { status: 400 });
  }

  const ticket = await createTicket({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    kind: parsed.data.kind,
    category: parsed.data.category as never,
    subject: parsed.data.subject,
    description: parsed.data.description,
    orderId: parsed.data.orderId,
    priority: parsed.data.priority,
    attachments: parsed.data.attachments,
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
