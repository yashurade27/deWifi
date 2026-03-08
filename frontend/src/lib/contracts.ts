import { BrowserProvider, Contract, ethers, formatEther, parseEther } from "ethers";

// ═══════════════════════════════════════════════════════════════
//  CONTRACT CONFIGURATION
//  Update AIRLINK_CONTRACT_ADDRESS after deployment
// ═══════════════════════════════════════════════════════════════

export const AIRLINK_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // UPDATE THIS

// ABI — only the functions we call from the frontend
// Full ABI is in blockchain/artifacts/contracts/AirlinkMarketplace.sol/AirlinkMarketplace.json
export const AIRLINK_ABI = [
  // Spot Management
  "function registerSpot(string _name, string _locationHash, string _metadataURI, uint256 _pricePerHourWei, uint256 _speedMbps, uint8 _maxUsers, uint8 _tag) external returns (uint256)",
  "function updateSpot(uint256 _spotId, uint256 _newPrice, uint8 _newStatus) external",
  "function getSpot(uint256 _spotId) external view returns (tuple(uint256 id, address owner, string name, string locationHash, string metadataURI, uint256 pricePerHourWei, uint256 speedMbps, uint8 maxUsers, uint8 currentUsers, uint8 tag, uint8 status, bool isVerified, uint256 totalEarnings, uint256 totalBookings, uint256 registeredAt))",
  "function getOwnerSpots(address _owner) external view returns (uint256[])",
  "function getActiveSpotCount() external view returns (uint256)",

  // Booking
  "function bookAccess(uint256 _spotId, uint256 _durationHours, uint256 _startTime) external payable returns (uint256)",
  "function activateBooking(uint256 _bookingId, bytes32 _accessTokenHash) external",
  "function completeBooking(uint256 _bookingId) external",
  "function cancelBooking(uint256 _bookingId) external",
  "function getBooking(uint256 _bookingId) external view returns (tuple(uint256 id, uint256 spotId, address user, address spotOwner, uint256 startTime, uint256 endTime, uint256 durationHours, uint256 totalPaid, uint256 ownerEarnings, uint256 platformFee, uint8 status, bytes32 accessTokenHash, bool ownerWithdrawn, uint256 createdAt))",
  "function getUserBookings(address _user) external view returns (uint256[])",
  "function calculateBookingCost(uint256 _spotId, uint256 _durationHours) external view returns (uint256 total, uint256 ownerShare, uint256 fee)",

  // Access Verification
  "function verifyAccess(uint256 _bookingId, string _accessToken) external view returns (bool)",

  // Earnings
  "function getOwnerEarnings(address _owner) external view returns (uint256 totalEarnings, uint256 withdrawableBalance)",
  "function withdrawEarnings() external",

  // Dispute
  "function disputeBooking(uint256 _bookingId) external",

  // Events
  "event SpotRegistered(uint256 indexed spotId, address indexed owner, string name, uint256 pricePerHourWei, uint8 tag, uint256 timestamp)",
  "event BookingCreated(uint256 indexed bookingId, uint256 indexed spotId, address indexed user, uint256 durationHours, uint256 totalPaid, uint256 startTime, uint256 endTime)",
  "event BookingActivated(uint256 indexed bookingId, bytes32 accessTokenHash, uint256 timestamp)",
  "event BookingCompleted(uint256 indexed bookingId, uint256 ownerEarnings, uint256 platformFee)",
  "event BookingCancelled(uint256 indexed bookingId, address cancelledBy, uint256 refundAmount)",
  "event EarningsWithdrawn(address indexed owner, uint256 amount, uint256 timestamp)",
] as const;

// ═══════════════════════════════════════════════════════════════
//  PROVIDER & SIGNER HELPERS
// ═══════════════════════════════════════════════════════════════

/** Check if MetaMask (or another injected wallet) is available */
export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

/** Get an ethers.js BrowserProvider from the injected wallet */
export function getProvider(): BrowserProvider {
  if (!isWalletAvailable()) {
    throw new Error("No Ethereum wallet found. Please install MetaMask.");
  }
  return new BrowserProvider(window.ethereum!);
}

/** Connect wallet and return signer + address */
export async function connectWallet(): Promise<{
  provider: BrowserProvider;
  signer: ethers.Signer;
  address: string;
}> {
  const provider = getProvider();
  // This prompts MetaMask
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

/** Get a read-only contract instance */
export function getReadContract(provider: BrowserProvider): Contract {
  return new Contract(AIRLINK_CONTRACT_ADDRESS, AIRLINK_ABI, provider);
}

/** Get a write contract instance (needs signer) */
export function getWriteContract(signer: ethers.Signer): Contract {
  return new Contract(AIRLINK_CONTRACT_ADDRESS, AIRLINK_ABI, signer);
}

// ═══════════════════════════════════════════════════════════════
//  SPOT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface SpotData {
  id: number;
  owner: string;
  name: string;
  locationHash: string;
  metadataURI: string;
  pricePerHourWei: bigint;
  pricePerHourEth: string;
  speedMbps: number;
  maxUsers: number;
  currentUsers: number;
  tag: number;
  status: number;
  isVerified: boolean;
  totalEarnings: bigint;
  totalBookings: number;
}

/** Fetch a single spot by ID */
export async function fetchSpot(provider: BrowserProvider, spotId: number): Promise<SpotData> {
  const contract = getReadContract(provider);
  const raw = await contract.getSpot(spotId);
  return {
    id: Number(raw.id),
    owner: raw.owner,
    name: raw.name,
    locationHash: raw.locationHash,
    metadataURI: raw.metadataURI,
    pricePerHourWei: raw.pricePerHourWei,
    pricePerHourEth: formatEther(raw.pricePerHourWei),
    speedMbps: Number(raw.speedMbps),
    maxUsers: Number(raw.maxUsers),
    currentUsers: Number(raw.currentUsers),
    tag: Number(raw.tag),
    status: Number(raw.status),
    isVerified: raw.isVerified,
    totalEarnings: raw.totalEarnings,
    totalBookings: Number(raw.totalBookings),
  };
}

/** Register a new WiFi spot on-chain */
export async function registerSpot(
  signer: ethers.Signer,
  params: {
    name: string;
    locationHash: string;
    metadataURI: string;
    pricePerHourEth: string;
    speedMbps: number;
    maxUsers: number;
    tag: number;
  }
): Promise<{ spotId: number; txHash: string }> {
  const contract = getWriteContract(signer);
  const tx = await contract.registerSpot(
    params.name,
    params.locationHash,
    params.metadataURI,
    parseEther(params.pricePerHourEth),
    params.speedMbps,
    params.maxUsers,
    params.tag
  );
  const receipt = await tx.wait();

  // Parse SpotRegistered event to get the spot ID
  const iface = new ethers.Interface(AIRLINK_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "SpotRegistered") {
        return { spotId: Number(parsed.args.spotId), txHash: receipt.hash };
      }
    } catch {
      // Not our event, skip
    }
  }
  throw new Error("SpotRegistered event not found in transaction");
}

// ═══════════════════════════════════════════════════════════════
//  BOOKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface BookingCost {
  total: bigint;
  totalEth: string;
  ownerShare: bigint;
  ownerShareEth: string;
  fee: bigint;
  feeEth: string;
}

/** Preview the cost of a booking (free call, no gas) */
export async function calculateBookingCost(
  provider: BrowserProvider,
  spotId: number,
  durationHours: number
): Promise<BookingCost> {
  const contract = getReadContract(provider);
  const [total, ownerShare, fee] = await contract.calculateBookingCost(spotId, durationHours);
  return {
    total,
    totalEth: formatEther(total),
    ownerShare,
    ownerShareEth: formatEther(ownerShare),
    fee,
    feeEth: formatEther(fee),
  };
}

/** Book WiFi access — sends ETH to the contract */
export async function bookWifiAccess(
  signer: ethers.Signer,
  spotId: number,
  durationHours: number,
  totalCostWei: bigint
): Promise<{ bookingId: number; txHash: string }> {
  const contract = getWriteContract(signer);
  const tx = await contract.bookAccess(spotId, durationHours, 0, {
    value: totalCostWei,
  });
  const receipt = await tx.wait();

  const iface = new ethers.Interface(AIRLINK_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "BookingCreated") {
        return { bookingId: Number(parsed.args.bookingId), txHash: receipt.hash };
      }
    } catch {
      // Not our event, skip
    }
  }
  throw new Error("BookingCreated event not found in transaction");
}

/** Activate a booking by setting the access token hash */
export async function activateBooking(
  signer: ethers.Signer,
  bookingId: number,
  accessToken: string
): Promise<string> {
  const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
  const contract = getWriteContract(signer);
  const tx = await contract.activateBooking(bookingId, tokenHash);
  const receipt = await tx.wait();
  return receipt.hash;
}

/** Complete a booking — releases funds to owner */
export async function completeBooking(
  signer: ethers.Signer,
  bookingId: number
): Promise<string> {
  const contract = getWriteContract(signer);
  const tx = await contract.completeBooking(bookingId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/** Cancel a booking — triggers refund */
export async function cancelBooking(
  signer: ethers.Signer,
  bookingId: number
): Promise<string> {
  const contract = getWriteContract(signer);
  const tx = await contract.cancelBooking(bookingId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/** Verify access token against a booking (free call) */
export async function verifyAccess(
  provider: BrowserProvider,
  bookingId: number,
  accessToken: string
): Promise<boolean> {
  const contract = getReadContract(provider);
  return await contract.verifyAccess(bookingId, accessToken);
}

// ═══════════════════════════════════════════════════════════════
//  EARNINGS FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface OwnerEarnings {
  totalEarnings: bigint;
  totalEarningsEth: string;
  withdrawableBalance: bigint;
  withdrawableBalanceEth: string;
}

/** Get owner's earnings summary */
export async function getOwnerEarnings(
  provider: BrowserProvider,
  ownerAddress: string
): Promise<OwnerEarnings> {
  const contract = getReadContract(provider);
  const [totalEarnings, withdrawableBalance] = await contract.getOwnerEarnings(ownerAddress);
  return {
    totalEarnings,
    totalEarningsEth: formatEther(totalEarnings),
    withdrawableBalance,
    withdrawableBalanceEth: formatEther(withdrawableBalance),
  };
}

/** Withdraw accumulated earnings to owner's wallet */
export async function withdrawEarnings(signer: ethers.Signer): Promise<string> {
  const contract = getWriteContract(signer);
  const tx = await contract.withdrawEarnings();
  const receipt = await tx.wait();
  return receipt.hash;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY: Generate access token off-chain
// ═══════════════════════════════════════════════════════════════

/** Generate a random 16-char hex access token (matches existing Airlink format) */
export function generateAccessToken(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a 6-digit OTP */
export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
