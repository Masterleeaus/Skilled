import morgan from "morgan";
import type { Request } from "express";

/**
 * Removes the query string from a URL before it is logged. Query strings can carry credentials: the Central SSO
 * callback receives an authorization `code` and `state` in its query. The path stays, and a marker shows that a
 * query was present.
 */
export function redactUrlQuery(url: string): string {
  const at = url.indexOf("?");
  return at === -1 ? url : `${url.slice(0, at)}?[redacted]`;
}

function refererOf(req: Request): string {
  const value = req.headers.referer ?? req.headers.referrer;
  return typeof value === "string" ? redactUrlQuery(value) : "-";
}

/**
 * The morgan "combined" line, with the request URL and the Referer query string redacted for every route.
 * Built as a format function, so no global morgan token is changed.
 */
export function createHttpRequestLogger(stream: { write: (line: string) => void }) {
  return morgan(
    (tokens, req, res) => {
      const request = req as Request;
      const url = redactUrlQuery(request.originalUrl || request.url || "-");
      return [
        tokens["remote-addr"](req, res) ?? "-",
        "-",
        tokens["remote-user"](req, res) ?? "-",
        `[${tokens.date(req, res, "clf")}]`,
        `"${tokens.method(req, res) ?? "-"} ${url} HTTP/${tokens["http-version"](req, res) ?? "-"}"`,
        tokens.status(req, res) ?? "-",
        tokens.res(req, res, "content-length") ?? "-",
        `"${refererOf(request)}"`,
        `"${tokens["user-agent"](req, res) ?? "-"}"`,
      ].join(" ");
    },
    { stream },
  );
}
