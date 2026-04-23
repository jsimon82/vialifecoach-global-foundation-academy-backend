import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

function findChromeExecutable() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const candidates = [
    "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
    "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe"
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function htmlToText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateAdmissionPdfBuffer({ title, htmlContent, meta = {} }) {
  // Try to render HTML exactly using a headless browser.
  try {
    const puppeteerModule = await import("puppeteer");
    const puppeteer = puppeteerModule.default || puppeteerModule;

    const executablePath = findChromeExecutable() || undefined;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath
    });
    const page = await browser.newPage();

    let resolvedHtml = htmlContent || "";
    // Inline logo so it always renders in PDFs.
    try {
      const logoUrl = "https://i.postimg.cc/dDPqTDcm/vialife.png";
      const response = await fetch(logoUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
        resolvedHtml = resolvedHtml.replace(/https:\/\/i\.postimg\.cc\/dDPqTDcm\/vialife\.png/g, dataUrl);
      }
    } catch (logoError) {
      console.warn("Logo inline failed:", logoError?.message || logoError);
    }

    const wrappedHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 0; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>${resolvedHtml}</body>
</html>`;
    await page.setContent(wrappedHtml, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    await browser.close();
    return buffer;
  } catch (err) {
    console.error("HTML-to-PDF render failed, falling back to text PDF:", err?.message || err);
    // Fallback to text-only PDF if browser rendering fails.
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (error) => reject(error));

        doc.fontSize(18).text("Vialifecoach Global Foundation Academy", { align: "left" });
        doc.moveDown(0.5);
        doc.fontSize(14).text(title || "Official Admission Letter");
        doc.moveDown(0.5);

        if (meta.applicantName || meta.programName) {
          doc.fontSize(10);
          if (meta.applicantName) doc.text(`Applicant: ${meta.applicantName}`);
          if (meta.programName) doc.text(`Program: ${meta.programName}`);
          if (meta.admissionNumber) doc.text(`Admission Number: ${meta.admissionNumber}`);
          if (meta.admissionDate) doc.text(`Admission Date: ${meta.admissionDate}`);
          doc.moveDown(0.8);
        }

        const text = htmlToText(htmlContent);
        doc.fontSize(11).text(text, { align: "left", lineGap: 4 });

        doc.moveDown(1);
        doc.fontSize(9).fillColor("#6b7280").text("This is an official admission letter from Vialifecoach Global Foundation Academy.");
        doc.end();
      } catch (fallbackError) {
        reject(fallbackError);
      }
    });
  }
}
