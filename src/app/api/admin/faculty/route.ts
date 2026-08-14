import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { demoBlock } from "@/lib/demo-guard";
import { writeAuditLog } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const faculty = await prisma.user.findMany({
      where: { role: "faculty" },
      include: {
        submissions: {
          include: {
            cycle: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin role
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const dbAdmin = await prisma.user.findFirst({ where: { email: user.email } });
    if (!dbAdmin || (dbAdmin.role !== "admin" && dbAdmin.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const blocked = demoBlock("Creating faculty accounts");
    if (blocked) return blocked;

    const body = await request.json();
    const { name, email, employeeCode, department } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    if (employeeCode) {
      const existingEmployeeCode = await prisma.user.findUnique({ where: { employeeCode } });
      if (existingEmployeeCode) {
        return NextResponse.json({ error: `A user with employee code ${employeeCode} already exists (${existingEmployeeCode.email})` }, { status: 400 });
      }
    }

    // Simply create the user record in our database — no Supabase Auth user needed!
    // Faculty will sign in via Google, and we'll verify their email against this whitelist.
    const newFaculty = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        employeeCode: employeeCode || null,
        department: department || null,
        role: "faculty",
        status: "pending", // Will become "active" on first Google sign-in
      }
    });

    // Log the action
    await writeAuditLog({
      actorUserId: dbAdmin.id,
      actionType: "FACULTY_ONBOARDED",
      entityType: "User",
      entityId: newFaculty.id,
      newValueJson: { name, email, employeeCode, department },
    });

    return NextResponse.json({ success: true, faculty: newFaculty });
  } catch (error: any) {
    console.error("Error creating faculty:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
