"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Topbar } from "@/components/Topbar";
import { CertificateList } from "@/components/CertificateList";
import { fetchCertificateDownloadUrl, fetchMyCertificates } from "@/lib/certificate.api";

export default function StudentCertificatesPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: certificates, isLoading, isError } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: fetchMyCertificates,
    enabled: !!user,
  });

  if (!user) return null;

  async function download(certificateId: string) {
    setDownloadingId(certificateId);
    setMessage(null);
    try {
      const url = await fetchCertificateDownloadUrl(certificateId);
      const opened = window.open(url, "_blank");
      if (opened) {
        opened.opener = null;
      } else {
        setMessage("Your browser blocked the download. Allow pop-ups for this site and try again.");
      }
    } catch {
      setMessage("The certificate could not be downloaded. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <Topbar title="My Certificates" backHref="/student" backLabel="Dashboard" />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading your certificates...</p>}

        {isError && <p className="text-red-400">Your certificates could not be loaded. Please refresh the page.</p>}

        {message && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {message}
          </p>
        )}

        {certificates && (
          <CertificateList certificates={certificates} downloadingId={downloadingId} onDownload={download} />
        )}
      </main>
    </div>
  );
}
