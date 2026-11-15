"use client";

import { useCallback } from "react";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack } from "@/lib/curriculum.api";
import { useLocationSearch } from "@/hooks/useLocationSearch";

const TRACKS: readonly LicenceTrack[] = ["non-licensed", "licensed"];
const LICENCE_TRACK_EVENT = "licence-track-change";

/**
 * The licence track requested for a course page, kept in the ?track= query parameter. The first render uses the default
 * (non-licensed), so server and client markup match. The URL is read after mount.
 * The choice is sent at enrolment or checkout and saved there. The URL carries it between the course page and the lessons.
 *
 * The URL value is a preview only. The server decides the track that applies:
 * - Visitors and enrolled staff: ?track= previews that track.
 * - Enrolled learners: the saved enrolment track applies and ?track= is ignored. Pages must show the `licenceTrack`
 *   the server returns (outline response), not this hook's value, and must not treat the URL as a choice.
 */
export function useLicenceTrack(): [LicenceTrack, (next: LicenceTrack) => void] {
  // The track lives in the URL. Every instance re-reads it when setTrack announces a change.
  const search = useLocationSearch(LICENCE_TRACK_EVENT);
  const requested = search === null ? null : new URLSearchParams(search).get("track");
  const track: LicenceTrack =
    requested && (TRACKS as readonly string[]).includes(requested) ? (requested as LicenceTrack) : DEFAULT_LICENCE_TRACK;

  const setTrack = useCallback((next: LicenceTrack) => {
    const url = new URL(window.location.href);
    url.searchParams.set("track", next);
    window.history.replaceState(window.history.state, "", url.toString());
    window.dispatchEvent(new CustomEvent<LicenceTrack>(LICENCE_TRACK_EVENT, { detail: next }));
  }, []);

  return [track, setTrack];
}
