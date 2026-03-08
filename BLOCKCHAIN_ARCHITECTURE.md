# Airlink: Blockchain-Powered WiFi Sharing Marketplace

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why Blockchain?](#2-why-blockchain)
3. [Architecture](#3-architecture)
4. [Smart Contract Design](#4-smart-contract-design)
5. [Data Flow](#5-data-flow)
6. [Business Logic](#6-business-logic)
7. [What Stays On-Chain vs Off-Chain](#7-what-stays-on-chain-vs-off-chain)
8. [Security Considerations](#8-security-considerations)
9. [Deployment Guide](#9-deployment-guide)
10. [Frontend Integration (ethers.js)](#10-frontend-integration-ethersjs)
11. [Testing](#11-testing)
12. [Future Improvements](#12-future-improvements)

---

## 1. Project Overview

**Airlink** is a peer-to-peer WiFi sharing marketplace — "Airbnb for WiFi." WiFi owners monetize spare bandwidth by listing their hotspots, and users purchase temporary access.

### Before Pivot (Centralized)

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React + Vite + TailwindCSS              |
| Backend  | Node.js + Express + TypeScript          |
| Database | MongoDB (Mongoose)                      |
| Payments | Razorpay (INR fiat)                     |
| Auth     | JWT tokens                              |
| Gateway  | Local Node.js server + Windows Firewall |

### After Pivot (Hybrid Decentralized)

| Layer             | Technology                                                      |
| ----------------- | --------------------------------------------------------------- |
| Frontend          | React + Vite + **ethers.js** + **MetaMask**                     |
| Smart Contracts   | **Solidity on Ethereum (EVM)**                                  |
| Off-chain Backend | Node.js + Express (gateway, monitoring, metadata)               |
| Storage           | **IPFS** (metadata, images) + MongoDB (sessions, health)        |
| Payments          | **ETH native** (smart contract escrow)                          |
| Auth              | **Wallet-based** (MetaMask / WalletConnect) + JWT for off-chain |
| Gateway           | Local Node.js server + Windows Firewall (unchanged)             |

---

## 2. Why Blockchain?

### Problems with Centralized Approach

| Problem                     | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| **Trust**                   | Users must trust the platform to not manipulate bookings or earnings |
| **Payment Transparency**    | Earnings split is opaque — owners can't verify the 98/2 split        |
| **Censorship**              | Platform can remove owners or block users arbitrarily                |
| **Single Point of Failure** | If our backend goes down, payments and bookings stop                 |
| **Dispute Evidence**        | No immutable proof of bookings or payments                           |

### How Blockchain Solves These

| Solution                      | Blockchain Benefit                                                  |
| ----------------------------- | ------------------------------------------------------------------- |
| **Trustless Escrow**          | ETH locked in smart contract until session completes — no middleman |
| **Transparent Revenue Split** | 98/2 split is hardcoded in Solidity — anyone can audit              |
| **Immutable Records**         | Spot registrations and bookings are permanent on-chain              |
| **Decentralized Payments**    | Works globally without Razorpay/Stripe — just need a wallet         |
| **Verifiable Ownership**      | Spot ownership tied to Ethereum address — cryptographic proof       |
| **Dispute Resolution**        | On-chain dispute mechanism with transparent resolution              |

### What Blockchain Doesn't Solve

- **Real-time connectivity** — can't check if a router is online from a smart contract
- **Bandwidth control** — physical hardware management needs local software
- **Captive portal** — device-level HTTP interception requires a local gateway
- **Map/UI rendering** — frontend needs a browser, not a blockchain

---

## 3. Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  React App   │  │  MetaMask    │  │  ethers.js Provider       │ │
│  │  (Vite)      │◄─┤  Wallet      │◄─┤  Contract Interactions    │ │
│  └──────┬───────┘  └──────────────┘  └───────────┬───────────────┘ │
│         │                                         │                 │
└─────────┼─────────────────────────────────────────┼─────────────────┘
          │ REST API                                │ JSON-RPC
          ▼                                         ▼
┌──────────────────┐                    ┌─────────────────────────┐
│  Off-Chain        │                    │  Ethereum Network       │
│  Backend          │                    │  (Sepolia Testnet)      │
│  (Express.js)     │                    │                         │
│                   │                    │  ┌───────────────────┐  │
│  • Health Monitor │ ◄── reads ──────── │  │ AirlinkMarketplace│  │
│  • Captive Portal │    events          │  │ Smart Contract    │  │
│  • Session Mgmt   │                    │  │                   │  │
│  • IPFS Upload    │                    │  │ • registerSpot()  │  │
│  • Gateway Proxy  │                    │  │ • bookAccess()    │  │
└──────────┬───────┘                    │  │ • verifyAccess()  │  │
           │                             │  │ • completeBooking │  │
           ▼                             │  │ • withdrawEarnings│  │
┌──────────────────┐                    │  └───────────────────┘  │
│  MongoDB          │                    └─────────────────────────┘
│  (Off-chain data) │
│  • Sessions       │                    ┌─────────────────────────┐
│  • Health pings   │                    │  IPFS                   │
│  • Device info    │                    │  • Spot metadata        │
│  • Captive state  │                    │  • Images               │
└──────────────────┘                    │  • Location data        │
                                         └─────────────────────────┘
           ┌─────────────────────────────────────────┐
           │          OWNER'S DEVICE                  │
           │  ┌──────────────┐  ┌─────────────────┐  │
           │  │  Gateway.js  │  │  WiFi Hotspot   │  │
           │  │  (Port 8080) │  │  (Hardware)     │  │
           │  │              │  │                 │  │
           │  │  • Firewall  │  │  • SSID/Pass    │  │
           │  │  • DNS Redir │  │  • DHCP         │  │
           │  │  • Portal    │  │  • NAT          │  │
           │  └──────────────┘  └─────────────────┘  │
           └─────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────┐        ┌──────────┐        ┌──────────┐        ┌────────────┐
│ User │        │ Frontend │        │ MetaMask │        │ Smart      │
│      │        │ (React)  │        │          │        │ Contract   │
└──┬───┘        └────┬─────┘        └────┬─────┘        └─────┬──────┘
   │  Click Login    │                   │                     │
   │────────────────>│                   │                     │
   │                 │  Request Account  │                     │
   │                 │──────────────────>│                     │
   │                 │                   │  User Approves      │
   │                 │  Return Address   │                     │
   │                 │<──────────────────│                     │
   │                 │                   │                     │
   │                 │  Sign Message     │                     │
   │                 │──────────────────>│                     │
   │                 │  Signature        │                     │
   │                 │<──────────────────│                     │
   │                 │                   │                     │
   │                 │       (Optional: verify sig on backend) │
   │                 │                   │                     │
   │  Logged in as   │                   │                     │
   │  0xABC...123    │                   │                     │
   │<────────────────│                   │                     │
```

---

## 4. Smart Contract Design

### Contract: `AirlinkMarketplace.sol`

**Location:** `blockchain/contracts/AirlinkMarketplace.sol`

### Entities

#### WifiSpot

| Field             | Type       | Description                                  |
| ----------------- | ---------- | -------------------------------------------- |
| `id`              | uint256    | Auto-incremented spot ID                     |
| `owner`           | address    | Ethereum address of spot owner               |
| `name`            | string     | Human-readable name                          |
| `locationHash`    | string     | Geohash or IPFS CID (privacy-preserving)     |
| `metadataURI`     | string     | IPFS URI for rich data (images, description) |
| `pricePerHourWei` | uint256    | Price in wei per hour                        |
| `speedMbps`       | uint256    | Advertised speed                             |
| `maxUsers`        | uint8      | Max concurrent users                         |
| `currentUsers`    | uint8      | Current active users                         |
| `tag`             | SpotTag    | Category enum                                |
| `status`          | SpotStatus | Active / Inactive / Suspended                |
| `isVerified`      | bool       | Platform has verified ownership              |
| `totalEarnings`   | uint256    | Lifetime earnings                            |
| `totalBookings`   | uint256    | Total bookings received                      |

#### Booking

| Field             | Type          | Description                         |
| ----------------- | ------------- | ----------------------------------- |
| `id`              | uint256       | Auto-incremented booking ID         |
| `spotId`          | uint256       | Reference to WiFi spot              |
| `user`            | address       | Booker's wallet address             |
| `spotOwner`       | address       | Owner's wallet (denormalized)       |
| `startTime`       | uint256       | Unix timestamp for start            |
| `endTime`         | uint256       | Unix timestamp for end              |
| `totalPaid`       | uint256       | ETH amount sent by user             |
| `ownerEarnings`   | uint256       | 98% of totalPaid                    |
| `platformFee`     | uint256       | 2% of totalPaid                     |
| `status`          | BookingStatus | Pending → Active → Completed        |
| `accessTokenHash` | bytes32       | keccak256 of off-chain access token |

### Core Functions

```
registerSpot()        → Owner lists a new WiFi hotspot
updateSpot()          → Owner changes price or status
verifySpot()          → Platform marks spot as verified

bookAccess()          → User pays ETH to book WiFi time (payable)
activateBooking()     → Set access token hash after payment
verifyAccess()        → Check if an access token is valid (view, free)
completeBooking()     → Release funds to owner on completion
cancelBooking()       → Cancel with full/partial refund

disputeBooking()      → User raises a dispute
resolveDispute()      → Platform resolves with refund %

withdrawEarnings()    → Owner claims accumulated earnings
withdrawPlatformFees() → Platform claims fees

calculateBookingCost() → Preview cost before booking (view, free)
```

### Events Emitted

| Event                | When                                |
| -------------------- | ----------------------------------- |
| `SpotRegistered`     | New spot created                    |
| `SpotUpdated`        | Price or status changed             |
| `SpotVerified`       | Platform verified ownership         |
| `BookingCreated`     | User booked and paid ETH            |
| `BookingActivated`   | Access token hash set               |
| `BookingCompleted`   | Session finished, funds distributed |
| `BookingCancelled`   | Cancelled with refund               |
| `BookingDisputed`    | User raised a dispute               |
| `EarningsWithdrawn`  | Owner claimed earnings              |
| `PlatformWithdrawal` | Platform claimed fees               |

---

## 5. Data Flow

### Complete Booking Flow (Blockchain)

```
User                    Frontend              Smart Contract          Off-chain Backend
 │                        │                        │                        │
 │  1. Browse spots       │                        │                        │
 │───────────────────────>│  getSpot(id)           │                        │
 │                        │───────────────────────>│                        │
 │                        │  spot data             │                        │
 │                        │<───────────────────────│                        │
 │                        │                        │                        │
 │                        │  GET /spots/:id/health │                        │
 │                        │───────────────────────────────────────────────>│
 │                        │  { isOnline, uptime }  │                        │
 │                        │<───────────────────────────────────────────────│
 │                        │                        │                        │
 │  2. Book WiFi (pay)    │                        │                        │
 │───────────────────────>│                        │                        │
 │                        │  calculateBookingCost()│                        │
 │                        │───────────────────────>│                        │
 │                        │  { total, fee, share } │                        │
 │                        │<───────────────────────│                        │
 │                        │                        │                        │
 │  3. Confirm TX         │  bookAccess{value: X}()│                       │
 │  (MetaMask popup)      │───────────────────────>│                        │
 │                        │  BookingCreated event  │                        │
 │                        │<───────────────────────│                        │
 │                        │                        │                        │
 │                        │  4. Generate token     │                        │
 │                        │───────────────────────────────────────────────>│
 │                        │  accessToken           │                        │
 │                        │<───────────────────────────────────────────────│
 │                        │                        │                        │
 │                        │  5. activateBooking()  │                        │
 │                        │───────────────────────>│                        │
 │                        │  BookingActivated      │                        │
 │                        │<───────────────────────│                        │
 │                        │                        │                        │
 │  6. Show credentials   │                        │                        │
 │<───────────────────────│                        │                        │
 │                        │                        │                        │
 │  7. Connect to WiFi    │                        │                        │
 │  8. Enter token on     │                        │                        │
 │     captive portal     │───────────────────────────────────────────────>│
 │                        │                        │                        │
 │                        │  9. verifyAccess()     │                        │
 │                        │<──────────────────────>│  (called by backend)   │
 │                        │                        │                        │
 │                        │  10. Grant access      │                        │
 │  WiFi granted ✓        │<───────────────────────────────────────────────│
 │                        │                        │                        │
 │  11. Session ends      │                        │                        │
 │───────────────────────>│  completeBooking()     │                        │
 │                        │───────────────────────>│                        │
 │                        │  Funds → owner balance │                        │
 │                        │<───────────────────────│                        │
 │                        │                        │                        │
 │                        │                        │  12. Owner withdraws   │
 │                        │  withdrawEarnings()    │                        │
 │                        │───────────────────────>│                        │
 │                        │  ETH → owner wallet    │                        │
```

### Access Token Verification (On-chain)

```
Token generated off-chain:  "a4f8c2e1b9d73f06"
                                    │
                                    ▼
                        keccak256("a4f8c2e1b9d73f06")
                                    │
                                    ▼
                    0x7f3a... (stored in booking.accessTokenHash)
                                    │
    Captive portal receives token ──┘
                                    │
            Contract: verifyAccess(bookingId, "a4f8c2e1b9d73f06")
                                    │
                 keccak256(input) == booking.accessTokenHash?
                                    │
                            ┌───────┴───────┐
                            │               │
                         true            false
                      (grant)          (deny)
```

---

## 6. Business Logic

### Revenue Model (On-chain)

```
User pays:      1.0 ETH
Platform fee:   0.02 ETH  (2%, hardcoded as PLATFORM_FEE_BPS = 200)
Owner receives: 0.98 ETH  (98%)

All splits happen automatically in the smart contract.
No manual calculation. No trust required.
```

### Escrow Mechanism

1. User's ETH is locked in the contract when `bookAccess()` is called
2. Neither the user nor the owner can access the funds during the session
3. On `completeBooking()`, funds are credited to the owner's withdrawable balance
4. Owner calls `withdrawEarnings()` to move ETH to their wallet
5. Platform calls `withdrawPlatformFees()` to claim accumulated fees

### Cancellation & Refund Policy

| Timing             | Refund             | Owner Gets              |
| ------------------ | ------------------ | ----------------------- |
| Before `startTime` | 100%               | 0%                      |
| During session     | 50%                | ~49% (50% minus 2% fee) |
| After `endTime`    | 0% (must complete) | 98%                     |

### Dispute Resolution

1. User calls `disputeBooking()` — marks booking as Disputed
2. Platform investigates off-chain (chat with both parties, check logs)
3. Platform calls `resolveDispute(bookingId, refundPercent)`:
   - 100% refund → user gets everything back
   - 0% refund → owner gets full payment
   - 50% refund → split the difference

---

## 7. What Stays On-Chain vs Off-Chain

### On-Chain (Smart Contract)

| Component                  | Reason                                |
| -------------------------- | ------------------------------------- |
| Spot registration          | Immutable ownership record            |
| Spot verification flag     | Transparent trust signal              |
| Booking creation + payment | Trustless ETH escrow                  |
| Access token hash          | Verifiable proof of authorized access |
| Revenue distribution       | Transparent, automated 98/2 split     |
| Cancellation + refunds     | Automatic, fair refund logic          |
| Dispute mechanism          | Transparent resolution                |
| Earnings tracking          | Owner can audit on Etherscan          |

### Off-Chain (Backend + MongoDB)

| Component                     | Reason                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| **Captive portal system**     | Requires local HTTP server on owner device, real-time IP-level auth |
| **Gateway firewall rules**    | OS-level firewall API, cannot run from blockchain                   |
| **Health monitoring (pings)** | High-frequency data (every 30s), costly on-chain                    |
| **Session management**        | Device tracking, heartbeats, MAC addresses — privacy and cost       |
| **DNS redirect**              | Network-level packet interception                                   |
| **Maps & geolocation UI**     | Frontend rendering, Google Maps API                                 |
| **Spot metadata & images**    | Stored on **IPFS**, referenced by `metadataURI` on-chain            |
| **User profiles**             | Email, phone, profile photos — not needed on-chain                  |
| **Real-time notifications**   | WebSocket/polling — not a blockchain concern                        |
| **Bandwidth control**         | Hardware-level QoS, traffic shaping                                 |
| **OTP for captive portal**    | Short-lived, single-use — wasteful on-chain                         |

### Why This Split Makes Sense

- **Cost**: Ethereum gas fees make high-frequency operations (pings, heartbeats) prohibitively expensive
- **Privacy**: MAC addresses, IPs, device info shouldn't be on a public ledger
- **Latency**: Blockchain confirmations (12s+) are too slow for real-time session management
- **Physics**: Firewall rules and DNS redirect require operating system access

---

## 8. Security Considerations

### Smart Contract Security

| Concern               | Mitigation                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Reentrancy**        | ETH transfers use low-level `call` with state updated before transfer (checks-effects-interactions pattern) |
| **Integer overflow**  | Solidity 0.8+ has built-in overflow checks                                                                  |
| **Access control**    | `onlyPlatform`, `onlySpotOwner` modifiers restrict privileged functions                                     |
| **Front-running**     | Access tokens are hashed before storage — plaintext never on-chain                                          |
| **Denial of service** | `maxUsers` cap prevents infinite bookings; `MIN_PRICE_WEI` prevents spam                                    |
| **Fund locking**      | Cancellation and dispute paths ensure funds are never permanently stuck                                     |

### Access Token Privacy

- The plaintext access token is **never** stored on-chain
- Only `keccak256(token)` is stored in the booking
- `verifyAccess()` is a `view` function — calling it doesn't broadcast the token
- The token is generated off-chain and given to the user via the backend

### Wallet Authentication

- No passwords or JWTs for on-chain actions — wallet signature is the auth
- Backend can verify wallet ownership via `eth_sign` / EIP-712 for off-chain API calls
- Captive portal still uses its existing token system (no wallet needed on the hotspot device)

### Economic Security

- Platform fee is immutable (`constant`) — can't be changed by platform after deployment
- Owner earnings are held in the contract, not forwarded immediately — prevents griefing
- Minimum price (`MIN_PRICE_WEI`) prevents dust-amount spam bookings

---

## 9. Deployment Guide

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Sepolia testnet ETH (from faucet)

### Step 1: Install Dependencies

```bash
cd blockchain
npm install
```

### Step 2: Configure Environment

Create `blockchain/.env`:

```env
# Get from https://www.alchemy.com or https://infura.io
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Your deployer wallet private key (NEVER commit this)
DEPLOYER_PRIVATE_KEY=0xabc123...

# Optional: for contract verification on Etherscan
ETHERSCAN_API_KEY=your_etherscan_key
```

### Step 3: Compile

```bash
npx hardhat compile
```

Output:

```
Compiled 1 Solidity file successfully
```

### Step 4: Test Locally

```bash
npx hardhat test
```

### Step 5: Deploy to Local Hardhat Node

Terminal 1 — start local node:

```bash
npx hardhat node
```

Terminal 2 — deploy:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 6: Deploy to Sepolia Testnet

Get Sepolia ETH from a faucet:

- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

Deploy:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Output:

```
Deploying AirlinkMarketplace...
AirlinkMarketplace deployed to: 0x1234...abcd
Platform owner: 0xYOUR_ADDRESS
```

### Step 7: Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Step 8: Update Frontend

Copy the deployed address into `frontend/src/lib/contracts.ts`:

```typescript
export const AIRLINK_CONTRACT_ADDRESS = "0x1234...abcd";
```

---

## 10. Frontend Integration (ethers.js)

### Connect Wallet

```typescript
import { BrowserProvider } from "ethers";

async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  console.log("Connected:", address);
  return { provider, signer, address };
}
```

### Read Spot Data

```typescript
import { Contract } from "ethers";
import AirlinkABI from "../abi/AirlinkMarketplace.json";

const contract = new Contract(CONTRACT_ADDRESS, AirlinkABI, provider);

const spot = await contract.getSpot(0);
console.log("Spot name:", spot.name);
console.log("Price/hr:", ethers.formatEther(spot.pricePerHourWei), "ETH");
```

### Book WiFi Access

```typescript
const [total] = await contract.calculateBookingCost(spotId, durationHours);

const tx = await contract.bookAccess(spotId, durationHours, 0, {
  value: total, // send exact ETH amount
});
const receipt = await tx.wait();

// Extract booking ID from event
const event = receipt.logs.find(
  (log) => contract.interface.parseLog(log)?.name === "BookingCreated",
);
const bookingId = contract.interface.parseLog(event).args.bookingId;
```

### Verify Access (Free Call)

```typescript
const isValid = await contract.verifyAccess(bookingId, accessToken);
console.log("Access valid:", isValid);
```

### Withdraw Earnings (Owner)

```typescript
const tx = await contract.withdrawEarnings();
await tx.wait();
console.log("Earnings withdrawn!");
```

See full integration code at `frontend/src/lib/contracts.ts`.

---

## 11. Testing

### Run Tests

```bash
cd blockchain
npx hardhat test
```

### Test Coverage

| Test                       | Description                   |
| -------------------------- | ----------------------------- |
| Spot registration          | Register + verify stored data |
| Spot update                | Change price and status       |
| Spot verification          | Only platform can verify      |
| Booking creation           | Pay ETH + booking created     |
| Booking cost check         | Correct 98/2 split            |
| Access activation          | Set token hash                |
| Access verification        | Verify valid/invalid tokens   |
| Booking completion         | Release funds to owner        |
| Cancellation (pre-start)   | 100% refund                   |
| Cancellation (mid-session) | 50% refund                    |
| Earnings withdrawal        | Owner claims ETH              |
| Platform fee withdrawal    | Platform claims fees          |
| Dispute + resolution       | Full dispute lifecycle        |
| Access control             | Unauthorized calls revert     |

---

## 12. Future Improvements

### Short-Term (Post-Hackathon)

- **ERC-20 token payments**: Accept stablecoins (USDC, DAI) alongside ETH
- **On-chain reviews**: NFT-gated review system (only verified bookers can review)
- **Multi-chain deployment**: Deploy on Polygon/Base for cheaper gas
- **ENS integration**: Resolve owner names (e.g., `coffeeshop.airlink.eth`)

### Medium-Term

- **DAO governance**: Community votes on platform fee changes, dispute resolution
- **Staking for verification**: Owners stake ETH to prove commitment — slashed if fraudulent
- **Automated session completion**: Chainlink Keepers to auto-complete expired bookings
- **Dynamic pricing**: Oracle-based pricing that adjusts for demand

### Long-Term Vision

- **WiFi mesh incentive network**: Token rewards for coverage expansion
- **Decentralized identity (DID)**: Replace wallets with Verifiable Credentials
- **Zero-knowledge proofs**: Prove access validity without revealing booking details
- **Cross-chain interoperability**: Bridge access tokens across chains

---

## Appendix: Contract Address

| Network         | Address                      | Explorer                                          |
| --------------- | ---------------------------- | ------------------------------------------------- |
| Local (Hardhat) | Set after `npx hardhat node` | —                                                 |
| Sepolia Testnet | Set after deployment         | [Sepolia Etherscan](https://sepolia.etherscan.io) |
| Mainnet         | TBD                          | [Etherscan](https://etherscan.io)                 |

---

_Built for the Airlink hackathon. Designed to be technically sound while staying realistic for a demo._
