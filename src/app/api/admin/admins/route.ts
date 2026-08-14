import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-logger";
import { createAuthUser } from "@/lib/firebase-auth";
import { demoBlock } from "@/lib/demo-guard";

export async function GET(request: NextRequest) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["admin", "super_admin"] },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify current user is super_admin
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentAdmin = await prisma.user.findFirst({
      where: { email: user.email },
    });
    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create admin accounts" },
        { status: 403 }
      );
    }

    const blocked = demoBlock("Creating admin accounts");
    if (blocked) return blocked;

    // 2. Parse and validate request body
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.json(
        { error: "Role must be admin or super_admin" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 3. Check if email already exists in Prisma
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // 4. Provision the Firebase auth account
    let authUserId: string;
    try {
      const created = await createAuthUser(email.toLowerCase(), password);
      authUserId = created.id;
    } catch (e) {
      // An address already in Firebase but absent from Prisma is a half-finished
      // earlier attempt. Without a service account there is no way to look up
      // that uid, so say so plainly rather than writing a row that can never
      // sign in.
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("EMAIL_EXISTS")) {
        return NextResponse.json(
          {
            error:
              "That email already has an auth account. Remove it in the Firebase console, then try again.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create the auth account" },
        { status: 400 }
      );
    }

    // 5. Create user in Prisma
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        supabaseId: authUserId,
        role,
        status: "pending",
      },
    });

    // Log the action
    await writeAuditLog({
      actorUserId: currentAdmin.id,
      actionType: "ADMIN_CREATED",
      entityType: "User",
      entityId: newAdmin.id,
      newValueJson: { name, email, role },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
