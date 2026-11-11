import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api-client";
import { fetchCertificateDownloadUrl, fetchMyCertificates } from "@/lib/certificate.api";

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }));

const get = vi.mocked(api.get);

describe("certificate API client", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns an empty array when the API reports no certificates", async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    await expect(fetchMyCertificates()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith("/certificates/my-certificates");
  });

  it("returns the learner's certificates from the response envelope", async () => {
    const rows = [{ id: "cert_1", certificateNumber: "CERT-2026-0001" }];
    get.mockResolvedValueOnce({ data: { success: true, data: rows } });

    await expect(fetchMyCertificates()).resolves.toEqual(rows);
  });

  it("requests a download URL for the given certificate id", async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: { url: "https://files.example/cert.pdf" } } });

    await expect(fetchCertificateDownloadUrl("cert 1")).resolves.toBe("https://files.example/cert.pdf");
    expect(get).toHaveBeenCalledWith("/certificates/cert%201/download");
  });
});
