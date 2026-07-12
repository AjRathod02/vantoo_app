import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { logAdminAction } from "@/lib/admin/audit";
import {
  deleteFaq,
  listAllFaqs,
  listContactMessages,
  updateContactStatus,
  upsertFaq,
} from "@/lib/support/service";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [faqs, contacts] = await Promise.all([
      listAllFaqs(),
      listContactMessages(),
    ]);

    return NextResponse.json({ faqs, contacts });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.question?.trim() || !body.answer?.trim()) {
      return NextResponse.json(
        { error: "question and answer are required" },
        { status: 400 }
      );
    }

    const faq = await upsertFaq({
      category: body.category ?? "general",
      question: body.question,
      answer: body.answer,
      sortOrder: Number(body.sort_order ?? body.sortOrder ?? 0),
      isPublished: body.is_published ?? body.isPublished ?? true,
    });

    if (!faq) {
      return NextResponse.json({ error: "Could not create FAQ" }, { status: 503 });
    }

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "create",
      resource: "complaints",
      resourceId: faq.id,
      details: { type: "faq" },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (body.contactId || body.type === "contact") {
      const contactId = body.contactId ?? body.id;
      const status = body.status;
      if (!contactId || !status) {
        return NextResponse.json(
          { error: "contactId and status are required" },
          { status: 400 }
        );
      }
      const contact = await updateContactStatus(contactId, status);
      if (!contact) {
        return NextResponse.json({ error: "Update failed" }, { status: 503 });
      }
      await logAdminAction({
        adminId: ctx.admin.id,
        adminEmail: ctx.admin.email,
        action: "update",
        resource: "complaints",
        resourceId: contactId,
        details: { type: "contact", status },
      });
      return NextResponse.json({ contact });
    }

    const faqId = body.faqId ?? body.id;
    if (!faqId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const faq = await upsertFaq({
      id: faqId,
      category: body.category,
      question: body.question,
      answer: body.answer,
      sortOrder: body.sort_order ?? body.sortOrder,
      isPublished: body.is_published ?? body.isPublished,
    });

    if (!faq) {
      return NextResponse.json({ error: "Update failed" }, { status: 503 });
    }

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "update",
      resource: "complaints",
      resourceId: faqId,
      details: { type: "faq" },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const ok = await deleteFaq(id);
    if (!ok) {
      return NextResponse.json({ error: "Delete failed" }, { status: 503 });
    }

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "complaints",
      resourceId: id,
      details: { type: "faq" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
