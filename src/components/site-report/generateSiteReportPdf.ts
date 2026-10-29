import { supabase } from "@/integrations/supabase/client";
import type { ReportFormData } from "./SiteReportForm";

/**
 * Generates a professional PDF matching the Manta Ray Energy site report template.
 * Uses jsPDF directly (no html2canvas) for clean, vector-quality output.
 */
export async function generateSiteReportPdf(
  data: ReportFormData,
  jobId: string,
  extras: { panelCount?: number | null } = {}
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF("p", "mm", "a4");
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const ML = 15; // margin left
  const MR = 15;
  const CW = W - ML - MR; // content width
  let y = 15;

  const BRAND = [249, 115, 22] as const; // orange #F97316
  const GRAY = [100, 100, 100] as const;
  const BLACK = [26, 26, 26] as const;
  const LIGHT_BG = [245, 245, 245] as const;

  const checkPage = (need: number) => {
    if (y + need > H - 15) {
      pdf.addPage();
      y = 15;
    }
  };

  const drawSectionHeader = (title: string) => {
    checkPage(14);
    pdf.setFillColor(...BRAND);
    pdf.rect(ML, y, CW, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, ML + 3, y + 5.5);
    y += 12;
    pdf.setTextColor(...BLACK);
  };

  const drawRow = (label: string, value: string, shaded = false) => {
    if (!value) return;
    const lines = pdf.splitTextToSize(value, CW - 50);
    const rowH = Math.max(7, lines.length * 5 + 2);
    checkPage(rowH);
    if (shaded) {
      pdf.setFillColor(...LIGHT_BG);
      pdf.rect(ML, y, CW, rowH, "F");
    }
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...GRAY);
    pdf.text(label, ML + 2, y + 4.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...BLACK);
    pdf.text(lines, ML + 50, y + 4.5);
    y += rowH;
  };

  const drawMultiline = (label: string, value: string) => {
    if (!value) return;
    checkPage(10);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...GRAY);
    pdf.text(label, ML + 2, y + 4.5);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...BLACK);
    const lines = pdf.splitTextToSize(value, CW - 4);
    for (const line of lines) {
      checkPage(5);
      pdf.text(line, ML + 2, y + 4);
      y += 5;
    }
    y += 2;
  };

  /* ── Header ── */
  pdf.setFillColor(...BRAND);
  pdf.rect(0, 0, W, 22, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Manta Ray Energy", ML, 10);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Site Visit Report", ML, 17);
  pdf.setFontSize(8);
  pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, W - MR - 40, 17);
  y = 28;

  /* ── 1. General Details ── */
  drawSectionHeader("General Details");
  let shade = false;
  const details: [string, string][] = [
    ["Engineer Name", data.engineer_name],
    ["Date of Visit", data.date_of_visit ? new Date(data.date_of_visit + "T00:00:00").toLocaleDateString("en-GB") : ""],
    ["Address", data.address],
    ["Case No.", data.case_no],
    ["Optimizer No.", data.optimizer_no],
    ["Panel Count", extras.panelCount != null ? String(extras.panelCount) : ""],
    ["Site ID", data.site_id],
    ["FSEs / Attendees", data.fse_attendees],
    ["Installer Details", data.installer_details],
    ["End-Customer", data.end_customer_details],
    ["Other Parties", data.other_parties],
  ];
  for (const [l, v] of details) {
    drawRow(l, v, shade);
    shade = !shade;
  }
  y += 4;

  /* ── 2. Purpose of Visit ── */
  drawSectionHeader("Purpose of Visit");
  drawMultiline("", data.purpose_of_visit);

  /* ── 3. Summary ── */
  drawSectionHeader("Summary");
  drawMultiline("", data.summary);

  /* ── 4. Supplied Materials Used ── */
  if (data.materials.some((m) => m.description)) {
    drawSectionHeader("Supplied Materials Used");
    checkPage(8);
    // Table header
    pdf.setFillColor(...LIGHT_BG);
    pdf.rect(ML, y, CW, 7, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...GRAY);
    const cols = [ML + 2, ML + 60, ML + 80, ML + 115];
    pdf.text("Description", cols[0], y + 4.5);
    pdf.text("Qty", cols[1], y + 4.5);
    pdf.text("Old Serial", cols[2], y + 4.5);
    pdf.text("New Serial", cols[3], y + 4.5);
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...BLACK);
    for (const mat of data.materials) {
      if (!mat.description) continue;
      checkPage(7);
      pdf.setFontSize(8);
      pdf.text(mat.description, cols[0], y + 4);
      pdf.text(mat.quantity || "1", cols[1], y + 4);
      pdf.text(mat.serial_old, cols[2], y + 4);
      pdf.text(mat.serial_new, cols[3], y + 4);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(ML, y + 6, ML + CW, y + 6);
      y += 7;
    }
    y += 4;
  }

  /* ── 5. Comments ── */
  if (data.engineer_comments) {
    drawSectionHeader("Comments from Engineers / Attendees");
    drawMultiline("", data.engineer_comments);
  }

  /* ── 6. Follow-Up ── */
  if (data.follow_up_action) {
    drawSectionHeader("Follow-Up Action");
    drawMultiline("", data.follow_up_action);
  }

  /* ── 7. Photos: report evidence + every photo uploaded to the job ── */
  // Two-column grid; each image keeps its real aspect ratio (no stretching).
  const GAP = 6;
  const COL_W = (CW - GAP) / 2;
  const MAX_IMG_H = 110;
  const drawPhotoGrid = async (title: string, urls: string[]) => {
    if (urls.length === 0) return;
    drawSectionHeader(title);
    let col = 0;
    let rowH = 0;
    for (const url of urls) {
      const img = await loadImage(url);
      let w = COL_W;
      let h = img ? (w * img.height) / img.width : 8;
      if (img && h > MAX_IMG_H) { h = MAX_IMG_H; w = (h * img.width) / img.height; }
      if (col === 0) checkPage(h + 4);
      else if (y + h > H - 15) { y += rowH + GAP; col = 0; rowH = 0; checkPage(h + 4); }
      const x = ML + col * (COL_W + GAP) + (COL_W - w) / 2;
      if (img) {
        pdf.addImage(img.dataUrl, "JPEG", x, y, w, h);
      } else {
        pdf.setFontSize(8);
        pdf.setTextColor(...GRAY);
        pdf.text("[Image could not be loaded]", ML + col * (COL_W + GAP) + 2, y + 4);
      }
      rowH = Math.max(rowH, h);
      col = (col + 1) % 2;
      if (col === 0) { y += rowH + GAP; rowH = 0; }
    }
    if (col === 1) y += rowH + GAP;
  };

  await drawPhotoGrid("Evidence of System Performance", data.evidence_photos || []);

  const groups = await fetchJobPhotoGroups(jobId);
  for (const g of groups) await drawPhotoGrid(g.title, g.urls);

  /* ── Footer on last page ── */
  pdf.setFontSize(7);
  pdf.setTextColor(...GRAY);
  pdf.text("Manta Ray Energy — Confidential", ML, H - 8);
  pdf.text(`Job: ${jobId.slice(0, 8)}`, W - MR - 25, H - 8);

  return pdf.output("blob");
}

/** Loads an image, applies EXIF orientation and downsizes it so the PDF stays small. */
async function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}

/** Every photo uploaded to the job, grouped the same way the job page shows them. */
async function fetchJobPhotoGroups(jobId: string): Promise<{ title: string; urls: string[] }[]> {
  const [{ data: photos }, { data: assignments }] = await Promise.all([
    supabase.from("photos").select("url, uploader_id, photo_category, created_at").eq("job_id", jobId).order("created_at"),
    supabase.from("job_assignments").select("scaffolder_id, assignment_role").eq("job_id", jobId),
  ]);
  if (!photos?.length) return [];
  const engineers = new Set((assignments || []).filter((a) => a.assignment_role === "engineer").map((a) => a.scaffolder_id));
  const scaffolders = new Set((assignments || []).filter((a) => a.assignment_role !== "engineer").map((a) => a.scaffolder_id));
  const pick = (fn: (p: any) => boolean) => photos.filter(fn).map((p: any) => p.url).filter(Boolean);
  const cat = (p: any) => p.photo_category;
  const isEng = (p: any) => engineers.has(p.uploader_id);
  const isScaf = (p: any) => scaffolders.has(p.uploader_id);
  return [
    { title: "Before Roof Work", urls: pick((p) => isEng(p) && cat(p) === "before") },
    { title: "After Roof Work", urls: pick((p) => isEng(p) && cat(p) === "after") },
    { title: "Before Scaffolding", urls: pick((p) => isScaf(p) && cat(p) === "before") },
    { title: "After Scaffolding", urls: pick((p) => isScaf(p) && cat(p) === "after") },
    { title: "Site Photos", urls: pick((p) => !(cat(p) === "before" || cat(p) === "after") || (!isEng(p) && !isScaf(p))) },
  ];
}
