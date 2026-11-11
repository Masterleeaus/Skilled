import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CertificateList, formatIssuedDate } from "@/components/CertificateList";
import type { MyCertificate } from "@/lib/certificate.api";

const certificate: MyCertificate = {
  id: "cert_1",
  courseId: "course_1",
  certificateNumber: "CERT-2026-0001",
  verificationToken: "tok_abcdefghijklmnopqrstuv",
  showNameOnVerify: false,
  issuedAt: "2026-03-05T10:00:00.000Z",
  student: { fullName: "Test Learner" },
};

const noop = () => {};

describe("CertificateList", () => {
  it("shows an empty-state message and no rows when the learner has no certificates", () => {
    const html = renderToStaticMarkup(<CertificateList certificates={[]} downloadingId={null} onDownload={noop} />);

    expect(html).toContain("You have no certificates yet.");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("Download PDF");
  });

  it("renders one row per certificate with its number, issue date and a download button", () => {
    const second: MyCertificate = { ...certificate, id: "cert_2", certificateNumber: "CERT-2026-0002", issuedAt: "2026-06-18T12:00:00.000Z" };

    const html = renderToStaticMarkup(
      <CertificateList certificates={[certificate, second]} downloadingId={null} onDownload={noop} />,
    );

    expect(html).not.toContain("You have no certificates yet.");
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain("Certificate CERT-2026-0001");
    expect(html).toContain("Certificate CERT-2026-0002");
    expect(html).toContain("Issued 5 March 2026");
    expect(html).toContain("Issued 18 June 2026");
    expect(html).toContain('aria-label="Download certificate CERT-2026-0001 as PDF"');
    expect(html.match(/Download PDF/g)).toHaveLength(2);
  });

  it("disables only the row being downloaded", () => {
    const second: MyCertificate = { ...certificate, id: "cert_2", certificateNumber: "CERT-2026-0002" };

    const html = renderToStaticMarkup(
      <CertificateList certificates={[certificate, second]} downloadingId="cert_2" onDownload={noop} />,
    );

    expect(html.match(/Preparing PDF/g)).toHaveLength(1);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });

  it("passes the certificate id to onDownload when its button is activated", () => {
    const onDownload = vi.fn();
    const element = CertificateList({ certificates: [certificate], downloadingId: null, onDownload });

    const button = findFirst(element, (node) => node.type === "button");
    expect(button).toBeDefined();
    (button!.props.onClick as () => void)();

    expect(onDownload).toHaveBeenCalledWith("cert_1");
  });

  it("formats the issue date in UTC so the date does not shift with the viewer's timezone", () => {
    expect(formatIssuedDate("2026-03-05T23:30:00.000Z")).toBe("5 March 2026");
  });
});

type ElementLike = { type: unknown; props: Record<string, unknown> };

/** Walks a React element tree and returns the first element matching the predicate. */
function findFirst(node: unknown, predicate: (element: ElementLike) => boolean): ElementLike | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findFirst(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return undefined;
  const element = node as ElementLike;
  if (predicate(element)) return element;
  return findFirst(element.props.children, predicate);
}
