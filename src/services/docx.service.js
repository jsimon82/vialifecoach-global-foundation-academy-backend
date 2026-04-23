import htmlToDocx from "html-to-docx";

export async function generateAdmissionDocxBuffer(htmlContent) {
  const html = String(htmlContent || "");
  const buffer = await htmlToDocx(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: false,
  });
  return Buffer.from(buffer);
}
