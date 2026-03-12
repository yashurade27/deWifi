import { BrowserProvider, Contract, ethers, formatEther, parseEther } from "ethers";

// ═══════════════════════════════════════════════════════════════
//  AIRLINK v2 — MODULAR CONTRACT CONFIGURATION
//  Update addresses after deployment (output of scripts/deploy.ts)
// ═══════════════════════════════════════════════════════════════

export const CONTRACT_ADDRESSES = {
  registry:      import.meta.env.VITE_WIFI_REGISTRY_ADDRESS      ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  accessNFT:     import.meta.env.VITE_ACCESS_NFT_ADDRESS         ?? "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  escrow:        import.meta.env.VITE_PAYMENT_ESCROW_ADDRESS     ?? "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  accessManager: import.meta.env.VITE_ACCESS_MANAGER_ADDRESS     ?? "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
};

// Backwards-compatible alias
export const AIRLINK_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.accessManager;

// ═══════════════════════════════════════════════════════════════
//  ABIs — Human-readable (only functions called from frontend)
// ═══════════════════════════════════════════════════════════════

export const ACCESS_MANAGER_ABI = [
  // Purchase & Session
  "function purchaseAccess(uint256 spotId, uint256 durationHours, uint256 startTime) external payable returns (uint256)",
  "function completeSession(uint256 tokenId) external",
  "function cancelSession(uint256 tokenId) external",
  "function disputeSession(uint256 tokenId) external",

  // Gateway verification
  "function verifyAccess(uint256 tokenId, address user) external view returns (bool valid, uint256 spotId, uint256 expiresAt)",
  "function verifyAccessForSpot(uint256 tokenId, address user, uint256 spotId) external view returns (bool valid, uint256 expiresAt)",

  // View
  "function calculateCost(uint256 spotId, uint256 durationHours) external view returns (uint256 total, uint256 ownerShare, uint256 fee)",
  "function getSession(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint256 spotId, address user, address spotOwner, uint256 totalPaid, uint256 ownerShare, uint256 platformFee, uint256 startTime, uint256 endTime, uint8 status))",
  "function getUserSessions(address user) external view returns (uint256[])",

  // Events
  "event AccessPurchased(uint256 indexed tokenId, uint256 indexed spotId, address indexed user, uint256 totalPaid, uint256 startTime, uint256 endTime)",
  "event SessionCompleted(uint256 indexed tokenId, uint256 ownerEarnings)",
  "event SessionCancelled(uint256 indexed tokenId, uint256 refundPercent)",
] as const;

export const REGISTRY_ABI = [
  // Spot management
  "function registerSpot(string name, string locationHash, string metadataURI, uint256 pricePerHourWei, uint256 speedMbps, uint8 maxUsers, uint8 tag) external returns (uint256)",
  "function updateSpot(uint256 spotId, uint256 newPrice, uint8 newStatus) external",

  // View
  "function getSpot(uint256 spotId) external view returns (tuple(uint256 id, address owner, string name, string locationHash, string metadataURI, uint256 pricePerHourWei, uint256 speedMbps, uint8 maxUsers, uint8 currentUsers, uint8 tag, uint8 status, bool isVerified, uint256 totalEarnings, uint256 totalBookings, uint256 registeredAt))",
  "function getOwnerSpots(address owner) external view returns (uint256[])",
  "function isSpotActive(uint256 spotId) external view returns (bool)",
  "function getSpotPrice(uint256 spotId) external view returns (uint256)",
  "function hasCapacity(uint256 spotId) external view returns (bool)",

  // Events
  "event SpotRegistered(uint256 indexed spotId, address indexed owner, string name, uint256 pricePerHourWei, uint8 tag, uint256 timestamp)",
  "event SpotUpdated(uint256 indexed spotId, uint256 newPrice, uint8 newStatus)",
] as const;

export const ACCESS_NFT_ABI = [
  "function isAccessValid(uint256 tokenId) external view returns (bool)",
  "function isAccessValidFor(uint256 tokenId, address user) external view returns (bool)",
  "function getAccessPass(uint256 tokenId) external view returns (tuple(uint256 spotId, address originalBuyer, uint256 startTime, uint256 expiresAt, uint256 durationHours, bool revoked))",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
] as const;

export const ESCROW_ABI = [
  "function getDeposit(uint256 tokenId) external view returns (tuple(address payer, address recipient, uint256 ownerShare, uint256 platformFee, uint256 totalDeposited, bool released, bool refunded))",
  "function platformBalance() external view returns (uint256)",
] as const;

// Legacy alias for backwards compatibility
export const AIRLINK_ABI = ACCESS_MANAGER_ABI;

// ═══════════════════════════════════════════════════════════════
//  PROVIDER & SIGNER HELPERS
// ═══════════════════════════════════════════════════════════════

export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

export function getProvider(): BrowserProvider {
  if (!isWalletAvailable()) {
    throw new Error("No Ethereum wallet found. Please install MetaMask.");
  }
  return new BrowserProvider(window.ethereum!);
}

export async function connectWallet(): Promise<{
  provider: BrowserProvider;
  signer: ethers.Signer;
  address: string;
}> {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

// ═══════════════════════════════════════════════════════════════
//  CONTRACT INSTANCES
// ═══════════════════════════════════════════════════════════════

export function getManagerContract(providerOrSigner: BrowserProvider | ethers.Signer): Contract {
  return new Contract(CONTRACT_ADDRESSES.accessManager, ACCESS_MANAGER_ABI, providerOrSigner);
}

export function getRegistryContract(providerOrSigner: BrowserProvider | ethers.Signer): Contract {
  return new Contract(CONTRACT_ADDRESSES.registry, REGISTRY_ABI, providerOrSigner);
}

export function getNFTContract(providerOrSigner: BrowserProvider | ethers.Signer): Contract {
  return new Contract(CONTRACT_ADDRESSES.accessNFT, ACCESS_NFT_ABI, providerOrSigner);
}

// Legacy aliases
export function getReadContract(provider: BrowserProvider): Contract {
  return getManagerContract(provider);
}

export function getWriteContract(signer: ethers.Signer): Contract {
  return getManagerContract(signer);
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

export async function fetchSpot(provider: BrowserProvider, spotId: number): Promise<SpotData> {
  const contract = getRegistryContract(provider);
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
  const contract = getRegistryContract(signer);
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

  const iface = new ethers.Interface(REGISTRY_ABI);
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
//  SESSION FUNCTIONS (replaces booking functions)
// ═══════════════════════════════════════════════════════════════

export interface BookingCost {
  total: bigint;
  totalEth: string;
  ownerShare: bigint;
  ownerShareEth: string;
  fee: bigint;
  feeEth: string;
}

export async function calculateBookingCost(
  provider: BrowserProvider,
  spotId: number,
  durationHours: number
): Promise<BookingCost> {
  if (CONTRACT_ADDRESSES.accessManager === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      "Contracts not deployed — run the deploy script and set VITE_ACCESS_MANAGER_ADDRESS in your .env file."
    );
  }
  const contract = getManagerContract(provider);
  try {
    const [total, ownerShare, fee] = await contract.calculateCost(spotId, durationHours);
    return {
      total,
      totalEth: formatEther(total),
      ownerShare,
      ownerShareEth: formatEther(ownerShare),
      fee,
      feeEth: formatEther(fee),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // ethers v6 puts the decoded revert reason in `reason` / `shortMessage`, not always in `message`
    const reason = (err as any)?.reason ?? (err as any)?.shortMessage ?? '';
    const combined = msg + ' ' + reason;
    if (
      combined.includes('BAD_DATA') ||
      combined.includes('could not decode result data') ||
      combined.includes('Spot does not exist')
    ) {
      throw new Error('Spot does not exist on-chain — please seed the blockchain spots.');
    }
    // Generic revert that we couldn't decode → treat as spot not accessible
    if (combined.includes('CALL_EXCEPTION') || combined.includes('execution reverted')) {
      throw new Error(`Spot is not accessible on-chain: ${reason || msg}`);
    }
    throw err;
  }
}

/**
 * Purchase WiFi access — sends ETH, mints NFT, escrows payment.
 * Returns the NFT tokenId (which is also the session ID).
 */
export async function bookWifiAccess(
  signer: ethers.Signer,
  spotId: number,
  durationHours: number,
  totalCostWei: bigint
): Promise<{ bookingId: number; txHash: string }> {
  const contract = getManagerContract(signer);
  const tx = await contract.purchaseAccess(spotId, durationHours, 0, {
    value: totalCostWei,
  });
  const receipt = await tx.wait();

  const iface = new ethers.Interface(ACCESS_MANAGER_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "AccessPurchased") {
        return { bookingId: Number(parsed.args.tokenId), txHash: receipt.hash };
      }
    } catch {
      // Not our event, skip
    }
  }
  throw new Error("AccessPurchased event not found in transaction");
}

/**
 * Complete a session — releases escrowed ETH to the spot owner.
 */
export async function completeBooking(
  signer: ethers.Signer,
  tokenId: number
): Promise<string> {
  const contract = getManagerContract(signer);
  const tx = await contract.completeSession(tokenId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Cancel a session — proportional refund based on remaining time.
 */
export async function cancelBooking(
  signer: ethers.Signer,
  tokenId: number
): Promise<string> {
  const contract = getManagerContract(signer);
  const tx = await contract.cancelSession(tokenId);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Verify access on-chain (free view call).
 * Used by gateways and the frontend to check if a user has valid access.
 */
export async function verifyAccess(
  provider: BrowserProvider,
  tokenId: number,
  userAddress: string
): Promise<{ valid: boolean; spotId: number; expiresAt: number }> {
  const contract = getManagerContract(provider);
  const [valid, spotId, expiresAt] = await contract.verifyAccess(tokenId, userAddress);
  return {
    valid,
    spotId: Number(spotId),
    expiresAt: Number(expiresAt),
  };
}

/**
 * Get session details by token/session ID.
 */
export interface SessionData {
  tokenId: number;
  spotId: number;
  user: string;
  spotOwner: string;
  totalPaid: bigint;
  totalPaidEth: string;
  ownerShare: bigint;
  platformFee: bigint;
  startTime: number;
  endTime: number;
  status: number; // 0=Active, 1=Completed, 2=Cancelled, 3=Disputed
}

export async function getSession(
  provider: BrowserProvider,
  tokenId: number
): Promise<SessionData> {
  const contract = getManagerContract(provider);
  const raw = await contract.getSession(tokenId);
  return {
    tokenId: Number(raw.tokenId),
    spotId: Number(raw.spotId),
    user: raw.user,
    spotOwner: raw.spotOwner,
    totalPaid: raw.totalPaid,
    totalPaidEth: formatEther(raw.totalPaid),
    ownerShare: raw.ownerShare,
    platformFee: raw.platformFee,
    startTime: Number(raw.startTime),
    endTime: Number(raw.endTime),
    status: Number(raw.status),
  };
}

/**
 * Get all session IDs for a user.
 */
export async function getUserSessions(
  provider: BrowserProvider,
  userAddress: string
): Promise<number[]> {
  const contract = getManagerContract(provider);
  const ids = await contract.getUserSessions(userAddress);
  return ids.map((id: bigint) => Number(id));
}

/**
 * Get NFT access pass details.
 */
export async function getAccessPass(
  provider: BrowserProvider,
  tokenId: number
) {
  const contract = getNFTContract(provider);
  const pass = await contract.getAccessPass(tokenId);
  return {
    spotId: Number(pass.spotId),
    originalBuyer: pass.originalBuyer,
    startTime: Number(pass.startTime),
    expiresAt: Number(pass.expiresAt),
    durationHours: Number(pass.durationHours),
    revoked: pass.revoked,
  };
}

// ═══════════════════════════════════════════════════════════════
//  LEGACY COMPATIBILITY (activateBooking is no longer needed —
//  NFTs are minted automatically during purchase)
// ═══════════════════════════════════════════════════════════════

export async function activateBooking(
  _signer: ethers.Signer,
  _bookingId: number,
  _accessToken: string
): Promise<string> {
  // No-op in v2 — activation is automatic via NFT minting
  console.warn("activateBooking is deprecated in v2. NFTs are minted automatically on purchase.");
  return "";
}

export function generateAccessToken(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
