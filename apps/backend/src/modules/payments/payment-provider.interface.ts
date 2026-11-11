export interface InitiatePaymentParams {
  amount: number; // in smallest currency unit is handled inside the provider
  currency: string;
  courseId: string;
  studentId: string;
  studentEmail: string;
  /** The licence track chosen at checkout. Returned in the success URL and the session metadata. */
  licenceTrack: string;
  /**
   * Optional idempotency key for the provider's create call. The checkout service passes the claimed payment row id,
   * so a retried create for the same claim returns the session the first attempt made instead of a second one.
   */
  idempotencyKey?: string;
}

export interface InitiatePaymentResult {
  checkoutUrl: string;
  providerReference: string; // Stripe session id, etc.
}

export interface VerifyPaymentResult {
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  providerReference: string;
  amount: number;
  currency: string;
  courseId: string | null;
  studentId: string | null;
  /** The track recorded in the session metadata, or null for sessions created before tracks were saved. */
  licenceTrack: string | null;
}

export interface PaymentProvider {
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(providerReference: string): Promise<VerifyPaymentResult>;
  refund(providerReference: string): Promise<void>;
}
