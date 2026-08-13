import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, supabaseId } = await request.json();

    if (!email) {
      return NextResponse.json({ authorized: false, error: "No email provided" }, { status: 400 });
    }

    // Check if this email exists in our users table (admin whitelist)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ authorized: false, error: "Email not registered" }, { status: 403 });
    }

    // Link supabaseId if not already linked
    if (supabaseId && !user.supabaseId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseId },
      });
    }

    // Mark as active on first login
    if (user.status === "pending") {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "active" },
      });
    }

    return NextResponse.json({
      authorized: true,
      role: user.role,
      name: user.name,
    });
  } catch (error: any) {
    console.error("Check access error:", error);
    return NextResponse.json({ authorized: false, error: "Server error" }, { status: 500 });
  }
}
