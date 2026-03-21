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

// Helper: get all admin user IDs
async function getAdminIds(): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  return data ? data.map((r) => r.user_id) : [];
}

// Notify on job status change — admin gets all, owner gets status updates, scaffolder gets relevant ones
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

  // Owner gets status updates for owner-facing statuses
  const ownerStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
  if (ownerId && ownerStatuses.includes(newStatus)) {
    await notify({ userId: ownerId, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
  }

  // Scaffolders get status updates for their relevant statuses
  const scaffolderStatuses = ["scheduled", "in_progress", "completed", "cancelled", "quote_pending"];
  if (assignedScaffolderIds && scaffolderStatuses.includes(newStatus)) {
    for (const sid of assignedScaffolderIds) {
      await notify({ userId: sid, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
    }
  }

  // Admins always get status change notifications
  const adminIds = await getAdminIds();
  for (const aid of adminIds) {
    await notify({ userId: aid, type: "status_change", title: `Job ${label}`, message: msg, data: { job_id: jobId } });
  }
}

// Quote submitted → notify ADMIN only (not the owner)
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

// Quote decision → notify scaffolder. If accepted, also notify owner with final price
export async function notifyQuoteDecision(scaffolderId: string, jobTitle: string, decision: string, jobId: string, finalPrice?: number) {
  await notify({
    userId: scaffolderId, type: "quote",
    title: `Quote ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
    message: `Your quote for "${jobTitle}" has been ${decision}.`,
    data: { job_id: jobId },
  });
}

// Notify owner about final approved price (separate from scaffolder quotes)
export async function notifyOwnerFinalPrice(ownerId: string, jobTitle: string, finalPrice: number, jobId: string) {
  await notify({
    userId: ownerId, type: "quote_approved",
    title: "Job Quote Approved",
    message: `The quote for "${jobTitle}" has been approved at £${finalPrice.toLocaleString()}. We'll schedule the work date shortly.`,
    data: { job_id: jobId },
  });
}

// Photo uploaded → notify admins
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

// Scaffolder assigned → notify scaffolder
export async function notifyScaffolderAssigned(scaffolderId: string, jobTitle: string, jobId: string) {
  await notify({
    userId: scaffolderId, type: "assignment",
    title: "New Job Assigned",
    message: `You have been assigned to job "${jobTitle}". Review the details and submit a quote.`,
    data: { job_id: jobId },
  });
}

// Notify owner after photo submission
export async function notifyOwnerPhotoSubmitted(ownerId: string, jobTitle: string, jobId: string) {
  await notify({
    userId: ownerId, type: "submission_confirmed",
    title: "Photos Submitted Successfully",
    message: `Thanks for submitting photos for "${jobTitle}". We're going to get quotes from scaffolders, approve this job with SolarEdge, and get back to you with a proper quote, timeline, and next steps.`,
    data: { job_id: jobId },
  });
}

// Job detail edited → notify admin
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
