"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LICENCE_TRACK, type LicenceTrack } from "@/lib/curriculum.api";

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
  const [track, setTrackState] = useState<LicenceTrack>(DEFAULT_LICENCE_TRACK);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("track");
    if (value && (TRACKS as readonly string[]).includes(value)) setTrackState(value as LicenceTrack);
  }, []);

  // Other components on the same page that use this hook follow a change made here.
  useEffect(() => {
    const onChange = (event: Event) => setTrackState((event as CustomEvent<LicenceTrack>).detail);
    window.addEventListener(LICENCE_TRACK_EVENT, onChange);
    return () => window.removeEventListener(LICENCE_TRACK_EVENT, onChange);
  }, []);

  const setTrack = useCallback((next: LicenceTrack) => {
    setTrackState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("track", next);
    window.history.replaceState(window.history.state, "", url.toString());
    window.dispatchEvent(new CustomEvent<LicenceTrack>(LICENCE_TRACK_EVENT, { detail: next }));
  }, []);

  return [track, setTrack];
}
