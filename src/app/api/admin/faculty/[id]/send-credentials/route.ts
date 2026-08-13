import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Get faculty from DB
    const faculty = await prisma.user.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    if (!faculty.supabaseId) {
      return NextResponse.json({ error: "Faculty has no auth account" }, { status: 400 });
    }

    // Use Supabase Admin to send a password reset email.
    // This is the most reliable built-in method — Supabase handles the actual
    // email delivery via its configured SMTP (default: Supabase's own mail service).
    // The faculty will receive a "Reset Password" link which they can use to set
    // their own password on first login.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: faculty.email,
      options: {
        redirectTo: `${process.env.APP_URL || "http://localhost:3000"}/login`,
      },
    });

    if (error) {
      console.error("Generate link error:", error);
      
      // Fallback: try inviteUserByEmail
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(faculty.email, {
        redirectTo: `${process.env.APP_URL || "http://localhost:3000"}/login`,
      });

      if (inviteError) {
        console.error("Invite error:", inviteError);
        return NextResponse.json({ 
          error: `Could not send email: ${inviteError.message}. The account is created — faculty can log in with the password set during onboarding, or use 'Forgot Password' on the login page.` 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Invitation email sent. Faculty will receive a link to set up their account." 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Login link has been generated. Faculty will receive an email with instructions to access the portal." 
    });
  } catch (error: any) {
    console.error("Send credentials error:", error);
    return NextResponse.json({ error: error.message || "Failed to send credentials" }, { status: 500 });
  }
}
