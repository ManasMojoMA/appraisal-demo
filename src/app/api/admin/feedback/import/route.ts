import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { cycleId, fileName, records } = body;
    // records is an array of objects matched to StudentFeedbackRecord

    if (!cycleId || !fileName || !records || records.length === 0) {
      return NextResponse.json({ error: "Missing required fields or empty records" }, { status: 400 });
    }

    // Create the batch
    const batch = await prisma.studentFeedbackImportBatch.create({
      data: {
        cycleId,
        fileName,
        status: "processing",
        importedBy: user.name || "admin",
      }
    });

    // Process records in bulk
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Pre-fetch all faculty for this cycle to map facultyId
    const facultyList = await prisma.user.findMany({
      where: { role: "faculty" },
      select: { id: true, email: true }
    });
    
    // Create a map of email to ID (case insensitive)
    const facultyMap = new Map(facultyList.map(f => [f.email.toLowerCase(), f.id]));

    const createPromises = records.map(async (rec: any, index: number) => {
      try {
        const email = rec.facultyEmail ? String(rec.facultyEmail).toLowerCase().trim() : "";
        const facultyId = facultyMap.get(email) || null;

        await prisma.studentFeedbackRecord.create({
          data: {
            importBatchId: batch.id,
            cycleId,
            facultyId,
            facultyEmail: email,
            facultyName: String(rec.facultyName || "Unknown"),
            programme: String(rec.programme || "Unknown"),
            semesterOrTerm: String(rec.semesterOrTerm || "Unknown"),
            courseCode: rec.courseCode ? String(rec.courseCode) : null,
            courseName: String(rec.courseName || "Unknown"),
            section: String(rec.section || "Unknown"),
            feedbackRound: String(rec.feedbackRound || "Unknown"),
            averageScore5: Number(rec.averageScore5) || 0,
            responseCount: Number(rec.responseCount) || 0,
            convertedMarks: rec.convertedMarks ? Number(rec.convertedMarks) : null,
            conversionBand: rec.conversionBand ? String(rec.conversionBand) : null,
            rawRowJson: rec.rawRowJson || {},
          }
        });
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push({ row: index + 1, message: err.message });
      }
    });

    // Wait for all creations to finish
    await Promise.allSettled(createPromises);

    // Update batch status
    await prisma.studentFeedbackImportBatch.update({
      where: { id: batch.id },
      data: {
        status: errorCount === 0 ? "completed" : (successCount > 0 ? "partial_success" : "failed"),
        errorSummaryJson: errors.length > 0 ? errors : undefined,
      }
    });

    await writeAuditLog({
      actorUserId: user.id,
      actionType: "STUDENT_FEEDBACK_IMPORTED",
      entityType: "StudentFeedbackImportBatch",
      entityId: batch.id,
      newValueJson: { fileName, successCount, errorCount },
    });

    return NextResponse.json({ 
      success: true, 
      batchId: batch.id, 
      summary: { successCount, errorCount, errors: errors.slice(0, 10) } 
    });
  } catch (error) {
    console.error("Error importing feedback:", error);
    return NextResponse.json({ error: "Failed to import feedback data" }, { status: 500 });
  }
}
