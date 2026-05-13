import { STATUS_LABELS } from "@/constants/status";
import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function notify({ userId, type, title, message, data }: NotifyParams) {
  await supabase.from("notifications").insert({
    user_id: userId, type, title, message, data: data || {},
  });
}

async function getAdminIds(): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  return data ? data.map((r) => r.user_id) : [];
}

async function getAdminEmails(): Promise<string[]> {
  const adminIds = await getAdminIds();
  if (adminIds.length === 0) return [];
  const { data } = await supabase.from("profiles").select("user_id")
    .in("user_id", adminIds);
  // get emails from auth.users via admin API isn't available client-side
  // Use the email from the admin user (hardcoded for now since single admin)
  // In production, store admin notification email in admin_settings
  const { data: settings } = await supabase.from("admin_settings").select("notification_email").eq("id", 1).single();
  if (settings?.notification_email) return [settings.notification_email];
  // Fallback: use known admin email
  return ["admin@mantaray.energy"];
}

async function sendEmail(subject: string, html: string) {
  try {
    const emails = await getAdminEmails();
    for (const to of emails) {
      await supabase.functions.invoke("send-notification-email", {
        body: { to, subject, html },
      });
    }
  } catch (e) {
    console.warn("[Email] Failed to send notification email:", e);
  }
}

function emailHtml(title: string, message: string, jobId?: string): string {
  const link = jobId ? `https://manta-claude-design.vercel.app/jobs/${jobId}` : "https://manta-claude-design.vercel.app";
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#F97316">Manta Ray Energy</h2>
      <h3>${title}</h3>
      <p>${message}</p>
      ${jobId ? `<p><a href="${link}" style="color:#F97316">View job details →</a></p>` : ""}
      <hr style="border:1px solid #eee;margin:20px 0" />
      <p style="color:#888;font-size:12px">Sent from Manta Ray Energy platform. <a href="${link}">Open dashboard</a>.</p>
    </div>
  `;
}

export async function notifyStatusChange(
  jobId: string, jobTitle: string, newStatus: string,
  ownerId?: string | null, assignedScaffolderIds?: string[]
) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  const msg = `Job "${jobTitle}" status updated to ${label}.`;

  const ownerStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
  if (ownerId && ownerStatuses.includes(newStatus)) {
    await notify({ userId: ownerId, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
  }

  const scaffolderStatuses = ["scheduled", "in_progress", "completed"];
  if (assignedScaffolderIds && scaffolderStatuses.includes(newStatus)) {
    for (const sid of assignedScaffolderIds) {
      await notify({ userId: sid, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
    }
  }

  // Notify assigned engineers about status changes
  const engineerStatuses = ["scheduled", "in_progress", "completed"];
  if (engineerStatuses.includes(newStatus)) {
    const { data: engAssigns } = await (supabase as any).from("job_assignments")
      .select("scaffolder_id")
      .eq("job_id", jobId)
      .eq("assignment_role", "engineer");
    if (engAssigns) {
      for (const ea of engAssigns) {
        await notify({ userId: ea.scaffolder_id, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
      }
    }
  }

  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({ userId: aid, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
  }
  // Email admins (fire-and-forget)
  sendEmail(`Job ${label}: ${jobTitle}`, emailHtml(`Job ${label}`, msg, jobId));
}

export async function notifyQuoteSubmitted(jobId: string, jobTitle: string, amount: number, _ownerId?: string | null) {
  const adminIds = await getAdminIds();
  const msg = `A quote of £${amount.toLocaleString()} has been submitted for "${jobTitle}".`;
  for (const aid of adminIds) {
    await notify({ userId: aid, type: "quote", title: "New Quote Received", message: msg, data: { job_id: jobId } });
  }
  sendEmail("New Quote Received", emailHtml("New Quote Received", msg, jobId));
}

export async function notifyQuoteDecision(scaffolderId: string, jobTitle: string, decision: string, jobId: string, finalPrice?: number) {
  await notify({
    userId: scaffolderId, type: "quote",
    title: `Quote ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
    message: `Your quote for "${jobTitle}" has been ${decision}.`,
    data: { job_id: jobId },
  });
}

export async function notifyOwnerFinalPrice(ownerId: string, jobTitle: string, finalPrice: number, jobId: string) {
  await notify({
    userId: ownerId, type: "quote_approved",
    title: "Job Quote Approved",
    message: `The quote for "${jobTitle}" has been approved at £${finalPrice.toLocaleString()}. We'll schedule the work date shortly.`,
    data: { job_id: jobId },
  });
}

export async function notifyPhotoUploaded(jobId: string, jobTitle: string, adminUserIds: string[]) {
  const msg = `New photos have been uploaded for job "${jobTitle}". Review pending.`;
  for (const adminId of adminUserIds) {
    await notify({ userId: adminId, type: "photo", title: "Photos Uploaded", message: msg, data: { job_id: jobId } });
  }
  sendEmail("Photos Uploaded", emailHtml("Photos Uploaded", msg, jobId));
}

export async function notifyScaffolderAssigned(scaffolderId: string, jobTitle: string, jobId: string) {
  await notify({
    userId: scaffolderId, type: "assignment",
    title: "New Job Assigned",
    message: `You have been assigned to job "${jobTitle}". Review the details and submit a quote.`,
    data: { job_id: jobId },
  });
}

export async function notifyEngineerAssigned(engineerId: string, jobTitle: string, jobId: string) {
  await notify({
    userId: engineerId, type: "assignment",
    title: "New Job Assigned",
    message: `You have been assigned to job "${jobTitle}" as an engineer. You can track the progress and complete the site report when ready.`,
    data: { job_id: jobId },
  });
}

export async function notifyOwnerPhotoSubmitted(ownerId: string, jobTitle: string, jobId: string) {
  await notify({
    userId: ownerId, type: "submission_confirmed",
    title: "Photos Submitted Successfully",
    message: `Thanks for submitting photos for "${jobTitle}". We're going to get quotes from scaffolders, approve this job with SolarEdge, and get back to you with a proper quote, timeline, and next steps.`,
    data: { job_id: jobId },
  });
}

export async function notifyJobEdited(jobId: string, jobTitle: string, editorId: string) {
  const msg = `Details for "${jobTitle}" have been updated.`;
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    if (aid !== editorId) {
      await notify({ userId: aid, type: "job_update", title: "Job Details Updated", message: msg, data: { job_id: jobId } });
    }
  }
  sendEmail("Job Details Updated", emailHtml("Job Details Updated", msg, jobId));
}

export async function notifySiteReportSubmitted(jobId: string, jobTitle: string, engineerId: string) {
  const msg = `The site report for "${jobTitle}" has been submitted by the engineer.`;
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({ userId: aid, type: "site_report", title: "Site Report Submitted", message: msg, data: { job_id: jobId } });
  }
  sendEmail("Site Report Submitted", emailHtml("Site Report Submitted", msg, jobId));
}

export async function notifySafetyChecklistComplete(jobId: string, notes: string, engineerId: string) {
  const msg = `Engineer has completed the safety checklist for job #${jobId.slice(0, 8)}.${notes ? ` Notes: ${notes.slice(0, 100)}` : ""}`;
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({ userId: aid, type: "safety_checklist", title: "Safety Checklist Completed", message: msg, data: { job_id: jobId, engineer_id: engineerId } });
  }
  sendEmail("Safety Checklist Completed", emailHtml("Safety Checklist Completed", msg, jobId));
}
