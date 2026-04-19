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

  /* ── 7. Evidence Photos ── */
  if (data.evidence_photos.length > 0) {
    drawSectionHeader("Evidence of System Performance");
    for (const url of data.evidence_photos) {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const b64 = await blobToBase64(blob);
        const imgType = blob.type.includes("png") ? "PNG" : "JPEG";
        checkPage(75);
        pdf.addImage(b64, imgType, ML, y, CW * 0.6, 65);
        y += 70;
      } catch {
        checkPage(8);
        pdf.setFontSize(8);
        pdf.setTextColor(...GRAY);
        pdf.text("[Image could not be loaded]", ML + 2, y + 4);
        y += 8;
      }
    }
  }

  /* ── Footer on last page ── */
  pdf.setFontSize(7);
  pdf.setTextColor(...GRAY);
  pdf.text("Manta Ray Energy — Confidential", ML, H - 8);
  pdf.text(`Job: ${jobId.slice(0, 8)}`, W - MR - 25, H - 8);

  return pdf.output("blob");
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
