import express, { Request, Response } from "express";

const router = express.Router();

/**
 * List all payments for the authenticated user.
 *
 * GET /api/v1/payments
 *
 * Query params:
 *   - limit (number, optional): max number of results to return. Default: 20.
 *   - cursor (string, optional): pagination cursor from a previous response.
 *   - status (string, optional): filter by status. One of: pending, completed, failed, refunded.
 *
 * Returns: { data: Payment[], next_cursor: string | null }
 */
router.get("/payments", async (req: Request, res: Response) => {
  const { limit = 20, cursor, status } = req.query;
  // ... implementation
  res.json({ data: [], next_cursor: null });
});

/**
 * Retrieve a single payment by ID.
 *
 * GET /api/v1/payments/:id
 *
 * Path params:
 *   - id (string, required): the payment ID.
 *
 * Returns: Payment
 * Errors: 404 if payment not found.
 */
router.get("/payments/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // ... implementation
  res.json({ id, amount: 0, currency: "usd", status: "pending" });
});

/**
 * Create a new payment.
 *
 * POST /api/v1/payments
 *
 * Body:
 *   - amount (number, required): amount in cents.
 *   - currency (string, required): ISO 4217 currency code, e.g. "usd".
 *   - source (string, required): payment method token.
 *   - description (string, optional): human-readable description.
 *   - metadata (object, optional): arbitrary key-value pairs.
 *
 * Returns: Payment
 * Errors: 400 if required fields are missing or invalid.
 */
router.post("/payments", async (req: Request, res: Response) => {
  const { amount, currency, source, description, metadata } = req.body;
  // ... implementation
  res.status(201).json({ id: "pay_abc123", amount, currency, status: "pending" });
});

/**
 * Refund a payment.
 *
 * POST /api/v1/payments/:id/refund
 *
 * Path params:
 *   - id (string, required): the payment ID to refund.
 *
 * Body:
 *   - amount (number, optional): partial refund amount in cents. Omit to refund in full.
 *   - reason (string, optional): reason for the refund. One of: duplicate, fraudulent, requested_by_customer.
 *
 * Returns: Refund
 * Errors: 404 if payment not found. 400 if payment is not refundable.
 */
router.post("/payments/:id/refund", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  // ... implementation
  res.json({ id: "re_xyz789", payment_id: id, amount, status: "succeeded" });
});

/**
 * Cancel a pending payment.
 *
 * DELETE /api/v1/payments/:id
 *
 * Path params:
 *   - id (string, required): the payment ID to cancel.
 *
 * Returns: { success: true }
 * Errors: 404 if payment not found. 400 if payment cannot be cancelled (e.g. already completed).
 */
router.delete("/payments/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // ... implementation
  res.json({ success: true });
});

export default router;
