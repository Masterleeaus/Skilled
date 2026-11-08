/** Shape of an Axios-style API error as the frontend receives it. */
type ApiErrorShape = {
  response?: { status?: number; data?: { message?: string } };
};

/** Returns the server-sent message from a failed API call, if there is one. */
export function apiErrorMessage(err: unknown): string | undefined {
  return (err as ApiErrorShape | null | undefined)?.response?.data?.message;
}

/** Returns the HTTP status from a failed API call, if there is one. */
export function apiErrorStatus(err: unknown): number | undefined {
  return (err as ApiErrorShape | null | undefined)?.response?.status;
}
