import { api } from "@/lib/api-client";

/** A learner's certificate as returned by GET /api/certificates/my-certificates. */
export interface MyCertificate {
  id: string;
  courseId: string;
  certificateNumber: string;
  verificationToken: string | null;
  showNameOnVerify: boolean;
  issuedAt: string;
  student: { fullName: string };
}

export async function fetchMyCertificates() {
  const { data } = await api.get("/certificates/my-certificates");
  return data.data as MyCertificate[];
}

/** Returns a short-lived presigned URL for the certificate PDF. The API rejects other learners' certificates. */
export async function fetchCertificateDownloadUrl(certificateId: string) {
  const { data } = await api.get(`/certificates/${encodeURIComponent(certificateId)}/download`);
  return data.data.url as string;
}
