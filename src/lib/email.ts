import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;

// Reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials are not fully configured. Email not sent.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Faculty Appraisal Portal" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// ==========================================
// EMAIL TEMPLATES
// ==========================================

const APP_URL = process.env.APP_URL || "https://facultyappraisalportal-eight.vercel.app";

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #18181b; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #E31E24; padding: 24px; text-align: center; }
    .header img { height: 40px; margin-bottom: 12px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 32px; font-size: 16px; line-height: 1.6; }
    .btn { display: inline-block; background-color: #E31E24; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; text-align: center; }
    .footer { background-color: #f4f4f5; padding: 24px; text-align: center; font-size: 13px; color: #71717a; border-top: 1px solid #e4e4e7; }
    .highlight { background-color: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${APP_URL}/institute-logo.svg" alt="Institute logo" />
      <h1>Faculty Performance Appraisal Portal</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the Northbridge Institute Faculty Appraisal Portal. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const getAssignmentEmailHtml = (facultyName: string, cycleName: string, deadline: string, loginUrl: string) => {
  return baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p>You have been assigned to the <strong>${cycleName}</strong> for your Faculty Performance Appraisal.</p>
    <p>The self-assessment window is now open. Please log in to the portal to review the appraisal criteria and submit your self-evaluation.</p>
    <p><strong>Submission Deadline:</strong> <span class="highlight">${deadline}</span></p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Log In to Portal</a>
    </div>
    <p>If you have any questions, please contact the administration office.</p>
    <p>Best regards,<br>Appraisal Office</p>
  `);
};

export const getDailyReminderEmailHtml = (facultyName: string, cycleName: string, deadline: string, loginUrl: string) => {
  return baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p>This is a reminder that you have pending tasks for the <strong>${cycleName}</strong> in the Faculty Appraisal Portal.</p>
    <p>You have not yet submitted your self-assessment. Please ensure you complete it before the deadline to avoid any delays in the appraisal process.</p>
    <p><strong>Submission Deadline:</strong> <span class="highlight">${deadline}</span></p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Complete Assessment Now</a>
    </div>
    <p>If you have already submitted your assessment in the last few minutes, please ignore this email.</p>
    <p>Best regards,<br>Appraisal Office</p>
  `);
};

export const getLastDayReminderEmailHtml = (facultyName: string, cycleName: string, deadlineTime: string, loginUrl: string) => {
  return baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p style="color: #E31E24; font-weight: bold; font-size: 18px;">URGENT REMINDER: TODAY IS THE DEADLINE</p>
    <p>The deadline to submit your self-assessment for the <strong>${cycleName}</strong> is <strong>TODAY</strong>.</p>
    <p>Our records indicate that you have not yet submitted your evaluation. The portal will automatically lock submissions at <span class="highlight">${deadlineTime}</span>.</p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Submit Assessment Immediately</a>
    </div>
    <p>Best regards,<br>Appraisal Office</p>
  `);
};

export const getAcknowledgementEmailHtml = (facultyName: string, cycleName: string, timestamp: string) => {
  return baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p><strong>Thank you!</strong></p>
    <p>We have successfully received your self-assessment submission for the <strong>${cycleName}</strong>.</p>
    <p><strong>Submission Details:</strong></p>
    <ul>
      <li>Date & Time: ${timestamp}</li>
      <li>Status: Successfully Recorded</li>
    </ul>
    <p>Your appraisal will now be reviewed by the evaluation committee. You can log in to the portal at any time to view a read-only copy of your submission.</p>
    <p>Best regards,<br>Appraisal Office</p>
  `);
};

export const getCycleClosedEmailHtml = (facultyName: string, cycleName: string) => {
  return baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p>This is to inform you that the submission window for the <strong>${cycleName}</strong> has now <strong>closed</strong>.</p>
    <p>No further self-assessment submissions or edits can be accepted at this time. The administration and evaluation committees will now proceed with the next phase of the appraisal process.</p>
    <p>Thank you for your participation.</p>
    <p>Best regards,<br>Appraisal Office</p>
  `);
};
