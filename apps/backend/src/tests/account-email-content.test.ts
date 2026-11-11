import { describe, expect, it } from "vitest";
import { resetPasswordEmailContent, verificationEmailContent, SKILLED_PRODUCT_NAME } from "../jobs/account-email-content";

describe("account transactional email product copy", () => {
  it("uses the same current product name in verification and password reset mail", () => {
    expect(SKILLED_PRODUCT_NAME).toBe("SkilledAt.Work");
    for (const mail of [
      verificationEmailContent("https://skilled.example", "verified"),
      resetPasswordEmailContent("https://skilled.example", "reset"),
    ]) {
      expect(mail.subject).toContain(SKILLED_PRODUCT_NAME);
      expect(mail.html).toContain(SKILLED_PRODUCT_NAME);
      expect(mail.subject).not.toMatch(/Titan Academy/i);
      expect(mail.html).not.toMatch(/Titan Academy/i);
    }
  });

  it("uses correct tokenized links and expiry messages", () => {
    const verified = verificationEmailContent("https://skilled.example", "a+&b");
    expect(verified.html).toContain('href="https://skilled.example/verify-email?token=a%2B%26b"');
    expect(verified.html).toContain("24 hours");
    const reset = resetPasswordEmailContent("https://skilled.example", "a+&b");
    expect(reset.html).toContain('href="https://skilled.example/reset-password?token=a%2B%26b"');
    expect(reset.html).toContain("1 hour");
  });

  it("HTML-escapes user input and never places token markup into HTML", () => {
    const mail = verificationEmailContent("https://skilled.example", '<img src=x onerror="bad">');
    expect(mail.html).not.toContain("<img");
    expect(mail.html).toContain("token=%3Cimg");
    expect(mail.html).not.toContain('onerror="bad"');
  });

  it("keeps URLs within the configured origin and respects an existing application path", () => {
    const mail = resetPasswordEmailContent("https://example.test/skilled", "t");
    expect(mail.html).toContain("https://example.test/skilled/reset-password?token=t");
  });
});
