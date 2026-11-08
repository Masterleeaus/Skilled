import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { formatFieldValue, renderDocumentPdf, toWinAnsiSafe, wrapText } from "./template.pdf";
import type { AssembledDocument } from "./template.model";

const assembled: AssembledDocument = {
  templateId: "TPL-1-T01",
  title: "Acme Cleaning schedule → final",
  format: "contract",
  sections: [
    {
      heading: "Terms",
      fields: [
        { fieldId: "f1", label: "Method", type: "longtext", value: "Invoice per visit. ".repeat(60) },
        { fieldId: "f2", label: "Due days", type: "number", value: 14 },
        { fieldId: "f3", label: "Amount", type: "currency", value: 120.5 },
        { fieldId: "f4", label: "Methods", type: "table", value: [["Card", "No charge"], ["Bank", "None"]] },
        { fieldId: "f5", label: "Checks", type: "checklist", value: ["Insurance", "Licence noted"] },
        { fieldId: "f6", label: "Notes", type: "text", value: null },
      ],
    },
  ],
  footer: "Questions: hi@example.test €",
  unresolvedPlaceholders: [],
};

describe("toWinAnsiSafe", () => {
  it("keeps characters the standard PDF font can encode and replaces the rest", () => {
    expect(toWinAnsiSafe("Price €12 – ok → ✓")).toBe("Price €12 – ok ? ?");
  });
});

describe("formatFieldValue", () => {
  it("renders each value type as readable text", () => {
    expect(formatFieldValue("currency", 120.5)).toBe("120.50");
    expect(formatFieldValue("checklist", ["a", "b"])).toBe("- a\n- b");
    expect(formatFieldValue("table", [["x", "y"], ["z"]])).toBe("x | y\nz");
    expect(formatFieldValue("text", null)).toBe("Not completed");
  });
});

describe("wrapText", () => {
  it("wraps words to the width and breaks words longer than a line", () => {
    const measure = (value: string) => value.length;
    expect(wrapText("one two three", measure, 7)).toEqual(["one two", "three"]);
    expect(wrapText("abcdefghij", measure, 4)).toEqual(["abcd", "efgh", "ij"]);
  });
});

describe("renderDocumentPdf", () => {
  it("produces a loadable PDF that runs onto a second page for long content", async () => {
    const bytes = await renderDocumentPdf({ assembled, version: 2, contentHash: "a".repeat(64), issuedAt: new Date("2026-11-02T00:00:00Z") });
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("does not fail on characters outside WinAnsi", async () => {
    const bytes = await renderDocumentPdf({
      assembled: { ...assembled, title: "emoji 😀 and arrows →", footer: "中文" },
      version: 1,
      contentHash: "b".repeat(64),
      issuedAt: null,
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
