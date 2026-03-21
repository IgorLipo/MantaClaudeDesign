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

export async function notifyStatusChange(
  jobId: string, jobTitle: string, newStatus: string,
  ownerId?: string | null, assignedScaffolderIds?: string[]
) {
  const statusLabels: Record<string, string> = {
    draft: "Draft", submitted: "Submitted", photo_review: "Photo Review",
    quote_pending: "Quote Pending", quote_submitted: "Quote Submitted",
    negotiating: "Negotiating", scheduled: "Scheduled",
    in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
  };
  const label = statusLabels[newStatus] || newStatus;
  const msg = `Job "${jobTitle}" status updated to ${label}.`;

  const ownerStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
  if (ownerId && ownerStatuses.includes(newStatus)) {
    await notify({ userId: ownerId, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
  }

  const scaffolderStatuses = ["scheduled", "in_progress", "completed", "cancelled", "quote_pending"];
  if (assignedScaffolderIds && scaffolderStatuses.includes(newStatus)) {
    for (const sid of assignedScaffolderIds) {
      await notify({ userId: sid, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
    }
  }

  // Notify assigned engineers about status changes
  const engineerStatuses = ["scheduled", "in_progress", "completed"];
  if (engineerStatuses.includes(newStatus)) {
    const { data: engAssigns } = await supabase.from("job_assignments")
      .select("scaffolder_id")
      .eq("job_id", jobId)
      .eq("assignment_role" as any, "engineer");
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
}

export async function notifyQuoteSubmitted(jobId: string, jobTitle: string, amount: number, _ownerId?: string | null) {
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({
      userId: aid, type: "quote",
      title: "New Quote Received",
      message: `A quote of £${amount.toLocaleString()} has been submitted for "${jobTitle}".`,
      data: { job_id: jobId },
    });
  }
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
  for (const adminId of adminUserIds) {
    await notify({
      userId: adminId, type: "photo",
      title: "Photos Uploaded",
      message: `New photos have been uploaded for job "${jobTitle}". Review pending.`,
      data: { job_id: jobId },
    });
  }
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
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    if (aid !== editorId) {
      await notify({
        userId: aid, type: "job_update",
        title: "Job Details Updated",
        message: `Details for "${jobTitle}" have been updated.`,
        data: { job_id: jobId },
      });
    }
  }
}

export async function notifySiteReportSubmitted(jobId: string, jobTitle: string, engineerId: string) {
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({
      userId: aid, type: "site_report",
      title: "Site Report Submitted",
      message: `The site report for "${jobTitle}" has been submitted by the engineer.`,
      data: { job_id: jobId },
    });
  }
}
