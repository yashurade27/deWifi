import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import {
  fetchSpot,
  calculateBookingCost,
  bookWifiAccess,
  activateBooking,
  generateAccessToken,
  generateOTP,
  type SpotData,
  type BookingCost,
} from "../lib/contracts";

/**
 * Hook for blockchain-based WiFi booking.
 * Wraps smart contract calls with loading/error state management.
 */
export function useBlockchainBooking() {
  const { provider, signer, address } = useWeb3();

  const [spot, setSpot] = useState<SpotData | null>(null);
  const [cost, setCost] = useState<BookingCost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /** Load spot data from the smart contract */
  async function loadSpot(spotId: number) {
    if (!provider) {
      setError("Wallet not connected");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSpot(provider, spotId);
      setSpot(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load spot");
    } finally {
      setLoading(false);
    }
  }

  /** Preview booking cost (no gas, free call) */
  async function previewCost(spotId: number, durationHours: number) {
    if (!provider) {
      setError("Wallet not connected");
      return;
    }
    setError(null);
    try {
      const costData = await calculateBookingCost(provider, spotId, durationHours);
      setCost(costData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to calculate cost");
    }
  }

  /** Execute the full booking flow: pay → activate → get credentials */
  async function book(spotId: number, durationHours: number) {
    if (!signer || !provider || !cost) {
      setError("Wallet not connected or cost not calculated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Send ETH to smart contract
      const result = await bookWifiAccess(signer, spotId, durationHours, cost.total);
      setBookingId(result.bookingId);
      setTxHash(result.txHash);

      // Step 2: Generate access credentials off-chain
      const token = generateAccessToken();
      const otpCode = generateOTP();
      setAccessToken(token);
      setOtp(otpCode);

      // Step 3: Activate booking with token hash on-chain
      await activateBooking(signer, result.bookingId, token);

      return {
        bookingId: result.bookingId,
        accessToken: token,
        otp: otpCode,
        txHash: result.txHash,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Booking failed";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSpot(null);
    setCost(null);
    setBookingId(null);
    setAccessToken(null);
    setOtp(null);
    setTxHash(null);
    setError(null);
  }

  return {
    // State
    spot,
    cost,
    loading,
    error,
    bookingId,
    accessToken,
    otp,
    txHash,
    isConnected: !!address,

    // Actions
    loadSpot,
    previewCost,
    book,
    reset,
  };
}
