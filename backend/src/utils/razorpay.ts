import Razorpay from "razorpay";
import crypto from "crypto";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "../config";

// Initialize Razorpay instance
export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param amount - Amount in INR (will be converted to paise)
 * @param receipt - Unique receipt ID
 * @param notes - Additional notes/metadata
 */
export async function createRazorpayOrder(
  amount: number,
  receipt: string,
  notes: Record<string, string> = {}
) {
  try {
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt,
      notes,
    });
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new Error("Failed to create payment order");
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 * @returns boolean indicating if signature is valid
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Failed to fetch payment details:", error);
    throw new Error("Failed to fetch payment details");
  }
}

/**
 * Create a refund
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to refund in paise (optional, full refund if not provided)
 */
export async function createRefund(paymentId: string, amount?: number) {
  try {
    const refundData: any = {};
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }
    const refund = await razorpayInstance.payments.refund(paymentId, refundData);
    return refund;
  } catch (error) {
    console.error("Refund creation failed:", error);
    throw new Error("Failed to create refund");
  }
}
