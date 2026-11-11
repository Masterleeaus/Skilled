import type { MyCertificate } from "@/lib/certificate.api";

interface CertificateListProps {
  certificates: MyCertificate[];
  /** The certificate whose download link is being prepared, if any. */
  downloadingId: string | null;
  onDownload: (certificateId: string) => void;
}

export function formatIssuedDate(issuedAt: string) {
  return new Date(issuedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function CertificateList({ certificates, downloadingId, onDownload }: CertificateListProps) {
  if (certificates.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-400">
        You have no certificates yet. Certificates appear here once you complete a course.
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {certificates.map((certificate) => {
        const busy = downloadingId === certificate.id;
        return (
          <li
            key={certificate.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-medium">Certificate {certificate.certificateNumber}</h3>
              <p className="mt-1 text-sm text-neutral-400">Issued {formatIssuedDate(certificate.issuedAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => onDownload(certificate.id)}
              disabled={busy}
              aria-label={`Download certificate ${certificate.certificateNumber} as PDF`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
            >
              {busy ? "Preparing PDF..." : "Download PDF"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
