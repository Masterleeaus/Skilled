# ACT boom-length verbatim check

Checked 2026-11-03. Page: Access Canberra, High risk work licences, https://www.accesscanberra.act.gov.au/business-and-work/high-risk-work-licences (URL taken from curriculum/research/ACT-RETRY-REPORT.md).

## Verbatim text found

- Not obtained. No verbatim sentence has been read from the official page in this session.
- Attempt 1: WebFetch (summarising fetch) returned "Allows the holder to operate a boom-type elevating work platform where the boom is 11 metres or more." This is a summary, not a verbatim copy, so it is not accepted as the check.
- Attempt 2: curl to the page (through the agent proxy, with normal TLS verification) returned HTTP 403 with a Cloudflare "Just a moment..." bot-challenge page (5,553 bytes). The page text was not served. The challenge was not bypassed.
- Attempt 3: the Chrome browser tools were loaded, but the browser extension is not connected (tabs_context_mcp: extension not connected), so no browser read was possible.

## Date shown

- Only from the summarising fetch: no specific date and no "last updated" or "reviewed" date; the only year is in "Work Health and Safety Act 2011". Not verified against the page itself.

## Decision

- Not restored. The 11 m ACT figure is not confirmed verbatim, so per the instructions the ACT boom-length removals stand.
- No lesson, licence or source file was changed.
- The ACT figure can be restored once someone reads the page in a browser (with the extension connected, or by viewing it directly) and records the exact sentence and date shown.

## Files changed

- None (this file is the only new file).

## Check

- python3 -I /home/claude/work/check.py: problemCount 1, the existing NEW-DEK-01 (internal code in learner text), unchanged from the baseline in BOOM-OTHER-STATES.md. No new problem added.

## Still open

- curriculum/research/trades/LICENCE-MATRIX.csv still shows ACT-22 as CONFIRMED (see BOOM-OTHER-STATES.md, "Left for the owner").
