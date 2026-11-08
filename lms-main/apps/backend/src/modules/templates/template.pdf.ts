import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AssembledDocument, FieldValue } from "./template.model";

/**
 * Renders an issued template document as PDF. Standard PDF fonts only encode WinAnsi characters,
 * so any other character is replaced with "?" rather than failing the download.
 */

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function toWinAnsiSafe(text: string): string {
  let out = "";
  for (const char of text.replace(/\r\n?/g, "\n")) {
    const code = char.codePointAt(0)!;
    if (char === "\n" || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WINANSI_EXTRA.includes(char)) out += char;
    else if (char === "\t") out += "    ";
    else out += "?";
  }
  return out;
}

export function formatFieldValue(type: string, value: FieldValue): string {
  if (value === null || value === undefined) return "Not completed";
  if (typeof value === "number") return type === "currency" ? value.toFixed(2) : String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length && Array.isArray(value[0])) {
    return (value as string[][]).map(row => row.join(" | ")).join("\n");
  }
  return (value as string[]).map(item => `- ${item}`).join("\n");
}

/** Greedy word wrap that also breaks words longer than the line. */
export function wrapText(text: string, measure: (value: string) => number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      let rest = word;
      while (measure(rest) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

export async function renderDocumentPdf(input: { assembled: AssembledDocument; version: number; contentHash: string; issuedAt: Date | null }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensure = (height: number) => {
    if (y - height < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };
  const write = (text: string, font: PDFFont, size: number, gapBefore = 0, color = rgb(0, 0, 0)) => {
    const lineHeight = size * 1.35;
    const lines = wrapText(toWinAnsiSafe(text), value => font.widthOfTextAtSize(value, size), contentWidth);
    y -= gapBefore;
    for (const line of lines) {
      ensure(lineHeight);
      page.drawText(line, { x: MARGIN, y: y - size, size, font, color });
      y -= lineHeight;
    }
  };

  const { assembled, version, contentHash, issuedAt } = input;
  write(assembled.title, bold, 16);
  write(`${assembled.format} | version ${version} | content ${contentHash.slice(0, 12)}${issuedAt ? ` | issued ${issuedAt.toISOString().slice(0, 10)}` : ""}`, regular, 8, 4, rgb(0.35, 0.35, 0.35));
  for (const section of assembled.sections) {
    write(section.heading, bold, 12, 16);
    for (const field of section.fields) {
      write(field.label, bold, 10, 8);
      write(formatFieldValue(field.type, field.value), regular, 10, 2);
    }
  }
  write(assembled.footer, regular, 9, 18, rgb(0.35, 0.35, 0.35));
  return pdf.save();
}
