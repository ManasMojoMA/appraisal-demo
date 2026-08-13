import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/audit-logger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

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

    // 4. Create or recover user in Supabase Auth
    let authUserId: string;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // Recover orphaned user
        const result: any[] = await prisma.$queryRaw`SELECT id FROM auth.users WHERE email = ${email.toLowerCase()}`;
        if (result && result.length > 0) {
          authUserId = result[0].id;
          // Update password for the recovered user so the admin can log in
          await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
        } else {
          return NextResponse.json(
            { error: "Auth user conflict but unable to recover ID." },
            { status: 400 }
          );
        }
      } else {
        console.error("Supabase Auth error:", authError);
        return NextResponse.json(
          { error: authError.message || "Failed to create auth user" },
          { status: 400 }
        );
      }
    } else {
      authUserId = authData.user.id;
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
