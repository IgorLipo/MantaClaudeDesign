import { STATUS_LABELS } from "@/constants/status";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface ExportRow {
  "Case No.": string;
  "Address": string;
  "Status": string;
  "Panel Count": number | string;
  "Scaffolding Price (£)": number | string;
  "Scaffolder's Name": string;
  "Engineer's Name": string;
  "Client Name": string;
  "Optimizer No.": string;
  "Google Maps Link": string;
}

const mapsLink = (lat: number | null, lng: number | null, address: string) => {
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return "";
};

export async function exportAllJobsToExcel(): Promise<void> {
  // Pull everything needed
  const [{ data: jobs }, { data: assigns }, { data: profiles }, { data: reports }] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    supabase.from("job_assignments").select("job_id, scaffolder_id, assignment_role"),
    supabase.from("profiles").select("user_id, first_name, last_name"),
    (supabase as any).from("site_reports").select("job_id, optimizer_no, report_data"),
  ]);

  const profileMap = new Map<string, string>();
  (profiles || []).forEach((p: any) => {
    profileMap.set(p.user_id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown");
  });

  const reportMap = new Map<string, any>();
  (reports || []).forEach((r: any) => reportMap.set(r.job_id, r));

  const rows: ExportRow[] = (jobs || []).map((job: any) => {
    const jobAssigns = (assigns || []).filter((a: any) => a.job_id === job.id);
    const scaffolderNames = jobAssigns
      .filter((a: any) => a.assignment_role !== "engineer")
      .map((a: any) => profileMap.get(a.scaffolder_id) || "Unknown")
      .join(", ");
    const engineerNames = jobAssigns
      .filter((a: any) => a.assignment_role === "engineer")
      .map((a: any) => profileMap.get(a.scaffolder_id) || "Unknown")
      .join(", ");
    const clientName = job.owner_id ? (profileMap.get(job.owner_id) || "—") : "—";
    const report = reportMap.get(job.id);
    const optimizerNo = report?.optimizer_no || report?.report_data?.optimizer_no || "";

    return {
      "Case No.": job.case_no || "",
      "Address": job.address || "",
      "Status": STATUS_LABELS[job.status] || job.status,
      "Panel Count": job.panel_count ?? "",
      "Scaffolding Price (£)": job.final_price ?? "",
      "Scaffolder's Name": scaffolderNames,
      "Engineer's Name": engineerNames,
      "Client Name": clientName,
      "Optimizer No.": optimizerNo,
      "Google Maps Link": mapsLink(job.lat, job.lng, job.address),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  // Set sensible column widths
  ws["!cols"] = [
    { wch: 16 }, { wch: 40 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
    { wch: 28 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jobs");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `manta-ray-jobs-${stamp}.xlsx`);
}
