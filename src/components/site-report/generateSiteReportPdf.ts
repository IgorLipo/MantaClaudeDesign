import { supabase } from "@/integrations/supabase/client";
import type { ReportFormData } from "./SiteReportForm";
import { REPORT_LOGO_PNG, REPORT_LOGO_RATIO } from "./reportLogo";

type RGB = readonly [number, number, number];

/**
 * Site Visit Report PDF (A4, jsPDF). Matches the approved Manta-Ray Energy design:
 * logo header with orange rule, Job / Case / Date cards, orange-bar section titles,
 * two-column details table, navy materials table, photo cards, and a contact footer
 * with "Job: x | Page n of m" on every page.
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
  const M = 16;
  const CW = W - M * 2;
  const TOP = 16;
  const BOTTOM = H - 24; // footer starts below this
  let y = 0;

  const NAVY: RGB = [30, 36, 51];
  const ORANGE: RGB = [249, 115, 22];
  const INK: RGB = [17, 24, 39];
  const BODY: RGB = [55, 65, 81];
  const MUTED: RGB = [107, 114, 128];
  const RULE: RGB = [229, 231, 235];
  const PANEL: RGB = [244, 245, 247];

  const jobNo = jobId.slice(0, 8);
  const fmtDate = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB") : "");
  const visitDate = fmtDate(data.date_of_visit);

  const font = (size: number, style: "normal" | "bold" = "normal", color: RGB = BODY, family = "helvetica") => {
    pdf.setFont(family, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  const ensure = (need: number) => {
    if (y + need > BOTTOM) {
      pdf.addPage();
      y = TOP;
    }
  };

  const section = (title: string, keepWith = 10) => {
    ensure(12 + keepWith);
    y += 7;
    pdf.setFillColor(...ORANGE);
    pdf.rect(M, y - 3.6, 1, 4.4, "F");
    font(9.5, "bold", ORANGE);
    pdf.text(title.toUpperCase(), M + 4, y, { charSpace: 0.35 });
    y += 6;
  };

  const paragraph = (text: string) => {
    font(9, "normal", BODY);
    const lines: string[] = pdf.splitTextToSize(text, CW);
    for (const line of lines) {
      ensure(5);
      pdf.text(line, M, y + 3);
      y += 4.4;
    }
    y += 1;
  };

  /* ── Header ── */
  const logoW = 52;
  pdf.addImage(REPORT_LOGO_PNG, "PNG", M, 12, logoW, logoW * REPORT_LOGO_RATIO);
  font(20, "bold", INK);
  pdf.text("Site Visit Report", W - M, 24, { align: "right" });
  font(8, "normal", MUTED);
  pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, W - M, 30, { align: "right" });
  pdf.setDrawColor(...ORANGE);
  pdf.setLineWidth(0.7);
  pdf.line(M, 37, W - M, 37);
  y = 45;

  /* ── Job / Case / Date cards ── */
  const cards: [string, string][] = [
    ["JOB NO.", jobNo],
    ["CASE NO.", data.case_no || "-"],
    ["DATE OF VISIT", visitDate || "-"],
  ];
  const cg = 4;
  const cw = (CW - cg * 2) / 3;
  cards.forEach(([label, value], i) => {
    const x = M + i * (cw + cg);
    pdf.setFillColor(...PANEL);
    pdf.rect(x, y, cw, 13.5, "F");
    pdf.setFillColor(...ORANGE);
    pdf.rect(x, y, 0.8, 13.5, "F");
    font(6, "normal", MUTED);
    pdf.text(label, x + 4.5, y + 4.8, { charSpace: 0.3 });
    font(9, "bold", INK);
    pdf.text(value, x + 4.5, y + 9.8);
  });
  y += 13.5 + 4;

  /* ── General details (two label/value pairs per row) ── */
  const details: [string, string][] = ([
    ["Engineer Name", data.engineer_name],
    ["Date of Visit", visitDate],
    ["Address", data.address],
    ["Case No.", data.case_no],
    ["Site ID", data.site_id],
    ["Optimizer No.", data.optimizer_no],
    ["Panel Count", extras.panelCount != null ? String(extras.panelCount) : ""],
    ["FSEs / Attendees", data.fse_attendees],
    ["Installer Details", data.installer_details],
    ["End-Customer", data.end_customer_details],
    ["Other Parties", data.other_parties],
  ] as [string, string][]).filter(([, v]) => !!v);
  if (details.length) {
    section("General Details");
    const half = CW / 2;
    const valW = half - 38;
    for (let i = 0; i < details.length; i += 2) {
      const pair = details.slice(i, i + 2);
      font(8, "bold", INK);
      const wrapped = pair.map(([, v]) => pdf.splitTextToSize(v, valW) as string[]);
      const rh = Math.max(...wrapped.map((l) => l.length)) * 3.6 + 4.4;
      ensure(rh);
      pair.forEach(([label], j) => {
        const x = M + j * half;
        font(8, "normal", MUTED);
        pdf.text(label, x, y + 4);
        font(8, "bold", INK);
        pdf.text(wrapped[j], x + 37, y + 4);
      });
      y += rh;
      pdf.setDrawColor(...RULE);
      pdf.setLineWidth(0.2);
      pdf.line(M, y, W - M, y);
    }
    y += 2;
  }

  if (data.purpose_of_visit) { section("Purpose of Visit"); paragraph(data.purpose_of_visit); }
  if (data.summary) { section("Summary"); paragraph(data.summary); }

  /* ── Materials ── */
  const mats = data.materials.filter((m) => m.description);
  if (mats.length) {
    section("Supplied Materials Used", 18);
    const cols = [M + 3, M + 64, M + 82, M + 132];
    pdf.setFillColor(...NAVY);
    pdf.rect(M, y, CW, 9, "F");
    font(6.8, "bold", [255, 255, 255]);
    ["DESCRIPTION", "QTY", "OLD SERIAL", "NEW SERIAL"].forEach((t, i) => pdf.text(t, cols[i], y + 5.7, { charSpace: 0.3 }));
    y += 9;
    mats.forEach((m, i) => {
      ensure(9.5);
      if (i % 2 === 1) {
        pdf.setFillColor(...PANEL);
        pdf.rect(M, y, CW, 9.5, "F");
      }
      font(8, "normal", INK);
      pdf.text((pdf.splitTextToSize(m.description, 58) as string[])[0], cols[0], y + 6);
      pdf.text(m.quantity || "1", cols[1], y + 6);
      font(7.8, "normal", INK, "courier");
      pdf.text(m.serial_old || "-", cols[2], y + 6);
      pdf.text(m.serial_new || "-", cols[3], y + 6);
      y += 9.5;
      pdf.setDrawColor(...RULE);
      pdf.line(M, y, W - M, y);
    });
    y += 2;
  }

  if (data.engineer_comments) { section("Comments from Engineers / Attendees"); paragraph(data.engineer_comments); }
  if (data.follow_up_action) { section("Follow-Up Action"); paragraph(data.follow_up_action); }

  /* ── Photos: rounded cards, 3 per row, image fills the card without stretching ── */
  const COLS = 3;
  const GAP = 5;
  const CARD_W = (CW - GAP * (COLS - 1)) / COLS;
  const IMG_H = 78;
  const CAP_H = 11;
  let photosStarted = false;
  const drawPhotoSection = async (title: string, urls: string[]) => {
    if (!urls.length) return;
    const imgs = await Promise.all(urls.map((u) => loadImage(u, CARD_W / IMG_H)));
    if (!photosStarted) { pdf.addPage(); y = TOP - 7; photosStarted = true; }
    section(title, IMG_H + CAP_H);
    for (let i = 0; i < imgs.length; i++) {
      const col = i % COLS;
      if (col === 0 && i > 0) y += IMG_H + CAP_H + GAP;
      if (col === 0 && y + IMG_H + CAP_H > BOTTOM) {
        pdf.addPage();
        y = TOP - 7;
        section(`${title} (continued)`, IMG_H + CAP_H);
      }
      const x = M + col * (CARD_W + GAP);
      const img = imgs[i];
      if (img) {
        pdf.addImage(img.dataUrl, "JPEG", x, y, CARD_W, IMG_H);
      } else {
        pdf.setFillColor(...PANEL);
        pdf.rect(x, y, CARD_W, IMG_H, "F");
        font(7.5, "normal", MUTED);
        pdf.text("Image could not be loaded", x + CARD_W / 2, y + IMG_H / 2, { align: "center" });
      }
      pdf.setFillColor(...ORANGE);
      pdf.rect(x, y + IMG_H, CARD_W, 0.5, "F");
      font(7.5, "bold", INK);
      pdf.text(title, x + 3, y + IMG_H + 4.6);
      font(7, "normal", BODY);
      pdf.text(`Photo ${i + 1} of ${imgs.length}`, x + 3, y + IMG_H + 8.6);
      pdf.setDrawColor(...RULE);
      pdf.setLineWidth(0.25);
      pdf.roundedRect(x, y, CARD_W, IMG_H + CAP_H, 1.6, 1.6, "S");
    }
    y += IMG_H + CAP_H + GAP;
  };

  await drawPhotoSection("Evidence of System Performance", data.evidence_photos || []);
  const groups = await fetchJobPhotoGroups(jobId);
  for (const g of groups) await drawPhotoSection(g.title, g.urls);

  /* ── Footer on every page ── */
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.2);
    pdf.line(M, H - 18.5, W - M, H - 18.5);
    font(6.6, "bold", INK);
    pdf.text("Manta-Ray Energy", M + 3, H - 13.5);
    font(6.6, "normal", BODY);
    pdf.text("Office: 3 Hoop Lane, NW11 8JR", M + 32, H - 13.5);
    pdf.text("Tel: 020 7205 7355", M + 78, H - 13.5);
    pdf.text("info@manta-ray-energy.com", M + 107, H - 13.5);
    pdf.text("manta-ray-energy.com", W - M - 3, H - 13.5, { align: "right" });
    font(6, "normal", [156, 163, 175]);
    pdf.text("Manta Ray Energy — Confidential", M, H - 9.3);
    pdf.text(`Job: ${jobNo}  |  Page ${p} of ${pages}`, W - M, H - 9.3, { align: "right" });
  }

  return pdf.output("blob");
}

/** Loads an image, applies EXIF orientation and downsizes it so the PDF stays small. */
/** With `cropRatio` (width / height) the photo is centre-cropped to fill that frame, never stretched. */
async function loadImage(url: string, cropRatio?: number): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
    let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
    if (cropRatio) {
      if (sw / sh > cropRatio) { sw = sh * cropRatio; sx = (bmp.width - sw) / 2; }
      else { sh = sw / cropRatio; sy = (bmp.height - sh) / 2; }
    }
    const scale = Math.min(1, 1200 / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
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
