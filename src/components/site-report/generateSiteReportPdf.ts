import { supabase } from "@/integrations/supabase/client";
import type { ReportFormData } from "./SiteReportForm";

type RGB = readonly [number, number, number];

/**
 * Site Visit Report PDF (A4, jsPDF, vector text).
 * Layout: dark cover band, key-facts strip, numbered sections with hairline rules,
 * a clean materials table, then photo pages in a two-column grid that keeps each
 * photo's real proportions. Every page gets a running header and "Page x of y" footer.
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
  const M = 18; // side margins
  const CW = W - M * 2;
  const TOP = 24; // content start on continuation pages
  const BOTTOM = H - 18; // content limit above footer
  let y = 0;

  const INK: RGB = [24, 24, 27];
  const BODY: RGB = [55, 55, 60];
  const MUTED: RGB = [120, 120, 128];
  const RULE: RGB = [226, 226, 230];
  const PANEL: RGB = [246, 246, 248];
  const BRAND: RGB = [249, 115, 22]; // #F97316
  const DARK: RGB = [24, 24, 27];

  const caseNo = data.case_no || jobId.slice(0, 8).toUpperCase();
  const visitDate = data.date_of_visit
    ? new Date(data.date_of_visit + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const font = (size: number, style: "normal" | "bold" = "normal", color: RGB = BODY) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  const newPage = () => {
    pdf.addPage();
    // Running header on continuation pages
    font(8, "bold", INK);
    pdf.text("MANTA RAY ENERGY", M, 12);
    font(8, "normal", MUTED);
    pdf.text(`Site Visit Report  ·  Case ${caseNo}`, W - M, 12, { align: "right" });
    pdf.setDrawColor(...BRAND);
    pdf.setLineWidth(0.6);
    pdf.line(M, 15, M + 12, 15);
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.2);
    pdf.line(M + 12, 15, W - M, 15);
    y = TOP;
  };

  const ensure = (need: number) => {
    if (y + need > BOTTOM) newPage();
  };

  let sectionNo = 0;
  const section = (title: string, keepWith = 12) => {
    ensure(14 + keepWith);
    sectionNo += 1;
    y += 4;
    font(9, "bold", BRAND);
    pdf.text(String(sectionNo).padStart(2, "0"), M, y);
    font(11, "bold", INK);
    pdf.text(title.toUpperCase(), M + 9, y, { charSpace: 0.3 });
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + 3, W - M, y + 3);
    y += 9;
  };

  const paragraph = (text: string, color: RGB = BODY, size = 10, indent = 0) => {
    font(size, "normal", color);
    const lines: string[] = pdf.splitTextToSize(text, CW - indent);
    const lh = size * 0.45;
    for (const line of lines) {
      ensure(lh + 1);
      pdf.text(line, M + indent, y + lh * 0.8);
      y += lh;
    }
    y += 3;
  };

  /* ── Cover band ── */
  pdf.setFillColor(...DARK);
  pdf.rect(0, 0, W, 46, "F");
  pdf.setFillColor(...BRAND);
  pdf.rect(0, 46, W, 1.6, "F");
  font(9, "bold", BRAND);
  pdf.text("MANTA RAY ENERGY", M, 15, { charSpace: 0.8 });
  font(24, "bold", [255, 255, 255]);
  pdf.text("Site Visit Report", M, 29);
  font(10, "normal", [190, 190, 196]);
  pdf.text(data.address || "", M, 37, { maxWidth: CW - 55 });
  font(8, "normal", [160, 160, 168]);
  pdf.text("CASE NO.", W - M, 15, { align: "right", charSpace: 0.5 });
  font(20, "bold", [255, 255, 255]);
  pdf.text(caseNo, W - M, 25, { align: "right" });
  font(8, "normal", [160, 160, 168]);
  pdf.text(`Issued ${new Date().toLocaleDateString("en-GB")}`, W - M, 37, { align: "right" });
  y = 56;

  /* ── Key facts strip ── */
  const facts: [string, string][] = [
    ["DATE OF VISIT", visitDate || "-"],
    ["ENGINEER", data.engineer_name || "-"],
    ["PURPOSE", data.purpose_of_visit || "-"],
    ...(extras.panelCount != null ? [["PANELS", String(extras.panelCount)] as [string, string]] : []),
  ];
  const gap = 3;
  const fw = (CW - gap * (facts.length - 1)) / facts.length;
  facts.forEach(([label, value], i) => {
    const x = M + i * (fw + gap);
    pdf.setFillColor(...PANEL);
    pdf.roundedRect(x, y, fw, 17, 1.5, 1.5, "F");
    font(6.5, "bold", MUTED);
    pdf.text(label, x + 4, y + 6, { charSpace: 0.4 });
    font(9.5, "bold", INK);
    const wraps = pdf.splitTextToSize(value, fw - 8).length > 1;
    if (wraps) font(8, "bold", INK);
    pdf.text(pdf.splitTextToSize(value, fw - 8).slice(0, 2), x + 4, wraps ? y + 10.5 : y + 12.5);
  });
  y += 24;

  /* ── 01 Site & attendees ── */
  const details: [string, string][] = [
    ["Address", data.address],
    ["Site ID", data.site_id],
    ["Optimizer No.", data.optimizer_no],
    ["FSEs / Attendees", data.fse_attendees],
    ["Installer", data.installer_details],
    ["End customer", data.end_customer_details],
    ["Other parties", data.other_parties],
  ].filter(([, v]) => !!v) as [string, string][];
  if (details.length) {
    section("Site details");
    for (const [label, value] of details) {
      font(9.5, "normal", BODY);
      const lines: string[] = pdf.splitTextToSize(value, CW - 48);
      const rh = Math.max(7.5, lines.length * 4.6 + 3);
      ensure(rh);
      font(8, "bold", MUTED);
      pdf.text(label.toUpperCase(), M, y + 5, { charSpace: 0.3 });
      font(9.5, "normal", INK);
      pdf.text(lines, M + 48, y + 5);
      y += rh;
      pdf.setDrawColor(...RULE);
      pdf.line(M, y, W - M, y);
    }
    y += 4;
  }

  /* ── Work summary ── */
  if (data.summary) {
    section("Work carried out");
    paragraph(data.summary, INK, 10.5);
  }

  /* ── Materials ── */
  const mats = data.materials.filter((m) => m.description);
  if (mats.length) {
    section("Materials supplied", 20);
    const cols = [
      { t: "DESCRIPTION", x: M + 4 },
      { t: "QTY", x: M + 74 },
      { t: "OLD SERIAL", x: M + 90 },
      { t: "NEW SERIAL", x: M + 132 },
    ];
    pdf.setFillColor(...DARK);
    pdf.rect(M, y, CW, 8, "F");
    font(7.5, "bold", [255, 255, 255]);
    cols.forEach((c) => pdf.text(c.t, c.x, y + 5.3, { charSpace: 0.3 }));
    y += 8;
    mats.forEach((m, i) => {
      ensure(8);
      if (i % 2 === 1) {
        pdf.setFillColor(...PANEL);
        pdf.rect(M, y, CW, 8, "F");
      }
      font(9, "normal", INK);
      pdf.text(pdf.splitTextToSize(m.description, 66)[0], cols[0].x, y + 5.3);
      pdf.text(m.quantity || "1", cols[1].x, y + 5.3);
      pdf.setFont("courier", "normal");
      pdf.text(m.serial_old || "-", cols[2].x, y + 5.3);
      pdf.text(m.serial_new || "-", cols[3].x, y + 5.3);
      y += 8;
    });
    pdf.setDrawColor(...RULE);
    pdf.line(M, y, W - M, y);
    y += 6;
  }

  /* ── Comments ── */
  if (data.engineer_comments) {
    section("Engineer comments");
    paragraph(data.engineer_comments, INK);
  }

  /* ── Follow-up (highlighted callout) ── */
  if (data.follow_up_action) {
    section("Follow-up action", 20);
    font(10, "normal", INK);
    const lines: string[] = pdf.splitTextToSize(data.follow_up_action, CW - 12);
    const bh = lines.length * 4.6 + 8;
    ensure(bh);
    pdf.setFillColor(255, 244, 235);
    pdf.rect(M, y, CW, bh, "F");
    pdf.setFillColor(...BRAND);
    pdf.rect(M, y, 1.4, bh, "F");
    pdf.text(lines, M + 7, y + 6.5);
    y += bh + 6;
  }

  /* ── Photos ── */
  // Two-column grid; each image keeps its real aspect ratio (no stretching).
  const GAP = 6;
  const COL_W = (CW - GAP) / 2;
  const MAX_IMG_H = 105;
  let photosStarted = false;
  const drawPhotoGrid = async (title: string, urls: string[]) => {
    if (urls.length === 0) return;
    const imgs = await Promise.all(urls.map(loadImage));
    const size = (img: (typeof imgs)[number]) => {
      let w = COL_W;
      let h = img ? (w * img.height) / img.width : 20;
      if (img && h > MAX_IMG_H) { h = MAX_IMG_H; w = (h * img.width) / img.height; }
      return { w, h };
    };
    if (!photosStarted) { newPage(); photosStarted = true; }
    // Keep the section title on the same page as its first row of photos
    const firstRowH = Math.max(...imgs.slice(0, 2).map((i) => size(i).h));
    section(`${title}  (${imgs.length})`, firstRowH + 8);
    let col = 0;
    let rowH = 0;
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const { w, h } = size(img);
      if (col === 0) {
        const pairH = Math.max(h, i + 1 < imgs.length ? size(imgs[i + 1]).h : 0);
        ensure(pairH + 8);
      }
      const cellX = M + col * (COL_W + GAP);
      // Neutral cell so mixed portrait/landscape rows line up neatly
      if (img) {
        const x = cellX + (COL_W - w) / 2;
        pdf.addImage(img.dataUrl, "JPEG", x, y, w, h);
        pdf.setDrawColor(...RULE);
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, w, h);
      } else {
        pdf.setFillColor(...PANEL);
        pdf.rect(cellX, y, COL_W, h, "F");
        font(8, "normal", MUTED);
        pdf.text("Image could not be loaded", cellX + COL_W / 2, y + h / 2 + 1, { align: "center" });
      }
      font(7.5, "normal", MUTED);
      pdf.text(`${title} · ${i + 1} of ${imgs.length}`, cellX + COL_W / 2, y + h + 4, { align: "center" });
      rowH = Math.max(rowH, h);
      col = (col + 1) % 2;
      if (col === 0) { y += rowH + 10; rowH = 0; }
    }
    if (col === 1) y += rowH + 10;
  };

  await drawPhotoGrid("System performance", data.evidence_photos || []);
  const groups = await fetchJobPhotoGroups(jobId);
  for (const g of groups) await drawPhotoGrid(g.title, g.urls);

  /* ── Footer on every page ── */
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.2);
    pdf.line(M, H - 12, W - M, H - 12);
    font(7.5, "normal", MUTED);
    pdf.text("Manta Ray Energy  ·  Confidential", M, H - 7);
    pdf.text(`Page ${p} of ${pages}`, W - M, H - 7, { align: "right" });
  }

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
