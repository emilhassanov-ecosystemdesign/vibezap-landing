import PDFDocument from "pdfkit";

const COLORS = {
  coverBg: "#1a1040",
  coverAccent: "#FFD93D",
  pageBg: "#FFFEF7",
  titleColor: "#2d1b4e",
  textColor: "#333333",
  mutedText: "#888888",
  border: "#e8e0d4",
  decorative: "#d4c5a0",
};

/** Strip non-Latin-1 characters that Helvetica cannot render. */
function sanitizeText(text) {
  if (!text) return "";
  return String(text).replace(/[^\x00-\xFF]/g, "");
}

function drawFooter(doc, pageNum, totalPages) {
  const y = doc.page.height - 45;
  const savedMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor(COLORS.mutedText)
    .text(
      "Created with vibezap.dev/kids-story — AI-powered story creation",
      50, y,
      { align: "center", width: doc.page.width - 100, lineBreak: false }
    )
    .text(
      `Page ${pageNum} of ${totalPages}`,
      50, y + 10,
      { align: "right", width: doc.page.width - 100, lineBreak: false }
    );

  doc.page.margins.bottom = savedMargin;
}

function drawDecorativeBorder(doc) {
  const m = 30;
  const w = doc.page.width - 2 * m;
  const h = doc.page.height - 2 * m;

  doc
    .lineWidth(0.5)
    .strokeColor(COLORS.decorative)
    .rect(m, m, w, h)
    .stroke();

  // Inner border
  doc
    .lineWidth(0.3)
    .strokeColor(COLORS.border)
    .rect(m + 6, m + 6, w - 12, h - 12)
    .stroke();
}

function drawCoverPage(doc, data) {
  // Dark purple/navy cover background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.coverBg);

  // Decorative border in gold
  const m = 40;
  doc
    .lineWidth(2)
    .strokeColor(COLORS.coverAccent)
    .rect(m, m, doc.page.width - 2 * m, doc.page.height - 2 * m)
    .stroke();

  doc
    .lineWidth(0.5)
    .strokeColor("rgba(255, 217, 61, 0.4)")
    .rect(m + 8, m + 8, doc.page.width - 2 * (m + 8), doc.page.height - 2 * (m + 8))
    .stroke();

  // Star decorations (simple dots)
  const stars = [
    [100, 100], [200, 80], [400, 90], [150, 160],
    [450, 140], [120, 650], [350, 700], [480, 680],
  ];
  stars.forEach(([x, y]) => {
    doc.circle(x, y, 1.5).fill(COLORS.coverAccent);
  });

  // "A Story For" text
  const centerX = doc.page.width / 2;
  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor("rgba(255, 255, 255, 0.6)")
    .text("A Story For", 0, 200, { align: "center", width: doc.page.width });

  // Child's name
  doc
    .fontSize(36)
    .font("Helvetica-Bold")
    .fillColor(COLORS.coverAccent)
    .text(sanitizeText(data.childName), 0, 230, { align: "center", width: doc.page.width });

  // Divider line
  doc
    .moveTo(centerX - 60, 285)
    .lineTo(centerX + 60, 285)
    .lineWidth(1)
    .strokeColor(COLORS.coverAccent)
    .stroke();

  // Story title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text(sanitizeText(data.title), 70, 310, {
      align: "center",
      width: doc.page.width - 140,
    });

  // Dedication
  if (data.dedication) {
    doc
      .fontSize(11)
      .font("Helvetica-Oblique")
      .fillColor("rgba(255, 255, 255, 0.7)")
      .text(sanitizeText(data.dedication), 70, 500, {
        align: "center",
        width: doc.page.width - 140,
      });
  }

  // Footer branding
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("rgba(255, 255, 255, 0.35)")
    .text("Created with vibezap.dev/kids-story", 0, doc.page.height - 60, {
      align: "center",
      width: doc.page.width,
    });
}

function drawStoryPage(doc, page, illustration, pageNum, totalPages) {
  // Warm white background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);

  drawDecorativeBorder(doc);

  let currentY = 55;

  // If illustration exists, draw it at the top
  if (illustration) {
    try {
      const imgWidth = doc.page.width - 120;
      const imgHeight = 240;
      const imgX = 60;

      doc.image(illustration, imgX, currentY, {
        width: imgWidth,
        height: imgHeight,
        fit: [imgWidth, imgHeight],
        align: "center",
        valign: "center",
      });

      // Subtle border around image
      doc
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .rect(imgX, currentY, imgWidth, imgHeight)
        .stroke();

      currentY += imgHeight + 24;
    } catch (imgErr) {
      console.error(`[generate-story-pdf] Image embed failed for page ${pageNum}:`, imgErr.message);
      currentY += 20;
    }
  }

  // Page number badge
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(COLORS.mutedText)
    .text(`- ${pageNum} -`, 0, currentY, {
      align: "center",
      width: doc.page.width,
    });

  currentY += 20;

  // Story text
  const textMargin = 60;
  const textWidth = doc.page.width - 2 * textMargin;
  const footerReserve = 45;
  const availableHeight = doc.page.height - currentY - doc.page.margins.bottom - footerReserve;

  doc
    .fontSize(13)
    .font("Helvetica")
    .fillColor(COLORS.textColor)
    .text(sanitizeText(page.text), textMargin, currentY, {
      width: textWidth,
      align: "left",
      lineGap: 6,
      paragraphGap: 12,
      height: availableHeight,
      ellipsis: true,
    });

  // Footer
  drawFooter(doc, pageNum, totalPages);
}

/**
 * Generate a storybook PDF.
 * @param {Object} data - Story data from Claude + illustrations from Replicate
 * @param {string} data.title - Story title
 * @param {string} data.childName - Child's name
 * @param {string} data.dedication - Dedication line
 * @param {Array} data.pages - Array of { page_number, text, illustration_prompt }
 * @param {Object} data.illustrations - Map of page_number → Buffer (image data)
 * @param {string} data.generatedAt - ISO timestamp
 * @returns {Promise<Buffer>} PDF buffer
 */
export default function generateStoryPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: sanitizeText(data.title),
        Author: "VibeZap.dev — Kids Story Creator",
        Subject: `A personalized story for ${sanitizeText(data.childName)}`,
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pages = data.pages || [];
    const illustrations = data.illustrations || {};
    const totalPages = pages.length;

    // Cover page
    drawCoverPage(doc, data);

    // Story pages
    pages.forEach((page, idx) => {
      doc.addPage();
      const illustration = illustrations[page.page_number] || null;
      drawStoryPage(doc, page, illustration, idx + 1, totalPages);
    });

    // Back cover
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.coverBg);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("rgba(255, 255, 255, 0.6)")
      .text("The End", 0, doc.page.height / 2 - 30, {
        align: "center",
        width: doc.page.width,
      });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("rgba(255, 255, 255, 0.35)")
      .text(
        `Generated on ${new Date(data.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        0,
        doc.page.height / 2 + 10,
        { align: "center", width: doc.page.width }
      )
      .text("vibezap.dev/kids-story", 0, doc.page.height / 2 + 25, {
        align: "center",
        width: doc.page.width,
        link: "https://vibezap.dev/kids-story",
      });

    doc.end();
  });
}
