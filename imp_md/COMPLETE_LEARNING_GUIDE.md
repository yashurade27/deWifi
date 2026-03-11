# AIRLINK — Complete Learning Guide for Hackathon Judges
### From Zero Blockchain Knowledge to Confidently Presenting Your Web3 Project

> **How to use this guide:** Read it top to bottom once. It starts from plain English and gradually builds to technical depth. By the end, you will understand every layer of the system and have prepared answers for the hardest judge questions.

---

## Table of Contents

1. [Project Overview](#section-1--project-overview)
2. [Web2 vs Web3 Transition](#section-2--web2-vs-web3-transition)
3. [Blockchain Fundamentals for Beginners](#section-3--blockchain-fundamentals-for-beginners)
4. [Architecture Breakdown](#section-4--architecture-breakdown)
5. [Smart Contract Explanation](#section-5--smart-contract-explanation)
6. [Full User Flow](#section-6--full-user-flow)
7. [Security Considerations](#section-7--security-considerations)
8. [Judge Questions & Answers (25+)](#section-8--judge-questions--answers)
9. [Business & Innovation](#section-9--business--innovation)
10. [30-Second Pitch](#section-10--30-second-pitch)
11. [Technical Deep Dive](#section-11--technical-deep-dive)

---

# SECTION 1 — Project Overview

## What Problem Does Airlink Solve?

Picture this real scenario:

> You land in a new city. Your phone data is almost gone. The hotel charges ₹800/day for WiFi. The café WiFi drops every 5 minutes. And the person in the apartment upstairs has a 200 Mbps fiber connection running at 20% usage — all day, every day.

This is the daily reality for millions of travelers, students, gig workers, and remote professionals.

**On one side:** People desperately need affordable, reliable internet access.

**On the other side:** Millions of broadband users pay for far more bandwidth than they ever use. That excess capacity is wasted every single day.

**Airlink connects these two groups.**

---

## The Solution in One Sentence

> **Airlink is a peer-to-peer WiFi sharing marketplace — think "Airbnb for internet access."**

---

## How It Works (Plain English)

- **A homeowner, café operator, or office** registers their WiFi hotspot on Airlink, sets a price per hour (e.g., ₹30/hour), and goes about their day.
- **A traveler or student** opens the Airlink app, sees nearby hotspots on a map, picks one, pays a few rupees worth of ETH, and gets a time-limited WiFi pass.
- **The owner earns 98% of every booking**, automatically, with no manual work.
- **Access is enforced at the hardware level** — not just a PIN or password. A captive portal gateway running on the owner's device controls real network access. When the session expires, the internet cuts off automatically.

---

## What Makes Airlink Unique?

| Feature | Traditional WiFi Options | Airlink |
|---|---|---|
| Cost | ₹500–1,000/day (hotel) | ₹30–100/hour — pay only for what you use |
| Flexibility | Fixed daily/monthly rates | Book by the hour |
| Availability | Only hotels, cafés, airports | Any home, office, or co-working space |
| Owner Earnings | Zero | 98% of every booking |
| Access Control | Shared password (insecure) | NFT access pass + captive portal enforcement |
| Payments | Centralized (Razorpay, UPI) | Blockchain-based (ETH, trustless, transparent) |
| Trust | Must trust the platform | Smart contract rules are public and unalterable |

**The hardware moat:** Anyone can copy the app UI. But the gateway layer — the captive portal running on physical hardware that enforces access at the network level — cannot be forked. That is the defensible moat.

---

## The Business Idea

Airlink operates as a two-sided marketplace:

- **Supply side:** WiFi owners (anyone with broadband) monetize idle bandwidth.
- **Demand side:** Users (travelers, students, remote workers) pay for reliable short-term connectivity.
- **Platform revenue:** 2% fee on every transaction, automatically collected by the smart contract.
- **Future revenue:** Premium listings, enterprise WiFi management plans, analytics subscriptions.

**Market size:** India alone has 800 million+ internet users, but significant last-mile coverage gaps. Airlink turns every home router into potential public infrastructure.

---

# SECTION 2 — Web2 vs Web3 Transition

## How the Original Web2 System Worked

Before the blockchain pivot, Airlink was a standard MERN stack application:

```
User pays with card
        ↓
Razorpay processes payment (centralized payment gateway)
        ↓
Airlink backend receives a confirmation webhook
        ↓
Backend stores the booking in MongoDB
        ↓
Backend decides when & how much to pay the WiFi owner
        ↓
Owner trusts Airlink to send them money correctly
```

**Technology used:**
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Payments: Razorpay (INR fiat)
- Authentication: JWT (JSON Web Tokens)
- Gateway: Local Node.js server + Windows Firewall

---

## The Problem with Web2

| Problem | What It Means in Practice |
|---|---|
| **Trust** | The platform holds all the money. Owners must trust Airlink to calculate and distribute earnings honestly. |
| **Opacity** | The 98/2 revenue split is a promise in text, not a guarantee in code. |
| **Central failure** | If the Airlink server goes down, all payments stop. |
| **Censorship** | The platform can freeze any owner or user account at any time. |
| **No proof** | Users have no immutable evidence that they paid. If there's a dispute, it's one person's word against another. |

---

## What Changed in the Web3 Version

```
User sends ETH directly to a smart contract
        ↓
Smart contract instantly validates: Is the spot active? Is capacity available? Is the payment correct?
        ↓
ETH is locked inside the contract — NOBODY can touch it, not even Airlink
        ↓
An NFT access pass is minted and sent to the user's wallet
        ↓
Session completes → contract automatically splits: 98% → owner, 2% → platform
        ↓
Everything is recorded permanently on the Ethereum blockchain
```

**Technology added:**
- Smart Contracts: Solidity on Ethereum (EVM)
- Wallet Authentication: MetaMask
- Token Standard: ERC-721 NFTs as access passes
- Payments: ETH (native Ethereum currency)
- Contract Library: OpenZeppelin (battle-tested security modules)
- Development Framework: Hardhat (for compiling, testing, deploying)
- Frontend Integration: ethers.js v6 (connects the browser to the blockchain)

---

## Why Were These Changes Made?

### 1. Remove the Need for Trust
In Web2, users trust Airlink. In Web3, users trust **math and code**. The smart contract rules are public, auditable, and cannot be changed by Airlink after deployment.

### 2. Make Payments Automatic and Transparent
The 98/2 split is not a policy written in a PDF. It is a number hardcoded into Solidity smart contract code:
```solidity
uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
```
Anyone in the world can read this on the blockchain. It cannot be changed without re-deploying the contract.

### 3. Replace Razorpay (Centralized) with ETH (Decentralized)
Razorpay only works in India, requires bank accounts, and can freeze payments. ETH works anywhere in the world, 24/7, for anyone with a wallet.

### 4. Represent Access as an NFT
Instead of a booking record in a centralized database, the user now holds an NFT in their own wallet. This NFT is their proof of access. The gateway device verifies it directly on-chain — no backend required.

---

## What the Web3 Upgrade Did NOT Change

- **The captive portal gateway** still runs locally on the owner's machine.
- **MongoDB** still stores off-chain data: user profiles, health pings, session logs.
- **The React frontend** still serves the UI (it now also talks to the blockchain via ethers.js).
- **The Express backend** still handles off-chain operations: auth, discovery, monitoring.

This is a **hybrid architecture** — blockchain handles what blockchain is good at (payments, access rights, immutable records), and traditional web infrastructure handles everything else.

---

# SECTION 3 — Blockchain Fundamentals for Beginners

> This section teaches you every blockchain concept used in Airlink from scratch. Read it carefully — these are the concepts judges will probe.

---

## What is a Blockchain?

**Simple analogy:** Imagine a Google Sheet that the whole world can read. Nobody can edit or delete a past row. New rows can only be added if a majority of the network agrees. Nobody owns this sheet — it runs itself.

**Technical definition:** A blockchain is a distributed ledger — a database replicated across thousands of computers worldwide. Transactions are grouped into "blocks" and chained together using cryptography, making them impossible to alter retroactively.

**Key properties:**
- **Immutable:** Once written, data cannot be changed.
- **Transparent:** Anyone can read the full history.
- **Decentralized:** No single server, company, or government controls it.
- **Trustless:** You don't need to trust any person or company — just the math.

---

## What is Ethereum?

Think of Bitcoin as digital gold — a store of value. **Ethereum is a programmable blockchain.** You can deploy programs (called smart contracts) onto it that run automatically when triggered.

Ethereum is powered by a global network of computers (nodes). In Airlink, when a user pays for WiFi, the transaction goes to the Ethereum network, is verified by thousands of nodes around the world, and gets permanently recorded.

---

## What is a Smart Contract?

**Simple analogy:** A vending machine. You put in the right amount of money, press a button, and the machine delivers the item — automatically, without a cashier, without trust, without error. No one can intercept the transaction or change the rules mid-way.

**Technical definition:** A smart contract is a program written in Solidity (a programming language for Ethereum) that runs on the blockchain. Once deployed, it cannot be modified. It executes predefined rules automatically when certain conditions are met.

**In Airlink:** The smart contract is the Vending Machine. You pay the exact right amount of ETH → the contract gives you an access pass NFT automatically.

---

## What is a Wallet?

**Simple analogy:** A wallet is like a bank account, except you are the bank. Nobody else can control it. Nobody can freeze it. It is identified by a unique address (a string of letters and numbers).

Your wallet holds:
- Your ETH (money)
- Your NFTs (access passes)
- Your transaction history

**MetaMask** is the most popular Ethereum wallet. It's a browser extension. In Airlink, users connect MetaMask to pay for WiFi and receive their access pass NFT.

---

## Public Key and Private Key — Explained Simply

**Simple analogy:**
- Your **public key** (wallet address) is like your bank account number — you give it to anyone who wants to send you money.
- Your **private key** is like your ATM PIN — you never share it. Anyone who has it controls all your funds.

**Technical detail:** These are cryptographic key pairs. Your wallet address is mathematically derived from your public key. When you sign a transaction, you use your private key to create a digital signature — proof that you authorized the transaction — without ever revealing the private key itself.

**Critical rule:** Whoever controls the private key controls the wallet. This is why MetaMask stores your private key encrypted on your device.

---

## What is a Transaction?

Every interaction with the blockchain — sending ETH, calling a smart contract function — is a **transaction**. Each transaction:
- Has a unique hash (ID) like `0x8f3a...`
- Is signed by the sender's private key
- Contains the data being sent (who, what, how much)
- Is permanently recorded on the blockchain

In Airlink, when you call `purchaseAccess()`, that's a transaction with:
- Sender: your wallet address
- Recipient: the AccessManager smart contract address
- Value: the ETH payment
- Data: encoded function call with `spotId` and `durationHours`

---

## What are Gas Fees?

**Simple analogy:** Gas fee is the service charge you pay to the network for processing your transaction. Like a bank wire transfer fee, except it goes to the miners/validators who maintain the network.

**Technical detail:** Every operation in a smart contract costs a certain amount of "gas" — a unit measuring computational work. You pay gas in ETH. If the network is busy, gas prices rise (like surge pricing for Uber).

**In Airlink:** When a user buys WiFi access, they pay:
1. The WiFi access fee (goes to the owner)
2. The gas fee (goes to the Ethereum network)

---

## What are Tokens and NFTs?

**Token:** A digital asset on the blockchain. ETH is the native token of Ethereum. Projects can create their own tokens (like a frequent flyer points system but on-chain).

**NFT (Non-Fungible Token):** A unique, one-of-a-kind token. Unlike ETH (where 1 ETH = 1 ETH), each NFT is distinct — it has a unique ID and data attached to it.

**In Airlink:** Each WiFi access session is minted as an **ERC-721 NFT** (the standard for unique tokens). Your access pass NFT contains:
- Which WiFi spot it grants access to
- When the session starts
- When the session expires
- How many hours were purchased

Users can see this NFT in their MetaMask wallet just like they'd see any other digital collectible.

---

## On-Chain vs Off-Chain

| On-Chain | Off-Chain |
|---|---|
| Stored permanently on the blockchain | Stored in traditional databases (MongoDB) |
| Public, transparent, immutable | Private, mutable, faster |
| Costs gas to write | Free to write |
| Accessed by smart contracts | Accessed via REST APIs |

**In Airlink:**
- **On-chain:** Payments, access NFTs, spot registrations, earnings distribution, session status
- **Off-chain:** User profiles, spot images, health monitoring data, captive portal state, reviews

**Design principle:** Put on-chain only what needs to be trusted. Keep everything else off-chain for speed and cost efficiency.

---

## ERC-721 — The NFT Standard

ERC stands for "Ethereum Request for Comments" — it's like a rulebook. ERC-721 is the agreed standard for unique (non-fungible) tokens.

Every ERC-721 token must support functions like `ownerOf(tokenId)`, `transferFrom()`, and `tokenURI()`. By following this standard:
- NFTs work in all Ethereum wallets automatically
- NFTs appear in OpenSea and other marketplaces
- Any app can verify ownership without custom code

**Why ERC-721 and not ERC-20 or ERC-1155?**

| Standard | Type | Why Not Airlink? |
|---|---|---|
| ERC-20 | Fungible tokens (like coins) | Access passes are not interchangeable — each has unique spot & time |
| ERC-1155 | Multi-token standard | Overkill for one-of-a-kind session passes |
| **ERC-721** | **Unique tokens (NFTs)** | **✅ Perfect — each session is inherently unique** |

---

## OpenZeppelin — The Security Foundation

OpenZeppelin is like a library of pre-audited, battle-tested security modules for Ethereum smart contracts. Instead of writing security code from scratch (risky), Airlink imports:

- `Ownable` — only the contract owner can call admin functions
- `ReentrancyGuard` — prevents a class of attack where a contract is called mid-execution to drain funds
- `ERC721` — the full implementation of the NFT standard
- `Base64` — encodes NFT metadata so it renders in wallets

Using OpenZeppelin is considered best practice. Judges will respect this choice.

---

# SECTION 4 — Architecture Breakdown

## The Big Picture

Airlink has four layers working together:

```
┌───────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                         │
│  React App (UI)  +  MetaMask (Wallet)  +  ethers.js       │
└───────────────────────────┬───────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │ REST API    │             │ JSON-RPC (blockchain calls)
              ▼             │             ▼
┌─────────────────────┐     │   ┌───────────────────────────────────┐
│  Express Backend    │     │   │  Ethereum Blockchain               │
│  (Node.js)          │     │   │                                   │
│  • Auth (JWT)       │     │   │  ┌─────────────┐  ┌────────────┐ │
│  • Spot discovery   │     │   │  │ WiFiRegistry│  │AccessNFT   │ │
│  • Health monitor   │     │   │  │ (Spot data) │  │(ERC-721)   │ │
│  • Captive portal   │     │   │  └─────────────┘  └────────────┘ │
│  • Session logs     │     │   │  ┌─────────────┐  ┌────────────┐ │
└─────────┬───────────┘     │   │  │PaymentEscrow│  │AccessMgr   │ │
          │                 │   │  │(ETH custody)│  │(Orchestrat)│ │
          ▼                 │   │  └─────────────┘  └────────────┘ │
┌─────────────────────┐     │   └───────────────────────────────────┘
│  MongoDB            │     │
│  (Off-chain data)   │     │
│  • Users            │     │
│  • Spot metadata    │     │
│  • Sessions         │     │
└─────────────────────┘     │
                            │
┌───────────────────────────▼───────────────────────────────┐
│               OWNER'S DEVICE (Local Gateway)              │
│  gateway.js + DNS Redirect + Windows Firewall             │
│  → Controls actual internet access at network level       │
└───────────────────────────────────────────────────────────┘
```

---

## Component 1: Frontend (React + ethers.js + MetaMask)

**What it does:** The browser-side UI where users browse spots, connect wallets, and pay for access.

**Key technologies:**
- **React + Vite + TailwindCSS** — UI framework for building fast, responsive pages
- **ethers.js v6** — JavaScript library that connects the browser to Ethereum. It can read contract state, send transactions, and listen for blockchain events.
- **MetaMask** — browser wallet extension. ethers.js asks MetaMask to sign and broadcast transactions.

**How they work together:**
```
User clicks "Pay for WiFi"
    ↓
React calls ethers.js: contract.purchaseAccess(spotId, hours, {value: totalCost})
    ↓
ethers.js asks MetaMask to sign the transaction
    ↓
MetaMask shows the user: "Confirm this transaction: 0.003 ETH + gas fee?"
    ↓
User confirms → MetaMask broadcasts to Ethereum network
    ↓
Transaction confirmed → ethers.js receives the receipt with NFT tokenId
```

---

## Component 2: Backend (Express + MongoDB)

**What it does:** Handles everything that doesn't need to be on the blockchain — user accounts, spot discovery, health monitoring, captive portal logic.

**Key technologies:**
- **Node.js + Express + TypeScript** — REST API server
- **MongoDB + Mongoose** — database for off-chain data
- **JWT (JSON Web Tokens)** — traditional authentication for the REST API layer

**What it stores:**
- User profiles (name, email, role)
- Spot metadata (location, images, description)
- Booking records that reference the blockchain `txHash` and `tokenId`
- Session health pings
- Captive portal state

**Important:** The backend does NOT handle payments. Payments go directly from user → smart contract.

---

## Component 3: Blockchain Layer (4 Smart Contracts)

The blockchain layer consists of four modular Solidity contracts deployed on Ethereum:

| Contract | Role |
|---|---|
| `WiFiRegistry` | The "directory" — stores which spots exist, their prices, and capacities |
| `AirlinkAccessNFT` | The "ticket printer" — mints ERC-721 access passes |
| `PaymentEscrow` | The "safe" — holds ETH and releases it when sessions complete |
| `AccessManager` | The "manager" — the single entry point users interact with |

These contracts are separate but work together. `AccessManager` coordinates the other three.

---

## Component 4: Gateway (Node.js + Windows Firewall)

**What it does:** Runs on the WiFi owner's physical device (their PC or router). When a user connects to the owner's WiFi network, the gateway:
1. Intercepts their first HTTP request (like a hotel login page)
2. Shows the captive portal page
3. Asks for the access token from the user's NFT
4. Calls the blockchain to verify: `verifyAccess(tokenId, userAddress)`
5. If valid — adds a firewall rule allowing that device's internet traffic
6. When the session expires — removes the firewall rule, cutting access

**This is the hardware moat.** Access is enforced at the network level, not the app level.

---

## How the Components Talk to Each Other

```
Browser (React)
    → ethers.js → Ethereum RPC → Smart Contracts   [blockchain calls]
    → fetch/axios → Express API → MongoDB           [REST API calls]

Gateway (owner's device)
    → ethers.js read call → AccessManager.verifyAccess()  [free view call]

Backend
    → reads blockchain events (AccessPurchased, SessionCompleted)
    → stores txHash + tokenId references in MongoDB
```

---

# SECTION 5 — Smart Contract Explanation

## Overview: The Four Contracts and Why They Are Separate

The original Airlink codebase had a **single monolithic contract** (`AirlinkMarketplace.sol`) that did everything: register spots, handle bookings, escrow payments, verify access, manage tokens. This is a common beginner mistake. Problems:
- Hard to test and audit
- A bug in one feature could compromise all others
- Expensive to upgrade (you'd have to re-deploy and migrate everything)

**Version 2 splits responsibilities across 4 focused contracts.** This is called the **Separation of Concerns** principle.

---

## Contract 1: WiFiRegistry.sol

### What It Does
The WiFiRegistry is the on-chain directory of all WiFi hotspots. Think of it as the "Yellow Pages" for WiFi — anyone can look up spots, prices, capacities, and owner addresses.

### Why It Exists
Storing spot data on-chain makes it censorship-resistant and publicly auditable. No one — not even Airlink — can secretly remove a spot or change its price without the owner's permission.

### Key Data Stored On-Chain (Per Spot)

```solidity
struct WifiSpot {
    uint256 id;
    address owner;           // Owner's Ethereum wallet address
    string  name;            // Human-readable name
    string  locationHash;    // Geohash or IPFS CID (keeps exact coordinates private)
    string  metadataURI;     // IPFS link to images, description, amenities
    uint256 pricePerHourWei; // Price in ETH (smallest unit: wei)
    uint256 speedMbps;       // Advertised internet speed
    uint8   maxUsers;        // Max concurrent connections allowed
    uint8   currentUsers;    // Live count of active sessions
    SpotStatus status;       // Active / Inactive / Suspended
    bool    isVerified;      // Has Airlink verified this spot?
    uint256 totalEarnings;   // Lifetime earnings in wei
    uint256 totalBookings;   // Total number of completed bookings
}
```

### Important Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `registerSpot(name, location, price, speed, maxUsers, tag)` | WiFi owner | Creates a new spot entry on-chain |
| `updateSpot(spotId, newPrice, newStatus)` | WiFi owner | Updates price or activates/deactivates spot |
| `verifySpot(spotId)` | Platform admin only | Marks a spot as verified after off-chain proof |
| `incrementUsers(spotId)` | AccessManager only | Increases current user count when someone books |
| `decrementUsers(spotId)` | AccessManager only | Decreases count when session ends |
| `addEarnings(spotId, amount)` | AccessManager only | Adds to the spot's total earnings record |
| `getSpot(spotId)` | Anyone (free) | Returns full spot data |
| `isSpotActive(spotId)` | Anyone (free) | Returns true/false |
| `hasCapacity(spotId)` | Anyone (free) | Returns true if currentUsers < maxUsers |

### Security Design
- Only the `onlySpotOwner` modifier allows owners to modify their own spots
- Only the `onlyManager` modifier allows `AccessManager` to mutate session-related fields (so nobody can hack the user counts directly)
- The minimum price is enforced: `MIN_PRICE_WEI = 0.0001 ether` (prevents dust spam)

---

## Contract 2: AirlinkAccessNFT.sol

### What It Does
This contract is the NFT minter. Every time a user purchases WiFi access, this contract creates (mints) a unique ERC-721 token and sends it to the user's wallet. That NFT **is** the access pass.

### Why It Exists
By representing access rights as NFTs (instead of a database row), we get:
- **Self-custody:** The access pass lives in the user's own wallet
- **Composability:** The NFT is verifiable by any Ethereum app
- **Visual proof:** It renders as a visual card in MetaMask and OpenSea
- **On-chain verification:** The gateway can check validity directly — no backend needed

### Key Data Stored Per NFT

```solidity
struct AccessPass {
    uint256 spotId;           // Which WiFi spot this grants access to
    address originalBuyer;    // Who purchased it
    uint256 startTime;        // Unix timestamp: when access begins
    uint256 expiresAt;        // Unix timestamp: when access expires
    uint256 durationHours;    // Number of hours booked
    bool    revoked;          // True after session completion/cancellation
}
```

### Important Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `mintAccess(to, spotId, start, expiry, hours)` | AccessManager only | Creates the NFT and sends it to the user |
| `revokeAccess(tokenId)` | AccessManager only | Marks the NFT as used/expired |
| `isAccessValid(tokenId)` | Anyone (free) | Returns true if token exists, not revoked, and within time window |
| `isAccessValidFor(tokenId, userAddress)` | Anyone (free) | Checks validity AND that the caller owns the token |
| `tokenURI(tokenId)` | Anyone (free) | Returns full NFT metadata (name, image, attributes) as base64 JSON |

### On-Chain SVG Metadata
The NFT's visual image is generated **entirely on-chain** as an SVG (a vector graphics format). No external hosting needed. The card shows:
- Token ID (the session number)
- Which spot it grants access to
- Duration in hours
- Current status: Active / Expired / Revoked / Scheduled

This means the NFT renders correctly in MetaMask forever — even if Airlink's servers go down.

---

## Contract 3: PaymentEscrow.sol

### What It Does
The PaymentEscrow is the trustless safe that holds user payments during an active session. Nobody — not Airlink, not the owner, not the user — can access the funds until the session concludes according to the rules.

### Why It Exists
Without escrow, you'd have to choose:
- Pay the owner upfront → user has no recourse if the WiFi doesn't work
- Pay after session → owner has no guarantee of payment

Escrow solves this: the money is locked in a neutral contract. The contract releases it automatically based on predetermined rules.

### The 98/2 Split
When a user pays 0.01 ETH for WiFi:
- `platformFee = 0.01 ETH × 2% = 0.0002 ETH` → accumulates in `platformBalance`
- `ownerShare = 0.01 ETH - 0.0002 ETH = 0.0098 ETH` → sent to owner on session completion

Both numbers are calculated in `AccessManager` and stored in the escrow deposit record.

### Key Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `deposit(tokenId, payer, recipient, platformFee)` | AccessManager only | Locks ETH for the session |
| `release(tokenId)` | AccessManager only | Sends owner share to owner on normal completion |
| `refund(tokenId, refundPercent)` | AccessManager only | Calculates and sends proportional refund on cancellation |
| `withdrawPlatformFees()` | Platform admin only | Withdraws accumulated 2% fees to platform wallet |

### Proportional Cancellation Refunds
If a user cancels mid-session:
- Before start: **100% refund**
- 25% through session: **75% refund** (remaining time)
- 50% through session: **50% refund**
- After end: **0% refund** (use `completeSession` instead)

The refund percentage is calculated in the AccessManager based on `block.timestamp`, `startTime`, and `endTime`.

### ReentrancyGuard
`PaymentEscrow` uses OpenZeppelin's `ReentrancyGuard`. This prevents **reentrancy attacks** — a famous smart contract vulnerability where a malicious contract, when receiving ETH, calls back into the sending contract to drain more funds before the original transfer completes. The `nonReentrant` modifier locks the function during execution, making this attack impossible.

---

## Contract 4: AccessManager.sol

### What It Does
The AccessManager is the **orchestrator** — the single contract that users directly interact with. It receives user requests, validates them, and coordinates the other three contracts.

Think of it as: the receptionist who takes your request, validates it, calls the ticket printer, charges your account, and updates the database — all in one atomic (all-or-nothing) transaction.

### Why One Entry Point?
- Simplifies the user experience (one contract address to interact with)
- Enforces business logic in one place (capacity checks, pricing validation, fee calculations)
- Ensures all operations happen atomically: if ANY step fails, the ENTIRE transaction reverts, and no money is lost

### Session Lifecycle

```
purchaseAccess() → Session: ACTIVE
      ↓
  completeSession() → Session: COMPLETED  (funds released to owner)
  cancelSession()   → Session: CANCELLED  (proportional refund)
  disputeSession()  → Session: DISPUTED   (admin resolves manually)
```

### Key Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `purchaseAccess(spotId, durationHours, startTime)` | User (payable) | Full booking flow: validate → mint NFT → escrow ETH → record session |
| `completeSession(tokenId)` | User / Owner / Admin / Anyone (if expired) | Finalizes session: release escrow → update registry → revoke NFT |
| `cancelSession(tokenId)` | User or Admin | Cancels early: calculate refund → partial release → revoke NFT |
| `disputeSession(tokenId)` | User or Owner | Flags for manual admin resolution |
| `resolveDispute(tokenId, refundPercent)` | Admin only | Admin decides split: 0–100% refund |
| `verifyAccess(tokenId, userAddress)` | Gateway (free view) | Returns: is this token valid right now? |
| `verifyAccessForSpot(tokenId, userAddress, spotId)` | Gateway (free view) | Verifies for a specific spot ID |

### The `purchaseAccess` Function — Step by Step

When a user calls `purchaseAccess(spotId: 7, durationHours: 2, startTime: 0)` and sends 0.006 ETH:

```
1. Check durationHours is between 1 and 24
2. Check WiFiRegistry: Is spot 7 active?
3. Check WiFiRegistry: Does spot 7 have capacity?
4. Get spot 7's owner address from registry
5. Make sure the user isn't buying their own spot
6. Calculate: pricePerHour × 2 hours = 0.006 ETH
7. Verify msg.value (sent ETH) == 0.006 ETH exactly
8. Calculate: fee = 0.006 × 2% = 0.00012 ETH
9. Calculate: ownerShare = 0.006 - 0.00012 = 0.00588 ETH
10. Set: startTime = block.timestamp (now)
11. Set: endTime = startTime + (2 × 1 hour)
12. → Call AirlinkAccessNFT.mintAccess() → Get back tokenId
13. → Call PaymentEscrow.deposit() with ETH, payer, owner, fee
14. → Call WiFiRegistry.incrementUsers(spotId)
15. Store Session record: tokenId → Session{spotId, user, owner, amounts, times, Active}
16. Push tokenId to userSessions[msg.sender]
17. Emit AccessPurchased event (frontend listens for this)
18. Return tokenId
```

All 18 steps happen as a single atomic transaction. If step 13 fails (e.g., escrow rejects), steps 1–12 are undone automatically. No partial states.

### Trustless Session Finalization (Keeper Pattern)
When `completeSession` is called, the authorization check is:
```solidity
require(
    msg.sender == session.user ||
    msg.sender == session.spotOwner ||
    msg.sender == owner() ||
    block.timestamp > session.endTime,  // ← anyone can finalize an expired session
    "Not authorized"
);
```

The last condition is critical. If nobody calls `completeSession` after the session expires, **any person in the world** can call it and trigger the fund release. This ensures funds are never locked forever. This pattern is called a "keeper" in DeFi — external parties incentivized (or simply willing) to finalize stale transactions.

---

# SECTION 6 — Full User Flow

## Step-by-Step: Complete User Journey

---

### STEP 1 — User Opens the Platform
**User action:** Opens `http://localhost:5173` in their browser.

**What happens technically:**
- React app loads from Vite dev server (or production CDN)
- App checks if MetaMask is installed (`window.ethereum`)
- If MetaMask is found, app shows "Connect Wallet" button
- App calls the Express backend to fetch available spots from MongoDB

---

### STEP 2 — User Creates an Account (Off-Chain)
**User action:** Signs up with email and password.

**What happens technically:**
- `POST /api/auth/signup` to the Express backend
- Backend validates input, hashes password with bcrypt
- Stores user in MongoDB
- Returns a JWT token
- JWT is stored in browser localStorage for subsequent API calls

*Note: This traditional auth handles off-chain identity. Blockchain identity comes in Step 3.*

---

### STEP 3 — User Connects Their Wallet
**User action:** Clicks "Connect Wallet."

**What happens technically:**
```
React calls: window.ethereum.request({ method: 'eth_requestAccounts' })
    ↓
MetaMask popup appears: "Airlink wants to connect to your MetaMask wallet. Allow?"
    ↓
User clicks "Connect"
    ↓
MetaMask returns: wallet address (e.g., 0xABC...123)
    ↓
ethers.js creates a BrowserProvider using MetaMask
    ↓
App stores wallet address in React state
    ↓
UI updates to show the truncated address: "0xABC...123"
```

From this point, the user has a blockchain identity. Their wallet address is their on-chain identity — it connects their NFTs, session history, and payments.

---

### STEP 4 — User Discovers WiFi Spots
**User action:** Browses the "Explore" page and finds a spot.

**What happens technically:**
- React calls `GET /api/spots` → Express API → MongoDB (for metadata: images, location, description)
- React also calls `WiFiRegistry.getSpot(spotId)` → reads on-chain data (price, speed, capacity, owner address)
- UI merges both data sources: off-chain richness + on-chain trust

**Why two sources?** Images and text descriptions are cheaper to store off-chain. Prices and ownership are critical to verify on-chain so they can't be manipulated.

---

### STEP 5 — User Selects Spot and Duration
**User action:** Selects "2 hours" for Spot #7 priced at 0.003 ETH/hour.

**What happens technically:**
- Frontend calls `WiFiRegistry.getSpotPrice(7)` to get the exact on-chain price
- Calculates: `totalCost = 0.003 × 2 = 0.006 ETH`
- Displays breakdown: "Total: 0.006 ETH + gas"
- User clicks "Confirm & Pay"

---

### STEP 6 — Transaction Sent to Blockchain
**User action:** Reviews the MetaMask popup and clicks "Confirm."

**What happens technically:**
```
ethers.js builds the transaction:
    Contract: AccessManager address
    Function: purchaseAccess(7, 2, 0)
    Value: 0.006 ETH
    Gas limit: estimated automatically
    ↓
ethers.js sends to MetaMask for signing
    ↓
MetaMask shows popup:
    "You are sending 0.006 ETH + 0.0001 ETH gas to AccessManager"
    ↓
User confirms → MetaMask signs with user's private key
    ↓
Transaction broadcast to Ethereum network
    ↓
Network validators verify and include it in a block (takes ~15 seconds on Ethereum)
    ↓
Transaction confirmed → receipt returned to frontend
```

---

### STEP 7 — Smart Contract Executes (All-or-Nothing)
**On the blockchain, AccessManager executes:**

```
1. Validates: Spot 7 is active ✅
2. Validates: Spot 7 has capacity (2/5 users) ✅
3. Validates: msg.value == pricePerHour × 2 hours ✅
4. Mints NFT (tokenId = 42) → sent to user's wallet
5. Locks 0.006 ETH in PaymentEscrow
6. Increments Spot 7's user count: 2 → 3
7. Creates Session record: tokenId 42, Spot 7, Active
8. Emits event: AccessPurchased(tokenId=42, spotId=7, user=0xABC..., amount=0.006ETH)
```

All 8 steps succeed atomically. The user now owns NFT #42 in their MetaMask.

---

### STEP 8 — Frontend Records Booking (Off-Chain)
**What happens technically:**
- Frontend listens for the `AccessPurchased` event
- Extracts `tokenId = 42` and `txHash = 0x8f3a...`
- Calls `POST /api/bookings` with `{txHash, tokenId, spotId, durationHours}`
- Backend stores the booking in MongoDB with blockchain references
- Backend generates an `accessToken` (random string) for the captive portal
- User sees: "Booking confirmed! Token: A7B9C2D5"

---

### STEP 9 — User Connects to Owner's WiFi Network
**User action:** Finds the owner's WiFi on their device (e.g., "Airlink-Spot-7") and connects.

**What happens technically:**
- Phone connects to the owner's WiFi — initially without internet access
- All HTTP traffic is intercepted by the gateway's DNS redirect
- User gets redirected to `http://192.168.x.x:8080/portal` — the captive portal page

---

### STEP 10 — Captive Portal Verification
**User action:** Opens the captive portal and enters their access token.

**What happens technically:**
```
User enters accessToken: "A7B9C2D5"
    ↓
Portal sends to backend: POST /api/captive/activate {token, tokenId, walletAddress}
    ↓
Backend calls (FREE view call — no gas): AccessManager.verifyAccess(42, 0xABC...)
    ↓
Blockchain returns: {valid: true, spotId: 7, expiresAt: 1741600000}
    ↓
Backend confirms the token matches MongoDB record
    ↓
Backend calls gateway.js: "Allow this device's MAC address"
    ↓
Gateway adds Windows Firewall rule granting internet access
    ↓
User's device has internet! 🎉
```

---

### STEP 11 — Session Completes
**Option A: Session expires naturally**
```
block.timestamp > session.endTime
    ↓
Anyone calls: AccessManager.completeSession(42)
    ↓
PaymentEscrow.release(42):
    98% (0.00588 ETH) → sent to WiFi owner's wallet
    2% (0.00012 ETH) → credited to platformBalance
    ↓
WiFiRegistry.decrementUsers(7): 3 → 2
WiFiRegistry.addEarnings(7, 0.00588 ETH)
    ↓
AirlinkAccessNFT.revokeAccess(42): NFT marked as Revoked
    ↓
Gateway removes the firewall rule: internet access cut off
```

**Option B: User cancels early (50% through session)**
```
User calls: AccessManager.cancelSession(42)
    ↓
AccessManager calculates: timeElapsed/totalDuration = 50%, refundPercent = 50%
    ↓
PaymentEscrow.refund(42, 50%):
    50% (0.003 ETH) → back to user's wallet
    50% split at 98/2 → 0.00294 ETH to owner, 0.00006 ETH to platform
    ↓
NFT revoked, spot capacity decremented
```

---

# SECTION 7 — Security Considerations

## Smart Contract Vulnerabilities We Addressed

### 1. Reentrancy Attack ✅ Mitigated
**What it is:** A malicious contract receives ETH, then immediately calls back into the vulnerable contract to withdraw more ETH before the first transfer has been recorded.

**Famous example:** The 2016 DAO Hack — $60 million stolen.

**How we mitigate it:** OpenZeppelin's `ReentrancyGuard` is applied to every function in `PaymentEscrow` and `AccessManager` that sends ETH (`nonReentrant` modifier). This creates a mutex lock that prevents re-entry.

### 2. Integer Overflow/Underflow ✅ Mitigated
**What it is:** In old Solidity, arithmetic could "wrap around" past its maximum value. Example: `uint8(255) + 1 = 0`.

**How we mitigate it:** We use Solidity `^0.8.28`. Since Solidity 0.8.0, overflow/underflow cause automatic reverts (not silent wrapping). No additional SafeMath library needed.

### 3. Access Control ✅ Enforced
**What it is:** Unauthorized callers invoking privileged functions.

**How we mitigate it:**
- `onlyOwner` (Ownable): only the deployer can call admin functions
- `onlyManager`: only `AccessManager` can mint/revoke NFTs, deposit/release escrow, or update user counts
- `onlySpotOwner`: only the spot owner can modify their spot

### 4. Incorrect ETH Amount ✅ Validated
**What it is:** Users sending too much or too little ETH.

**How we mitigate it:** `require(msg.value == totalCost, "Incorrect payment amount")` — exact match required. Any overpayment reverts the transaction (no funds locked).

### 5. Zero Address ✅ Checked
**What it is:** Accidentally setting a contract reference to the null address (0x000...000), which would burn funds.

**How we mitigate it:** `require(_registry != address(0) && ...)` in the `AccessManager` constructor.

### 6. Front-Running ⚠️ Partially Addressed
**What it is:** Miners (or bots) see a pending transaction and insert their own transaction before it, exploiting the known future state.

**Impact on Airlink:** Low severity. WiFi spot prices are fixed per spot — there's nothing to front-run. A potential attack would be someone racing to buy capacity, but the harm is minimal.

---

## Trust Assumptions

| Assumption | Risk | Mitigation |
|---|---|---|
| MetaMask is not compromised | High — private key exposure | User education; hardware wallets for high-value accounts |
| The gateway is honest | Medium — owner could bypass gateway | Hardware attestation (future improvement) |
| The backend is honest | Medium — could record false bookings | NFTs are on-chain truth; backend records are supplementary |
| Admin admin key is safe | High — can upgrade contracts, resolve disputes | Multi-signature wallet (future improvement) |
| Ethereum network is live | Low — Ethereum has 99.9%+ uptime | Fallback to off-chain mode if RPC is unreachable |

---

## Security Improvements for Production

1. **Multi-signature admin wallet:** Admin operations (dispute resolution, fee withdrawal) should require multiple keys (e.g., 2-of-3 multisig).
2. **Time-lock on admin actions:** Add a 24-hour delay before admin changes take effect — prevents rushed malicious actions.
3. **Circuit breaker / pause mechanism:** Emergency pause function to freeze all purchases if a vulnerability is found.
4. **Formal verification:** Mathematical proofs of contract correctness (tools: Certora, Echidna).
5. **Third-party audit:** Before mainnet launch, get the contracts audited by a firm like Trail of Bits or OpenZeppelin.
6. **Hardware attestation for gateways:** Cryptographic proof that the gateway running on the owner's device is our authentic software (not tampered).

---

# SECTION 8 — Judge Questions & Answers

> These are the hardest questions a judge might ask. Study these carefully.

---

### BLOCKCHAIN & SMART CONTRACTS

**Q1: Why do you need blockchain for WiFi sharing? Couldn't a regular backend do this?**

> Yes, a backend could process payments — we did it with Razorpay in our Web2 version. But blockchain solves problems a backend cannot:
> 1. **Trust:** Users don't need to trust our company to distribute payments correctly. The 98/2 split is hardcoded in public Solidity code.
> 2. **Immutability:** Blockchain bookings and payments are permanent evidence. A database can be edited by an admin.
> 3. **Automation:** Smart contracts release payments automatically when sessions expire — no cron-job, no manual intervention.
> 4. **Global access:** Razorpay is India-only. ETH works anywhere in the world instantly.

---

**Q2: What is your smart contract architecture and why did you design it this way?**

> We use four modular contracts: `WiFiRegistry` (spot data), `AirlinkAccessNFT` (ERC-721 passes), `PaymentEscrow` (ETH custody), and `AccessManager` (orchestrator). This separation follows the Single Responsibility Principle — each contract has one job. Benefits: each contract can be individually audited, tested, and upgraded. A bug in the NFT contract doesn't affect the payment logic. Users have one clean entry point: `AccessManager`.

---

**Q3: Why ERC-721 for access passes? Why not just a database entry?**

> ERC-721 gives us: (1) Self-custody — the pass lives in the user's wallet, not our database. (2) On-chain verifiability — the gateway checks validity directly on Ethereum with no backend needed. (3) Composability — the NFT appears in MetaMask, is transferable, and could be listed on secondary markets. (4) Trustlessness — the pass cannot be revoked by us except through the smart contract rules.

---

**Q4: What happens if the blockchain goes down? Does the platform stop working?**

> Ethereum has had near-perfect uptime since 2015. If RPC connectivity is temporarily unavailable, new bookings would fail — but: (1) existing active sessions continue to work because the gateway cached the session data. (2) The backend and discovery still work (they don't need blockchain for search). (3) We could add an RPC fallback to multiple providers (Infura, Alchemy, Ankr) for redundancy.

---

**Q5: What is a reentrancy attack and how did you prevent it?**

> A reentrancy attack is when a malicious smart contract, upon receiving ETH, immediately calls back into the paying contract to withdraw more funds before the first transaction has updated its state. The famous 2016 DAO Hack used this to steal $60 million. We prevent it by using OpenZeppelin's `ReentrancyGuard` on every ETH-transferring function in `PaymentEscrow` and `AccessManager`. The `nonReentrant` modifier creates a mutex lock — if a function is already executing, any re-entry attempt automatically reverts.

---

**Q6: Can you walk me through what happens on-chain when a user buys WiFi access?**

> The user calls `AccessManager.purchaseAccess(spotId, durationHours)` with the exact ETH amount. In one atomic transaction: (1) AccessManager validates spot is active and has capacity. (2) `AirlinkAccessNFT.mintAccess()` is called — an ERC-721 token is created and sent to the user's wallet. (3) `PaymentEscrow.deposit()` is called — ETH is locked. (4) `WiFiRegistry.incrementUsers()` updates the live user count. (5) A Session struct is recorded. All five steps happen atomically — if any fails, the whole transaction reverts and no money is lost.

---

**Q7: How does your smart contract handle a scenario where a user loses access to their wallet?**

> In the current design, the access pass NFT is tied to the wallet address. If a user loses their private key, they lose access to the NFT. Mitigations: (1) The backend session record is also linked by email/JWT — the captive portal could fall back to backend verification for the session duration. (2) Future improvement: a social recovery mechanism (like Gnosis Safe) that allows trusted contacts to recover wallet access. (3) We could add a `transferAccess()` function that allows the original buyer to move the pass to a new address within a time window.

---

**Q8: What are the gas costs? Is that a problem for users?**

> On a Hardhat local network, gas fees are negligible. On Ethereum mainnet, a `purchaseAccess` transaction might cost $2–5 in gas — fine for a multi-hour WiFi session. For the Indian market, we'd deploy on Polygon (an Ethereum Layer 2) where gas costs are under $0.001 per transaction. Our current deployment on Sepolia testnet is free. We've architected the contracts to be gas-efficient: view functions (like `verifyAccess`) cost zero gas since they don't modify state.

---

**Q9: Can the platform owner steal user funds?**

> No, by design. The `PaymentEscrow` contract only allows the platform owner to call `withdrawPlatformFees()` — which only withdraws the accumulated 2% platform fees. The `release()` function (which sends 98% to the owner) can only be triggered by `AccessManager`, which only calls it when a session legitimately completes. The `refund()` function (which returns user ETH) is controlled by AccessManager's cancellation logic. There is no "drain all funds" admin function.

---

**Q10: What happens if the WiFi owner's internet goes down during a session?**

> From the blockchain perspective: (1) The session remains Active until explicitly completed or the `endTime` passes. (2) The user can call `cancelSession()` to get a proportional refund for remaining time. (3) The smart contract can't know if physical internet is working — that's an off-chain reality. Future improvement: the gateway health monitor (pinging every 30 seconds) could detect outages and automatically trigger a cancellation on behalf of the user.

---

### ARCHITECTURE & DESIGN

**Q11: Why do you still have a backend? Isn't that centralized?**

> A fully on-chain system would be ideal but impractical for several reasons: (1) Storing images, map data, and large metadata on Ethereum is prohibitively expensive. (2) Real-time connectivity monitoring (health pings) cannot be done on-chain — Ethereum can't make HTTP requests. (3) The captive portal must run locally on the owner's device. We use a hybrid model: blockchain for what benefits from decentralization (payments, ownership, access rights), and traditional infrastructure for what benefits from speed and cost efficiency (metadata, search, monitoring).

---

**Q12: How does the gateway verify access without calling a backend?**

> The gateway calls `AccessManager.verifyAccess(tokenId, userAddress)` directly on the Ethereum node. This is a **view function** — it reads blockchain state without modifying it, so it costs zero gas. The gateway gets back: `(valid: bool, spotId: uint256, expiresAt: uint256)`. No backend involved. This is the key decentralization advantage — even if our entire AWS infrastructure went down, gateways could still verify and grant access.

---

**Q13: How do you prevent someone from sharing their NFT access pass with multiple devices?**

> The NFT is one-of-a-kind and tied to one wallet address. However, one person could share access across their own devices by giving out their access token (from the captive portal). Mitigations: (1) Gateway tracks MAC addresses per session — only the device that activated the portal gets internet. (2) Bandwidth throttling per session. (3) Future: multi-device session management where a single NFT allows N concurrent devices (the `maxUsers` concept applied per-booking rather than per-spot).

---

**Q14: Why use a locationHash instead of actual GPS coordinates?**

> For privacy. GPS coordinates stored forever on an immutable public blockchain could expose the exact home address of a WiFi owner. A geohash (a short code like "ttnnp") reveals the general area (within ~600m) without pinpointing the home. Exact coordinates are stored off-chain in MongoDB with appropriate access controls. This is a deliberate privacy-by-design decision.

---

**Q15: What is IPFS and why do you use it for metadata?**

> IPFS (InterPlanetary File System) is a decentralized file storage network. Instead of storing images in a centralized cloud (which could go down or be censored), we upload to IPFS and store the resulting content hash on-chain. The `metadataURI` field in `WiFiRegistry.WifiSpot` is an IPFS URI. The content is addressed by its hash — if the content changes, the hash changes, so you always get exactly what was promised.

---

### BUSINESS & SCALABILITY

**Q16: What's your business model and how does the 2% fee sustain you?**

> At early stage, 2% on micro-transactions seems small. But at scale: if Airlink processes 100,000 bookings/day at an average of ₹100/booking, that's ₹200,000/day (₹73M/year). The fee is hardcoded in the contract, automatically collected, and withdrawn by us. Additional revenue: premium spot listings (pay to rank higher), enterprise plans (co-working spaces managing bulk bookings), and data analytics subscriptions for owners. The hardware gateway creates a recurring relationship with owners — distribution of branded hardware is another revenue path.

---

**Q17: How does Airlink scale to millions of users?**

> Smart contracts don't "scale" in the traditional sense — the Ethereum network validates every transaction globally. For high-volume scenarios: (1) **Layer 2 deployment:** Move contracts to Polygon or Arbitrum — same code, 1000x cheaper gas, 2-second finality. (2) **Off-chain discovery:** Spot browsing and searching use the traditional backend which scales horizontally. (3) **Batching:** Multiple small actions could be batched using EIP-4337 (Account Abstraction). (4) The modular architecture means we can upgrade individual contracts without migrating the entire system.

---

**Q18: Who are your competitors and why are you better?**

> Indirect competitors: Telecom hotspot networks (Airtel WiFi, JioFi), co-working memberships, Karma WiFi (US). No direct competitor combines: (1) A consumer marketplace for spot discovery, (2) Hardware-enforced access control (captive portal + Windows Firewall), (3) Blockchain-based trustless payments with NFT access passes. The hardware layer is our primary moat — it cannot be cloned in a weekend.

---

**Q19: What happens if your company shuts down? Do users lose their access?**

> This is blockchain's core value proposition. The smart contracts are deployed on Ethereum — they run as long as Ethereum runs, regardless of Airlink the company existing. The payment logic, access verification, and NFT records are permanent. Users could build alternative frontends. The gateway code is open-source. The only centralized component is the off-chain backend (user profiles, metadata) — we'd publish the MongoDB data to IPFS before shutting down.

---

**Q20: Can WiFi spots be traded or resold?**

> Currently, WiFi spots are registered to a wallet address — to "sell" a spot, the owner would transfer ownership of the wallet. In a future version, we could implement spot ownership NFTs (the spot itself as an ERC-721 token, not just the access passes). This would create a secondary market for WiFi spots — similar to selling an Airbnb property listing. This composability is possible only because we're using blockchain.

---

**Q21: How do you handle disputes between owners and users?**

> We have a three-stage resolution process: (1) `cancelSession()` — user-initiated, proportional automatic refund. (2) `disputeSession()` — flags the session for human review by the Airlink admin. (3) `resolveDispute(tokenId, refundPercent)` — admin calls this with a 0–100% refund decision, and the smart contract executes the split automatically. Evidence (health logs, connectivity data) is stored in MongoDB and presented to both parties. Future improvement: a DAO-based dispute resolution where token holders vote on outcomes.

---

**Q22: Is your system KYC-compliant? Can it be used for money laundering?**

> All transactions are permanently recorded on the public Ethereum blockchain with wallet addresses — more transparent than cash. The backend requires email registration (a basic identity anchor). For regulatory compliance in India, we'd submit to the RBI's regulations on VDA (Virtual Digital Asset) payments. KYC can be added at the account level without changing the smart contracts. The 2% fee collection creates a clear regulatory footprint. Compared to cash-based WiFi access (hotels, internet cafés), blockchain is actually more auditable.

---

**Q23: Why Ethereum specifically? Why not Solana or Binance Smart Chain?**

> Ethereum is the most battle-tested, audited, and widely supported EVM platform with the largest developer ecosystem. Our entire smart contract stack is EVM-compatible — moving to Polygon, Arbitrum, or BSC requires zero code changes (just re-deploy). We chose Ethereum (Sepolia testnet) for the hackathon because: (1) MetaMask works out of the box. (2) OpenZeppelin libraries are Ethereum-native. (3) Hardhat targets EVM. (4) Largest community support for hackathon demos.

---

**Q24: What happens if a user sends more ETH than required to purchaseAccess?**

> The smart contract has: `require(msg.value == totalCost, "Incorrect payment amount")`. If the user sends even 1 wei more than the exact price, the transaction reverts automatically. All ETH is returned to the user. No overpayment is possible. This is a deliberate exact-match design — it prevents accidental overpayment and makes pricing completely deterministic.

---

**Q25: How do you handle ETH price volatility? If ETH crashes, owners get less money.**

> This is a real concern for production. Our current design uses ETH-denominated prices. For production, the solution is a stablecoin integration (USDC, USDT, DAI) — WiFi prices would be denominated in USD, and the smart contract would accept stablecoins. This requires integrating a Chainlink price oracle (to convert between stablecoins and ETH for gas calculations). For the hackathon scope, ETH pricing demonstrates the concept. Stablecoin support is a clear V2 feature.

---

**Q26: How are your 58 smart contract tests organized?**

> Our test suite covers: (1) Spot registration and validation (price limits, capacity limits, owner-only updates). (2) Access purchase (atomic minting + escrow), (3) Proportional cancellation refunds at different time points, (4) Session completion and escrow release, (5) Gateway verification with valid and expired tokens, (6) Dispute resolution flows, (7) Platform fee accumulation and withdrawal, (8) Edge cases: duplicate deposits, zero-address attacks, buying your own spot. 58 passing tests cover the happy path and all major failure modes.

---

**Q27: What is the difference between your v1 contract (AirlinkMarketplace.sol) and the v2 architecture?**

> The v1 `AirlinkMarketplace.sol` is a single 600+ line contract with all logic combined. Problems: (1) No NFT standard — access tokens were just keccak256 hashes stored on-chain, visible only to our backend. (2) No reentrancy guard. (3) Flat 50% cancellation refund regardless of timing. (4) Razorpay still handling centralized payments. V2 splits this into 4 focused contracts, replaces hash tokens with ERC-721 NFTs, adds proportional refunds, adds ReentrancyGuard everywhere, and completely removes Razorpay.

---

# SECTION 9 — Business & Innovation

## Why Blockchain Makes Sense for This Product

Most blockchain projects add blockchain because it's trendy, not because it solves a specific problem. Airlink is different — the blockchain integration directly addresses core product problems:

| Product Problem | Blockchain Solution |
|---|---|
| Users don't trust the platform to split revenue honestly | Revenue split is hardcoded in public contract code — anyone can audit |
| How do you prove you paid if a dispute arises? | Transaction hash is permanent blockchain evidence |
| How can access be verified without our backend? | Gateway reads blockchain state directly — no server needed |
| How do you make payments work globally (not just India)? | ETH works in 195 countries, no bank account required |
| How do you represent time-limited access rights as a portable asset? | NFT in user's own wallet — verifiable by any Ethereum app |

---

## Why This Solution is Innovative

**1. NFT Access Passes**
Nobody in the WiFi marketplace industry represents session access as an on-chain NFT. This enables a completely new category of composability:
- Access passes could be delegated, gifted, or resold on secondary markets
- Future: NFT staking for loyalty rewards
- Future: DeFi integration — use access NFTs as collateral

**2. Trustless Gateway Verification**
Traditional hotspot gateways (like those from Cisco or Meraki) use central servers for authentication. Airlink's gateway reads directly from the blockchain — completely serverless verification.

**3. Hardware + Blockchain Convergence**
The combination of blockchain-based access rights with hardware-enforced network control is unprecedented at this scale. It creates a defensible business model: the hardware moat prevents cheap software clones.

**4. Open Revenue Split**
The 98/2 split visible in public smart contract code is a trust signal. The owner doesn't need to hope for honest accounting — the math is transparent before they list their first spot.

---

## What Makes It Better Than Traditional Solutions

| Traditional Model | Airlink |
|---|---|
| Central company holds all money | Smart contract holds money in escrow |
| Revenue split is a promise | Revenue split is code |
| Payment processor decides who gets paid | Payment happens automatically when session ends |
| Access via shared password | Access via unique NFT backed by smart contract |
| Disputes resolved by the platform (conflict of interest) | Disputes resolved via transparent on-chain logic |
| Only works in supported countries | Works globally — wherever Ethereum is accessible |

---

# SECTION 10 — 30-Second Pitch

> Use this when a judge asks: "So what does your project do?"

---

**THE PITCH:**

> "Airlink is a decentralized WiFi marketplace — Airbnb for internet access.
>
> The problem: millions of people need affordable WiFi, while millions of home and office broadband connections sit at 20% utilization. Nobody connects these two groups.
>
> Our solution: WiFi owners list their hotspots on Airlink, set a price per hour, and earn passive income. Users discover nearby spots, pay in ETH via a smart contract, and receive an NFT access pass in their wallet.
>
> What makes it unique: the payment and access system is entirely on-chain. A smart contract automatically locks the payment, mints the NFT, and releases funds — 98% to the owner, 2% to us — when the session ends. No middleman. No trust required. The code is the contract.
>
> And critically: access is enforced at the hardware level via a captive portal running on the owner's device. When the session expires, internet cuts off automatically — at the network level.
>
> We're not just an app. We're software plus physical infrastructure, backed by blockchain — and that combination cannot be copied overnight."

---

# SECTION 11 — Technical Deep Dive

> These are the advanced technical concepts that will make you sound truly confident.

---

## 1. Atomic Transactions and Why They Matter

In Solidity, a function call is either 100% successful or 100% reverted — there is no in-between state. This is called **atomicity**.

When `purchaseAccess()` executes, it:
1. Calls `AirlinkAccessNFT.mintAccess()`
2. Calls `PaymentEscrow.deposit()` with ETH
3. Calls `WiFiRegistry.incrementUsers()`
4. Creates a Session struct

If step 3 fails (e.g., spot is now at capacity from a concurrent transaction), everything reverts:
- The NFT mint is undone
- The ETH deposit is undone
- The user gets all their ETH back

This is only possible on blockchain — in a traditional backend, you'd need complex database transactions with rollback logic.

---

## 2. The `msg.value` and `payable` Pattern

In Solidity, ETH is transferred to a function using the `payable` keyword. The `msg.value` variable holds the ETH amount sent with the transaction.

```solidity
function purchaseAccess(
    uint256 _spotId,
    uint256 _durationHours,
    uint256 _startTime
) external payable nonReentrant returns (uint256 tokenId) {
    require(msg.value == totalCost, "Incorrect payment amount");
    escrow.deposit{value: msg.value}(tokenId, msg.sender, spotOwner, fee);
```

The `{value: msg.value}` syntax in the escrow call forwards the ETH from `AccessManager` to `PaymentEscrow`. This is how ETH flows between contracts. The `payable` modifier on an address allows it to receive ETH programmatically.

---

## 3. Events and Indexing

Smart contract `events` are log entries written to the blockchain that are cheaper than stored variables. They're used for:
- Frontend notification (ethers.js can listen for events)
- Off-chain indexing (The Graph protocol indexes events into queryable databases)
- Transaction receipts

```solidity
event AccessPurchased(
    uint256 indexed tokenId,
    uint256 indexed spotId,
    address indexed user,
    uint256 totalPaid,
    uint256 startTime,
    uint256 endTime
);
```

The `indexed` keyword makes those fields searchable (filterable) in event logs. In Airlink, the frontend listens for the `AccessPurchased` event to extract the `tokenId` after a purchase — you can't know the tokenId before the transaction executes, because it's assigned by the contract.

---

## 4. Block Timestamp and Time-Based Logic

`block.timestamp` is the Unix timestamp of the block that contains a transaction. It's the only way smart contracts know what time it is — there's no `Date.now()` in Solidity.

```solidity
uint256 start = _startTime == 0 ? block.timestamp : _startTime;
uint256 end = start + (_durationHours * 1 hours);
```

`1 hours` is a Solidity time unit equal to `3600` (seconds). So a 2-hour session: `end = start + 7200`.

**Miner manipulation risk:** Miners can slightly manipulate `block.timestamp` (within ~15 seconds). For WiFi sessions measured in hours, this is irrelevant. But for financial systems with second-level precision, this could be an issue.

---

## 5. The Basis Points (BPS) Pattern

Instead of percentages (which would require floating-point math — unavailable in Solidity), smart contracts use **basis points**:

```
1 basis point = 0.01%
100 bps = 1%
200 bps = 2%
10,000 bps = 100%
```

Fee calculation:
```solidity
uint256 public constant PLATFORM_FEE_BPS = 200;   // 2%
uint256 public constant BPS_DENOMINATOR  = 10_000;

uint256 fee = (totalCost * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
// = (0.01 ETH * 200) / 10000 = 0.0002 ETH
```

Integer division is used — Solidity truncates (rounds down), which is safe for fee calculations.

---

## 6. Modular Contract Architecture (Why It Matters)

The v2 architecture follows the principle that contracts should have single responsibilities. This matters for:

**Upgradeability:** If we need to change how NFT metadata is rendered (e.g., add the spot name to the SVG), we can deploy a new `AirlinkAccessNFT` and update the `AccessManager` to point to it — without touching payment logic.

**Auditability:** An auditor can focus entirely on `PaymentEscrow.sol` knowing it has one job (hold and release ETH) and one authorized caller (`AccessManager`).

**Testing surface:** Each contract's test file has a clear scope. Edge cases are isolated.

---

## 7. On-Chain SVG Metadata Generation

The `AirlinkAccessNFT.tokenURI()` function generates NFT visual cards entirely on the blockchain using SVG (Scalable Vector Graphics):

```solidity
string memory svg = string(abi.encodePacked(
    '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">',
    '<rect width="350" height="350" rx="20" fill="#0a0a1a"/>',
    '<text x="175" y="60" fill="#66FF00">AIRLINK WiFi PASS</text>',
    '<text x="175" y="120" fill="#fff">#', tokenId.toString(), '</text>',
    ...
));
```

The SVG is base64-encoded and returned as a `data:` URI. MetaMask and OpenSea use `tokenURI()` to render the NFT — no external server, no IPFS, no CDN. Even if Airlink goes down, every NFT remains visible forever.

`abi.encodePacked` is Solidity's gas-efficient string concatenation. `Base64.encode(bytes(svg))` converts binary data to ASCII for embedding in JSON.

---

## 8. The Keeper Pattern (Trustless Finalization)

In v1 of Airlink, sessions could only be completed by the user, owner, or admin. If nobody called `completeSession()`, funds would be locked in escrow forever.

V2 adds a keeper condition:
```solidity
block.timestamp > session.endTime
```

When this is true, **any address can call `completeSession()`**. This is the "keeper pattern" — external bots or users are incentivized (or simply civic-minded) to finalize stale transactions. Major DeFi protocols (MakerDAO, Aave) use keepers for liquidations and vault management. It ensures the system runs without depending on any specific party.

---

## 9. ethers.js v6 — How the Frontend Talks to the Blockchain

ethers.js is the JavaScript library that connects web browsers to Ethereum. The key objects:

```javascript
// Create a provider (reads blockchain state)
const provider = new ethers.BrowserProvider(window.ethereum);

// Create a signer (can sign transactions using MetaMask)
const signer = await provider.getSigner();

// Attach to the deployed smart contract
const accessManager = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
);

// Call a state-changing function (costs gas, requires MetaMask)
const tx = await accessManager.purchaseAccess(spotId, hours, startTime, {
    value: ethers.parseEther("0.006")  // Convert ETH to wei
});

// Wait for it to be mined
const receipt = await tx.wait();

// Parse events from the receipt
const event = receipt.logs.find(log => log.fragment?.name === 'AccessPurchased');
const tokenId = event.args.tokenId;
```

**ABI (Application Binary Interface):** The ABI is the JSON description of a contract's functions and events. ethers.js uses it to encode/decode function calls into the binary format the EVM understands. The ABI is generated by the Hardhat compiler from the Solidity source.

---

## 10. Hardhat — The Smart Contract Development Environment

Hardhat is the development framework used to build, test, and deploy the Airlink contracts. Key features used:

- **Compilation:** Converts `.sol` Solidity files into EVM bytecode and ABI JSON
- **Local blockchain:** `npx hardhat node` spins up a local Ethereum network on `localhost:8545` with 20 pre-funded accounts — instant transactions, no gas costs
- **Testing:** Runs the 58 test cases against the local blockchain using Mocha/Chai + ethers.js
- **Deployment scripts:** `deploy-with-env.ts` deploys all 4 contracts in the right order and auto-updates `.env` files with the deployed addresses
- **TypeChain:** Automatically generates TypeScript types from the ABI — type-safe contract interactions with IDE autocomplete

---

## Summary: What Makes This Project Technically Impressive

| Feature | Technical Achievement |
|---|---|
| 4 modular smart contracts | Clean separation of concerns, individually auditable |
| ERC-721 access NFTs with on-chain SVG metadata | Fully self-contained, renders in wallets forever |
| Proportional cancellation refunds | Time-based on-chain math, not user promises |
| Keeper pattern for trustless finalization | No funds ever locked indefinitely |
| ReentrancyGuard on all ETH paths | Battle-tested OpenZeppelin protection |
| Direct gateway-to-blockchain verification | No backend dependency for access control |
| Hybrid architecture | Blockchain where it counts, off-chain where it's practical |
| 58 passing tests | Complete coverage of happy path and failure modes |
| On-chain / off-chain data split | Gas-efficient, privacy-preserving design |
| ethers.js v6 integration | Modern, type-safe frontend-blockchain bridge |

---

*Guide compiled for Team QuadCoders — Yash, Samiksha, Vaidehi, and Spandan.*

*Airlink: "The internet is everywhere. Access to it shouldn't be a privilege."*
