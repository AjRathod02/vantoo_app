import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export type TicketKind = "complaint" | "help";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "escalated";

export type TicketCategory =
  | "orders"
  | "payment"
  | "refund"
  | "delivery"
  | "rider"
  | "vendor"
  | "product_quality"
  | "technical"
  | "general"
  | "account"
  | "returns"
  | "wallet"
  | "coupons"
  | "product"
  | "other";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  kind: TicketKind;
  category: TicketCategory;
  subject: string;
  description: string;
  orderId?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: TicketStatus;
  attachments: string[];
  resolution?: string;
  resolutionDueAt?: string;
  createdAt: string;
  updatedAt: string;
  replies: SupportReply[];
}

export interface SupportReply {
  id: string;
  authorType: "customer" | "admin" | "system";
  authorName: string;
  body: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface AdminFaqItem extends FaqItem {
  sortOrder: number;
  isPublished: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

type MemoryTicket = SupportTicket & { userId: string };

const memory = {
  tickets: [] as MemoryTicket[],
  contacts: [] as Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    createdAt: string;
  }>,
  ratings: [] as Array<{
    id: string;
    userId?: string;
    rating: number;
    feedback: string;
    createdAt: string;
  }>,
  seq: { cmp: 100, help: 400 },
};

const SEED_FAQS: FaqItem[] = [
  {
    id: "f1",
    category: "orders",
    question: "How do I track my order?",
    answer:
      "Open My Orders, select your order, and tap Track Order for live status and map tracking.",
  },
  {
    id: "f2",
    category: "orders",
    question: "Can I cancel my order?",
    answer:
      "Yes, you can cancel before the order is out for delivery from the order details page.",
  },
  {
    id: "f3",
    category: "payment",
    question: "Which payment methods are accepted?",
    answer: "UPI, cards, netbanking, COD, and wallet balance (where available).",
  },
  {
    id: "f4",
    category: "payment",
    question: "My payment failed but money was deducted. What now?",
    answer:
      "Failed payments are usually auto-refunded in 3–7 business days. Raise a complaint under Payments with your Payment ID.",
  },
  {
    id: "f5",
    category: "refund",
    question: "How long do refunds take?",
    answer:
      "Approved refunds typically credit within 5–7 business days depending on your bank.",
  },
  {
    id: "f6",
    category: "delivery",
    question: "What if my rider is delayed?",
    answer:
      "Check live tracking for ETA. If significantly delayed, raise a Delivery complaint from Help Center.",
  },
  {
    id: "f7",
    category: "account",
    question: "How do I update my profile?",
    answer:
      "Go to Profile to edit your name, phone, and date of birth (limited changes).",
  },
  {
    id: "f8",
    category: "wallet",
    question: "How do referral earnings work?",
    answer:
      "Invite friends from Refer & Earn. When they place an eligible first order and it is delivered, commission credits to your referral wallet.",
  },
  {
    id: "f9",
    category: "returns",
    question: "How do I return a damaged product?",
    answer:
      "Open the order, choose Return/Refund, upload photos, and submit. Our team reviews within 24–48 hours.",
  },
  {
    id: "f10",
    category: "product",
    question: "Where can I find ingredients and nutrition info?",
    answer:
      "Open the product details page — ingredients, nutrition, storage, and manufacturer details are listed below the description.",
  },
  {
    id: "f11",
    category: "technical",
    question: "The app is not loading. What should I do?",
    answer:
      "Clear cache, update the app/browser, and retry. If it persists, create a Technical Support ticket.",
  },
  {
    id: "f12",
    category: "coupons",
    question: "Why is my coupon not applying?",
    answer:
      "Coupons have minimum order values and expiry. Remove conflicting offers and retry.",
  },
];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatTicketNumber(kind: TicketKind) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (kind === "complaint") {
    memory.seq.cmp += 1;
    return `CMP-${y}${m}${day}-${String(memory.seq.cmp).padStart(6, "0")}`;
  }
  memory.seq.help += 1;
  return `HELP-${y}${m}${day}-${String(memory.seq.help).padStart(6, "0")}`;
}

function mapRow(row: Record<string, unknown>, replies: SupportReply[] = []): SupportTicket {
  return {
    id: String(row.id),
    ticketNumber: String(row.ticket_number),
    kind: (row.ticket_kind as TicketKind) || "complaint",
    category: row.category as TicketCategory,
    subject: String(row.subject),
    description: String(row.description ?? ""),
    orderId: row.order_id ? String(row.order_id) : undefined,
    priority: row.priority as SupportTicket["priority"],
    status: row.status as TicketStatus,
    attachments: Array.isArray(row.attachments) ? (row.attachments as string[]) : [],
    resolution: row.resolution ? String(row.resolution) : undefined,
    resolutionDueAt: row.resolution_due_at
      ? String(row.resolution_due_at)
      : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    replies,
  };
}

function resolutionDue(priority: SupportTicket["priority"]) {
  const hours = { low: 72, medium: 48, high: 24, critical: 8 }[priority];
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

export async function listFaqs(category?: string): Promise<FaqItem[]> {
  if (hasAdminClient()) {
    try {
      let q = createAdminClient()
        .from("help_faqs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (category) q = q.eq("category", category);
      const { data } = await q;
      if (data?.length) {
        return data.map((f) => ({
          id: f.id,
          category: f.category,
          question: f.question,
          answer: f.answer,
        }));
      }
    } catch (e) {
      console.error("listFaqs:", e);
    }
  }
  return category
    ? SEED_FAQS.filter((f) => f.category === category)
    : SEED_FAQS;
}

export async function listAllFaqs(): Promise<AdminFaqItem[]> {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("help_faqs")
        .select("*")
        .order("sort_order");
      if (data) {
        return data.map((f) => ({
          id: f.id,
          category: f.category,
          question: f.question,
          answer: f.answer,
          sortOrder: f.sort_order ?? 0,
          isPublished: f.is_published !== false,
        }));
      }
    } catch (e) {
      console.error("listAllFaqs:", e);
    }
  }
  return SEED_FAQS.map((f, i) => ({
    ...f,
    sortOrder: i,
    isPublished: true,
  }));
}

export async function upsertFaq(input: {
  id?: string;
  category?: string;
  question?: string;
  answer?: string;
  sortOrder?: number;
  isPublished?: boolean;
}): Promise<AdminFaqItem | null> {
  if (!hasAdminClient()) return null;
  try {
    const supabase = createAdminClient();
    if (input.id) {
      const patch: Record<string, unknown> = {};
      if (input.category !== undefined) patch.category = input.category;
      if (input.question !== undefined) patch.question = input.question;
      if (input.answer !== undefined) patch.answer = input.answer;
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
      if (input.isPublished !== undefined) patch.is_published = input.isPublished;
      const { data, error } = await supabase
        .from("help_faqs")
        .update(patch)
        .eq("id", input.id)
        .select()
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        category: data.category,
        question: data.question,
        answer: data.answer,
        sortOrder: data.sort_order ?? 0,
        isPublished: data.is_published !== false,
      };
    }

    const { data, error } = await supabase
      .from("help_faqs")
      .insert({
        category: input.category ?? "general",
        question: input.question ?? "",
        answer: input.answer ?? "",
        sort_order: input.sortOrder ?? 0,
        is_published: input.isPublished !== false,
      })
      .select()
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      category: data.category,
      question: data.question,
      answer: data.answer,
      sortOrder: data.sort_order ?? 0,
      isPublished: data.is_published !== false,
    };
  } catch (e) {
    console.error("upsertFaq:", e);
    return null;
  }
}

export async function deleteFaq(id: string): Promise<boolean> {
  if (!hasAdminClient()) return false;
  try {
    const { error } = await createAdminClient()
      .from("help_faqs")
      .delete()
      .eq("id", id);
    return !error;
  } catch (e) {
    console.error("deleteFaq:", e);
    return false;
  }
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone ?? "",
          subject: c.subject,
          message: c.message,
          status: c.status ?? "new",
          createdAt: c.created_at,
        }));
      }
    } catch (e) {
      console.error("listContactMessages:", e);
    }
  }
  return memory.contacts.map((c) => ({
    ...c,
    status: "new",
  }));
}

export async function updateContactStatus(
  id: string,
  status: string
): Promise<ContactMessage | null> {
  if (!hasAdminClient()) return null;
  try {
    const { data, error } = await createAdminClient()
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      subject: data.subject,
      message: data.message,
      status: data.status ?? status,
      createdAt: data.created_at,
    };
  } catch (e) {
    console.error("updateContactStatus:", e);
    return null;
  }
}

export async function createTicket(input: {
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  kind: TicketKind;
  category: TicketCategory;
  subject: string;
  description: string;
  orderId?: string;
  priority?: SupportTicket["priority"];
  attachments?: string[];
}): Promise<SupportTicket> {
  const priority = input.priority ?? "medium";
  const ticketNumber = formatTicketNumber(input.kind);
  const due = resolutionDue(priority);
  const now = new Date().toISOString();

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          ticket_number: ticketNumber,
          ticket_kind: input.kind,
          user_id: input.userId,
          user_type: "customer",
          user_name: input.userName,
          user_email: input.userEmail ?? "",
          user_phone: input.userPhone ?? "",
          category: input.category,
          priority,
          subject: input.subject,
          description: input.description,
          order_id: input.orderId ?? null,
          attachments: input.attachments ?? [],
          status: "open",
          resolution_due_at: due,
        })
        .select()
        .single();
      if (!error && data) {
        await supabase.from("support_ticket_replies").insert({
          ticket_id: data.id,
          author_type: "system",
          author_name: "Vantoo Support",
          body: `Your ${input.kind === "complaint" ? "complaint" : "help ticket"} ${ticketNumber} has been received. Our team will respond within the resolution timeline.`,
        });
        return mapRow(data, [
          {
            id: uid("r"),
            authorType: "system",
            authorName: "Vantoo Support",
            body: `Your ${input.kind === "complaint" ? "complaint" : "help ticket"} ${ticketNumber} has been received.`,
            createdAt: now,
          },
        ]);
      }
    } catch (e) {
      console.error("createTicket:", e);
    }
  }

  const ticket: MemoryTicket = {
    id: uid("t"),
    userId: input.userId,
    ticketNumber,
    kind: input.kind,
    category: input.category,
    subject: input.subject,
    description: input.description,
    orderId: input.orderId,
    priority,
    status: "open",
    attachments: input.attachments ?? [],
    resolutionDueAt: due,
    createdAt: now,
    updatedAt: now,
    replies: [
      {
        id: uid("r"),
        authorType: "system",
        authorName: "Vantoo Support",
        body: `Your ${input.kind === "complaint" ? "complaint" : "help ticket"} ${ticketNumber} has been received. Our team will respond soon.`,
        createdAt: now,
      },
    ],
  };
  memory.tickets.unshift(ticket);
  return ticket;
}

export async function listUserTickets(
  userId: string,
  kind?: TicketKind
): Promise<SupportTicket[]> {
  if (hasAdminClient()) {
    try {
      let q = createAdminClient()
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (kind) q = q.eq("ticket_kind", kind);
      const { data } = await q;
      if (data) {
        const tickets: SupportTicket[] = [];
        for (const row of data) {
          const { data: replies } = await createAdminClient()
            .from("support_ticket_replies")
            .select("*")
            .eq("ticket_id", row.id)
            .order("created_at");
          tickets.push(
            mapRow(
              row,
              (replies ?? []).map((r) => ({
                id: r.id,
                authorType: r.author_type,
                authorName: r.author_name,
                body: r.body,
                createdAt: r.created_at,
              }))
            )
          );
        }
        return tickets;
      }
    } catch (e) {
      console.error("listUserTickets:", e);
    }
  }
  return memory.tickets.filter(
    (t) => t.userId === userId && (!kind || t.kind === kind)
  );
}

export async function getUserTicket(
  userId: string,
  ticketId: string
): Promise<SupportTicket | null> {
  const all = await listUserTickets(userId);
  return all.find((t) => t.id === ticketId || t.ticketNumber === ticketId) ?? null;
}

export async function addCustomerReply(
  userId: string,
  ticketId: string,
  body: string,
  authorName: string
): Promise<SupportReply | null> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("id, user_id")
        .eq("id", ticketId)
        .maybeSingle();
      if (!ticket || ticket.user_id !== userId) return null;

      const { data } = await supabase
        .from("support_ticket_replies")
        .insert({
          ticket_id: ticketId,
          author_type: "customer",
          author_id: userId,
          author_name: authorName,
          body,
        })
        .select()
        .single();

      await supabase
        .from("support_tickets")
        .update({
          status: "open",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (data) {
        return {
          id: data.id,
          authorType: "customer",
          authorName: data.author_name,
          body: data.body,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.error("addCustomerReply:", e);
    }
  }

  const ticket = memory.tickets.find(
    (t) => t.userId === userId && t.id === ticketId
  );
  if (!ticket) return null;
  const reply: SupportReply = {
    id: uid("r"),
    authorType: "customer",
    authorName,
    body,
    createdAt: new Date().toISOString(),
  };
  ticket.replies.push(reply);
  ticket.updatedAt = reply.createdAt;
  ticket.status = "open";
  return reply;
}

export async function submitContactMessage(input: {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  if (hasAdminClient()) {
    try {
      await createAdminClient().from("contact_messages").insert({
        user_id: input.userId ?? null,
        name: input.name,
        email: input.email,
        phone: input.phone ?? "",
        subject: input.subject,
        message: input.message,
      });
      return { ok: true };
    } catch (e) {
      console.error("submitContactMessage:", e);
    }
  }
  memory.contacts.unshift({
    id: uid("c"),
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    subject: input.subject,
    message: input.message,
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function submitAppRating(input: {
  userId?: string;
  guestId?: string;
  rating: number;
  feedback?: string;
}) {
  if (hasAdminClient()) {
    try {
      await createAdminClient().from("app_ratings").insert({
        user_id: input.userId ?? null,
        guest_id: input.guestId ?? null,
        rating: input.rating,
        feedback: input.feedback ?? "",
      });
      return { ok: true };
    } catch (e) {
      console.error("submitAppRating:", e);
    }
  }
  memory.ratings.unshift({
    id: uid("ar"),
    userId: input.userId,
    rating: input.rating,
    feedback: input.feedback ?? "",
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
}
