/**
 * Pure, user-visible account email copy. Keep the product name here rather than
 * duplicating it in queue producers. No Redis, SMTP or environment reads.
 */
export const SKILLED_PRODUCT_NAME = "SkilledAt.Work";

export interface AccountEmailContent {
  subject: string;
  html: string;
}

function accountLink(siteUrl: string, route: "verify-email" | "reset-password", token: string): string {
  const url = new URL(route, siteUrl.endsWith("/") ? siteUrl : siteUrl + "/");
  url.searchParams.set("token", token);
  return url.toString();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] ?? char);
}

export function verificationEmailContent(siteUrl: string, token: string): AccountEmailContent {
  const link = escapeHtml(accountLink(siteUrl, "verify-email", token));
  return {
    subject: `Verify your ${SKILLED_PRODUCT_NAME} account`,
    html: `<p>Verify your ${SKILLED_PRODUCT_NAME} email address: <a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function resetPasswordEmailContent(siteUrl: string, token: string): AccountEmailContent {
  const link = escapeHtml(accountLink(siteUrl, "reset-password", token));
  return {
    subject: `Reset your ${SKILLED_PRODUCT_NAME} password`,
    html: `<p>Reset your ${SKILLED_PRODUCT_NAME} password: <a href="${link}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
  };
}
