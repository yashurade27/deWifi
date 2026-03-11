# Airlink — Judge Preparation Master Guide
### Why Web3 Wins, Why Ethereum, and Every Hard Question Answered

> **For Team QuadCoders** — Yash, Samiksha, Vaidehi, Spandan.
> This document is your complete answer guide. Every section is grounded in your actual codebase.

---

## Table of Contents

1. [Why Web3 is the Only Right Approach for This Problem](#1-why-web3-is-the-only-right-approach-for-this-problem)
2. [Why Ethereum is the Best Blockchain for Airlink](#2-why-ethereum-is-the-best-blockchain-for-airlink)
3. [Critical Judge Questions — With Full Answers](#3-critical-judge-questions--with-full-answers)

---

# 1. Why Web3 is the Only Right Approach for This Problem

## The Core Problem Airlink Solves Demands Trustlessness

Airlink is fundamentally a **two-sided marketplace between strangers**.

A homeowner in Pune shares their WiFi password (essentially, their network) with a stranger. A stranger sends money to someone they've never met. Neither party knows or trusts the other. And in the middle, a startup called Airlink controls all the money flow.

This is precisely the scenario where Web2 architectures fail, and Web3 architectures succeed.

---

## Where Web2 Breaks Down, Specifically for Airlink

### Problem 1: The Owner Must Blindly Trust Airlink With Their Earnings

In the Web2 version (Razorpay + MongoDB backend), this is the payment flow:

```
User pays ₹100 via Razorpay
        ↓
Razorpay confirms payment to Airlink backend
        ↓
Airlink backend stores ₹98 as "ownerEarnings" in MongoDB
        ↓
Owner must log into the dashboard and TRUST the number is correct
        ↓
Owner manually requests a payout
        ↓
Airlink manually processes it via bank transfer
```

**The problem:** The owner has zero cryptographic proof that the ₹98 figure is correct. Airlink could display ₹98 in the dashboard but only actually pay ₹70. The owner has no way to audit the on-chain state — because there is no on-chain state.

**The Web3 fix:** The 98/2 split is not a number in a database. It is a constant burned into Solidity bytecode:
```solidity
uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
```
The moment a session completes, the smart contract atomically sends 98% to the owner's withdrawable balance. Airlink's backend cannot intercept, alter, or delay this. The owner can verify every wei on Etherscan.

---

### Problem 2: A Central Backend is a Single Point of Complete Failure

In Web2, if the Airlink backend server goes down:
- **New bookings are impossible** — no backend = no Razorpay order creation
- **Active sessions can't verify** — the gateway polls the backend; if it's offline, it can't confirm the session
- **Owner payouts are frozen** — humans must manually process them after the server recovers

For a marketplace promising "passive income" and "reliable access" — a backend outage is catastrophic. Users who paid cannot access the internet. Owners who earned money cannot claim it.

**The Web3 fix:** Smart contracts don't have downtime. The Ethereum network has had effectively 100% uptime since 2015. Even if the Airlink backend goes down entirely:
- **New bookings still work** — `AccessManager.purchaseAccess()` is a direct on-chain call
- **Gateway verification works** — it reads the NFT state directly on-chain, no backend required
- **Owner earnings are safe** — they call `withdrawEarnings()` directly on the contract

---

### Problem 3: Razorpay is Geographically Imprisoned

Razorpay works in India. That's it.

A Japanese tourist trying to buy WiFi from an Indian homeowner? They can't use Razorpay. Their card might not support INR. Their bank might block the transaction.

**The Web3 fix:** ETH doesn't care about borders. Anyone with a MetaMask wallet anywhere in the world can call `purchaseAccess()`. No bank account. No card. No currency conversion. No geofencing. The transaction settles in seconds regardless of whether the buyer is in Mumbai or Munich.

---

### Problem 4: Dispute Resolution in Web2 is "Trust Us"

In Web2, when a user says "I paid but the WiFi didn't work," the resolution is:
- User emails Airlink support
- Airlink looks at their database
- Airlink decides who's right
- Airlink transfers money manually

The owner has no recourse if Airlink rules against them unfairly. The user has no proof of what they actually paid. Both parties must trust Airlink to be honest arbitrators of their own platform.

**The Web3 fix:** Every booking is `BookingCreated` event on Ethereum. Every payment is a transaction hash. Neither party can claim "I didn't pay" or "they didn't pay" when the entire payment history is permanently on a public ledger. The dispute mechanism (`disputeSession()` / `resolveDispute()`) is transparent: the admin sets a `refundPercent` and the contract executes it atomically — no manual bank transfers, no "our system shows..." excuses.

---

### Problem 5: Web2 Access Passes Are Forgeable

In the original Web2 system, the access token is a `keccak256` hash stored in MongoDB. The gateway validates it by querying the backend. This means:
- A compromised Airlink database = attackers can generate valid access tokens
- A compromised backend admin account = anyone can grant WiFi access
- A man-in-the-middle attack on the gateway-to-backend connection = access control bypass

**The Web3 fix:** The access pass is an **ERC-721 NFT on Ethereum**. The gateway verifies it by calling `AccessManager.verifyAccess(spotId, userAddress)` — a free view call directly to the blockchain. To forge this, you would need to break the cryptographic security of Ethereum itself. There is no database to compromise, no admin account to phish, no backend to intercept.

---

### Problem 6: Web2 Revenue Transparency is Fake

The BLOCKCHAIN_ARCHITECTURE.md documents the Web2 promise: "98% to owners, 2% platform fee."

But where is this enforced in Web2? It's a line of JavaScript in a backend route handler:
```javascript
const platformFee = subtotal * 0.02;
const ownerEarnings = subtotal * 0.98;
```

Airlink can change this number any day. Owners would never know. It is a private calculation in a private database on a private server.

**The Web3 fix:** The split is a public constant in a deployed smart contract. Any person, anywhere, can go to Etherscan, click "Read Contract" on the `PaymentEscrow` contract, and verify that `PLATFORM_FEE_BPS = 200`. Airlink cannot change this after deployment without everyone seeing a new deployment. The fee structure is not a promise — it is a law.

---

## Summary: Why Web3 is Not Optional Here

| Requirement | Can Web2 Satisfy It? | How Web3 Satisfies It |
|---|---|---|
| Strangers transacting without trusting each other | ❌ Still requires trusting Airlink | ✅ Smart contract enforces rules — trust the code |
| Global payments without banking infrastructure | ❌ Razorpay is India-only, requires bank | ✅ ETH works globally, just need a wallet |
| 98/2 split that owners can independently verify | ❌ Opaque backend calculation | ✅ `PLATFORM_FEE_BPS = 200` is publicly readable on-chain |
| Access tokens that can't be forged | ❌ Database compromise = fake tokens | ✅ ERC-721 on Ethereum — cryptographically unforgeable |
| Payment system that works even if Airlink server dies | ❌ No backend = no bookings, no payouts | ✅ Contracts never go down |
| Immutable proof of every transaction | ❌ Airlink can edit MongoDB records | ✅ Blockchain records are permanent and tamper-proof |
| Dispute resolution with auditable evidence | ❌ "Trust our support team" | ✅ Every payment is a transaction hash on Etherscan |

**The bottom line:** Airlink is a trust marketplace. The entire value proposition collapses if the two strangers transacting must trust a third party (Airlink) instead of trustless math. Web3 is not an "upgrade" here — it is the foundational requirement.

---

# 2. Why Ethereum is the Best Blockchain for Airlink

There are many blockchains. The choice of Ethereum is deliberate, not default. Here is the case for it.

---

## Reason 1: EVM is the Standard — and Hardhat Supports It Perfectly

Our contracts are written in Solidity targeting the EVM (Ethereum Virtual Machine). The EVM is not exclusive to Ethereum mainnet — it runs on Sepolia testnet (used for our demo), Polygon, Arbitrum, Optimism, and dozens more.

This means:
- We write contracts once in Solidity
- We can deploy to mainnet when budgets allow
- We can migrate to L2s (Arbitrum/Optimism) for lower fees with zero contract rewrites
- The entire OpenZeppelin v5 library is built for the EVM — we get battle-tested security modules out of the box

**Bitcoin, Solana, Cardano cannot offer this.** Bitcoin has no smart contract capability for this level of complexity. Solana uses Rust (different language, different ecosystem, no OpenZeppelin equivalent). Cardano's smart contract ecosystem is far less mature.

---

## Reason 2: ERC-721 is the Perfect Standard for Our Access Passes

Our access passes are ERC-721 NFTs. This is not gimmickry — it is the right data model.

Each WiFi session is **inherently unique**: different spot, different time window, different user, different duration. ERC-721 was designed exactly for unique, non-interchangeable assets.

Using ERC-721 means:
- **Automatic wallet visibility** — Users can see their active access passes in MetaMask, no custom UI needed
- **On-chain verification** — `ownerOf(tokenId)` is a standard call that the gateway uses to verify access
- **Composability** — Future possibilities: users can trade access passes, insurance protocols can read them, analytics tools can index them — all without Airlink's permission
- **Permanent receipt** — When a session ends, the NFT is marked revoked (not burned). It serves as a permanent, irrefutable proof that this user had WiFi access at this location on this date

**Why not ERC-20?** ERC-20 tokens are fungible (1 token = 1 token). You can't tell apart two ERC-20 tokens — they're identical. WiFi sessions are never identical.

**Why not ERC-1155?** ERC-1155 supports semi-fungible batches. Perfect for gaming items where 1,000 identical swords exist. Overkill for single-session passes that are all unique.

---

## Reason 3: OpenZeppelin v5 — The Security Foundation We Can't Build Alone

A hackathon team of four cannot independently audit smart contract security. But with Ethereum, we don't need to.

We import directly from OpenZeppelin v5.1.0:
- **`ERC721`** — the complete, audited NFT implementation with no known vulnerabilities
- **`Ownable`** — Admin function protection, thoroughly tested
- **`ReentrancyGuard`** — Protects every ETH transfer from reentrancy attacks (the $60M DAO hack vulnerability)

OpenZeppelin's contracts have been audited by the best security firms in the industry and secure billions of dollars in production. This ecosystem does not exist at this quality level for Solana, Cardano, or Cosmos.

---

## Reason 4: Hardhat — The Developer Toolchain That Made This Possible

Our `blockchain/` directory uses Hardhat, the most mature Ethereum development framework. In our 58-test suite alone, Hardhat provides:

- **Local Ethereum node** (`npx hardhat node`) — runs a full EVM locally for instant, free testing
- **TypeChain** — auto-generates TypeScript types from our ABIs, so `contracts.ts` in the frontend is fully type-safe
- **Deploy scripts** — `scripts/deploy.ts` deploys all 4 contracts and links them in one command
- **Gas reporting** — shows exactly how much each function call costs, enabling optimization
- **Cancun EVM + `viaIR: true`** — latest EVM upgrades for better gas optimization

No other blockchain has tooling at this maturity level for JavaScript/TypeScript developers.

---

## Reason 5: Sepolia Testnet — A Production-Fidelity Demo Environment

For this hackathon, we demo on **Sepolia** — Ethereum's official testnet. Sepolia:
- Has identical EVM behavior to Ethereum mainnet
- Has free ETH from faucets (no demo cost)
- Has its own Etherscan (sepolia.etherscan.io) — judges can click our transaction hashes and see real on-chain data
- Supports MetaMask out of the box — no custom wallet configuration for judges

Solana's devnet, Cardano's testnets, and Polygon's testnets all require extra configuration and have less tooling support.

---

## Reason 6: MetaMask — The Zero-Friction User Onboarding

Our frontend uses MetaMask as the wallet. MetaMask has:
- **400+ million downloads** — most judges and users already have it installed
- **Native ethers.js integration** — our `contracts.ts` file uses `BrowserProvider(window.ethereum)` —  connecting a wallet is 3 lines of code
- **Sepolia support** — one-click network switching for the demo
- **NFT visibility** — users can immediately see their access pass NFT in the MetaMask "NFTs" tab

Alternative wallets like Phantom (Solana) or Yoroi (Cardano) have a fraction of this user base and require users to install something unfamiliar.

---

## Reason 7: Etherscan — Transparent Proof for Judges

When a judge asks "can you prove the payment happened?" — we open Etherscan.

Etherscan is Ethereum's public block explorer. It shows:
- Every transaction our contracts have processed
- Every ETH transfer
- Every NFT minted
- The deployed contract code (verified)
- The exact function calls and parameters

No other blockchain has an equivalent tool that is this polished and universally understood. This is our "show, don't tell" moment with judges.

---

## Blockchain Comparison Matrix

| Property | Ethereum (our choice) | Solana | Bitcoin | Cardano |
|---|---|---|---|---|
| Smart contract language | Solidity (mature, huge ecosystem) | Rust (steep learning curve) | Script (very limited) | Haskell/Plutus (academic, niche) |
| ERC-721 NFT standard | ✅ Native standard | ❌ Metaplex (non-standard) | ❌ Not supported | ⚠️ Limited support |
| OpenZeppelin security libraries | ✅ Full support | ❌ Not available | ❌ Not applicable | ❌ Not available |
| Hardhat dev tooling | ✅ Best-in-class | ❌ Anchor (less mature) | ❌ None | ❌ Limited |
| MetaMask wallet support | ✅ Primary wallet | ❌ Phantom only | ❌ Different wallets | ❌ Yoroi/Daedalus |
| Testnet + Etherscan | ✅ Sepolia + Etherscan | ⚠️ Devnet (less tooling) | ⚠️ Testnet (limited) | ⚠️ Preview (beta) |
| ethers.js browser integration | ✅ First-class support | ❌ @solana/web3.js (different) | ❌ Different | ❌ Different |
| Time to production-ready | Fastest (our team's skills) | Requires learning Rust | Not viable | Not viable |
| Industry trust / TVL | Highest ($60B+ TVL) | Growing | BTC only | Early stage |

**Verdict:** For a TypeScript-stack team building an NFT-based marketplace with a 2-day hackathon deadline, Ethereum with Hardhat + Solidity + OpenZeppelin + MetaMask is the only stack that can deliver a working, secure, demonstrable product.

---

# 3. Critical Judge Questions — With Full Answers

## CATEGORY A — Problem & Product

**Q: Why would anyone pay for WiFi when mobile data exists?**

Mobile data has dead zones. Buildings, basements, and rural areas have poor signal. In India, 4G costs ₹2.5/GB — a student downloading a 2GB project file pays ₹5 on a fixed broadband plan but ₹5 per GB on mobile. Hotel WiFi is ₹800/day for the same person. Airlink offers ₹20–30 for 30 minutes of fiber-quality internet. The user pays less. The owner earns from capacity that was being wasted anyway. There is genuine economic value on both sides.

---

**Q: Why would homeowners risk sharing their WiFi with strangers?**

They don't share their WiFi password. They don't share their router credentials. The captive portal gateway runs on their machine and sits between the buyer and their router. The buyer gets a time-limited TCP/IP session — enforced by OS-level firewall rules — to specific ports and protocols. The owner's personal devices are never exposed. When the session expires, the firewall rules are deleted. The stranger is off the network. The owner has no ongoing security exposure.

---

**Q: Can't someone just screen-record the access token and use it again?**

No. The access token is checked against an active booking window. The smart contract's NFT has an `expiresAt` timestamp. After the booking ends, `isAccessValidFor(spotId, userAddress)` returns false because the NFT is revoked on-chain. Even with the token, the captive portal gateway validates the session is within its booking window. A reused token after expiry is rejected at multiple layers.

---

**Q: What is your hardware moat exactly?**

The gateway software (`gateway/gateway.js`) runs on the WiFi owner's machine and uses OS-level firewall APIs to control internet access at the network layer. This is not a software toggle that a user can bypass — it is actual packet-level enforcement. The captive portal intercepts all unauthenticated HTTP requests via DNS redirect. An authenticated session gets a firewall rule specifically for their device MAC address with a time limit. When the session ends, the rule is deleted. This cannot be replicated by cloning a website. It requires the physical hardware running the gateway software.

---

## CATEGORY B — Technical Architecture

**Q: Why do you still have a backend if you're Web3?**

Because Web3 does not mean "no backend." It means decentralizing only what needs to be decentralized. Our backend (`backend/src/`) handles: captive portal HTTP interception (which requires a local server on the owner's physical machine), health monitoring pings (checking if routers are online every 30 seconds — doing this on-chain would cost thousands of dollars in gas daily), user profiles (email, name, photos — these don't need to be publicly on a ledger), and the map/discovery interface (spatial queries over MongoDB are faster and free). The blockchain handles what blockchain is good at: payments, access rights, and immutable records.

---

**Q: What is the on-chain vs off-chain split in your system?**

| On-Chain | Off-Chain (MongoDB / local) |
|---|---|
| ETH payments and escrow | User profiles and photos |
| ERC-721 access pass NFTs | Captive portal sessions |
| Spot registrations and ownership | Health monitoring (pings) |
| 98/2 earnings splits | Map and search functionality |
| Cancellation refund logic | Gateway firewall rules |
| Dispute resolution | Session heartbeats |

The design principle: put on-chain only what needs to be trusted. Keep everything else off-chain for speed and cost efficiency.

---

**Q: Walk me through the exact flow when a user buys WiFi access.**

1. User opens the Airlink dApp and connects MetaMask
2. They select a spot on the map and choose duration (e.g. 2 hours)
3. Frontend calls `AccessManager.purchaseAccess(spotId, durationHours)` with ETH via ethers.js
4. MetaMask pops up — user confirms the transaction
5. The smart contract validates: Is the spot active? Is capacity available? Is the ETH amount exactly `pricePerHour × durationHours`?
6. ETH is deposited into `PaymentEscrow`
7. `AirlinkAccessNFT.mintAccess()` is called — an ERC-721 token is minted to the user's wallet with `spotId`, `startTime`, and `expiresAt`
8. `WiFiRegistry` increments the spot's `currentUsers` counter
9. User physically approaches the spot and connects to the WiFi network (open network, no password)
10. Captive portal intercepts their first HTTP request and redirects to the Airlink portal page
11. Gateway (or captive portal frontend) calls `AccessManager.verifyAccess(spotId, userAddress)` — a free read call, no gas
12. The contract checks `AirlinkAccessNFT.isAccessValidFor(spotId, userAddress)` — returns true if NFT exists, isn't revoked, and hasn't expired
13. Gateway grants network access via firewall rule
14. Session continues until expiry. On `completeSession()`, ETH is released: 98% → owner's withdrawable balance, 2% → platform. NFT is marked revoked.

---

**Q: How do you handle the case where the WiFi is down but the user has already paid?**

The user can call `cancelSession()` on the `AccessManager` contract. The `PaymentEscrow` calculates a proportional refund based on how much of the session time was unused. For example, if the user paid for 2 hours and cancels after 30 minutes, they automatically receive 75% back. This calculation happens in Solidity, not in Airlink's backend — Airlink cannot manipulate it.

---

**Q: What is the AccessManager and why is it the central contract?**

AccessManager is the orchestrator contract — the single entry point for all user actions. Users never call `WiFiRegistry`, `AirlinkAccessNFT`, or `PaymentEscrow` directly. AccessManager coordinates all four contracts in one atomic transaction. This "single-entry-point" pattern means the user never has to manage cross-contract interactions themselves. It is also the only contract that has permission to call restricted functions on the other three — creating a clear security boundary.

---

**Q: What does ReentrancyGuard protect against?**

Reentrancy is the vulnerability that caused the 2016 DAO hack where $60M was stolen. Without protection, a malicious contract could call `withdrawEarnings()`, receive ETH, and — before the function finishes executing — call `withdrawEarnings()` again from inside the ETH receive hook, draining the escrow multiple times. OpenZeppelin's `ReentrancyGuard` sets a "locked" flag at the start of any ETH-transferring function and clears it only after completion. Any re-entry attempt while locked is immediately reverted. Every ETH path in our `PaymentEscrow` contract uses this guard.

---

**Q: How does the gateway verify access without calling the backend?**

The gateway makes a JSON-RPC call directly to an Ethereum node (either local Hardhat or Alchemy/Infura for production). It calls `AccessManager.verifyAccess(spotId, userAddress)` — a `view` function that costs zero gas. The function internally calls `AirlinkAccessNFT.isAccessValidFor(spotId, userAddress)`, which checks: does this address own an NFT for this spot, is it not revoked, and is `block.timestamp < expiresAt`? The gateway needs only the ABI and a node URL — no backend, no database, no Airlink server.

---

**Q: Why does the NFT not get burned when a session ends?**

Burning destroys the token forever. We mark it as "revoked" instead (a flag in the contract) because: a revoked NFT is a permanent receipt. The user has on-chain proof they had WiFi access at spot X on date Y for Z hours. This is useful for disputes, reputation systems, loyalty rewards, and tax records. If we burned it, that history is gone forever. On-chain receipts are a feature, not overhead.

---

**Q: How do your 58 tests validate the contract security?**

The test suite in `blockchain/test/AirlinkV2.test.ts` covers:
- Happy path: full session lifecycle (purchase → complete → withdraw)
- Edge cases: exact ETH amount enforcement, capacity limits, duplicate bookings
- Security: reentrancy attempts, unauthorized access to restricted functions, manipulation of refund math
- Cancellation math: proportional refund calculations at 0%, 50%, and 100% of session elapsed
- NFT lifecycle: minting, valid access before expiry, invalid after expiry or revocation
- Dispute resolution: various refund percentage scenarios

All 58 pass on every build. This is not just "it works" — it is verified behavior under adversarial conditions.

---

## CATEGORY C — Business Model & Innovation

**Q: How do you make money?**

Two ways:
1. **Transaction fee:** `PLATFORM_FEE_BPS = 200` (2%) is hardcoded in `PaymentEscrow.sol`. Every `completeSession()` call automatically deposits 2% of the ETH to the platform's withdrawable balance. This is automatic — no invoicing, no manual collection. Airlink calls `withdrawPlatformFees()` to claim accumulated revenue.
2. **Future:** Premium spot listings (boosted visibility), enterprise SLA plans for co-working spaces, and analytics subscriptions for large owners managing multiple spots.

---

**Q: What is your competitive moat?**

Three layers:
1. **Hardware:** The captive portal gateway runs on the owner's physical device and enforces access at the OS firewall level. This cannot be cloned by a competitor just building an app.
2. **Network effects:** Every new owner listing a spot makes the platform more valuable for users, and more users make it more valuable for owners. Like Airbnb, the marketplace itself becomes the moat.
3. **Smart contracts:** Our on-chain logic is publicly auditable and trustless — owners who join Airlink can verify they will always receive 98% without trusting us. This is a trust premium that purely Web2 competitors cannot match.

---

**Q: Why would owners choose Airlink over just installing a public WiFi hotspot?**

Public hotspot = zero revenue, all cost. Airlink = passive income. An owner with 200 Mbps fiber running at 20% utilization can offer 10 Mbps to buyers without affecting their own experience. If they charge ₹30/hour and get 3 bookings a day, they earn ₹2,700/month from their existing internet bill. The hardware investment is zero — they run our open-source gateway script on any machine they already own.

---

**Q: Couldn't a large company like Airtel or Jio just copy this?**

Traditional telcos are infrastructure companies. Their incentive is to monetize their own towers and plans — not to empower competitor home users to sell internet. Their regulatory frameworks (ISP licensing) make building a peer-to-peer resale marketplace legally complex. Additionally, Airlink's blockchain layer means the marketplace can run without Airlink's servers — something a corporate telco would never build because it removes their control.

---

**Q: What is your go-to-market strategy?**

Phase 1 (hackathon to MVP): Target residential societies and university campuses. Onboard 10 owners in one locality to create initial supply density. Students as first users — they are mobile-data-cost-sensitive and tech-comfortable with wallets.

Phase 2 (growth): Referral program where owners earn bonus ETH for recruiting the next owner in their building. Each new owner in a building recruits their neighbors naturally when users tell them "I just bought WiFi from your neighbor."

Phase 3 (scale): Enterprise B2B — co-working spaces and hostels manage multiple spots through a single dashboard. Volume pricing and analytics subscriptions.

---

**Q: Is this legal? Can you resell bandwidth you bought from an ISP?**

This is a valid regulatory question, and we are transparent about it. Indian ISP terms of service vary. Some residential plans prohibit commercial resale (Airtel Broadband ToS Section 5). The regulatory-safe framing is "bandwidth sharing" rather than "resale" — similar to how Airbnb's original hosts were technically subletting, which was also in legal grey areas. Our target market for Phase 1 includes commercial plans (cafés, offices) where resale is permitted. The regulatory path to residential monetization requires either ISP partnerships (preferred long-term strategy) or classification as a "hotspot sharing service" rather than an "ISP reseller." This is a known risk we are actively working to address.

---

## CATEGORY D — Web3 / Blockchain Deep Dive

**Q: What is a smart contract in simple terms?**

A smart contract is a vending machine on the internet. You put in the right amount of money (ETH), press the right button (call the right function), and you get exactly what was promised — automatically, without a cashier, without a company in the middle, and without anyone being able to change the rules after you've already put your money in.

---

**Q: Why ETH and not INR or USDC for payments?**

We chose ETH for three reasons:
1. **Native asset** — ETH is the native currency of Ethereum. Using it means no dependency on any third party (a stablecoin like USDC requires Circle's approval and contract)
2. **Global accessibility** — ETH doesn't require an Indian bank account or UPI setup. A buyer in any country can pay
3. **Simplicity for a hackathon** — ETH's price volatility is a known trade-off. In production, we would add USDC support (an ERC-20 token) for Indian users who want price stability

---

**Q: What happens if ETH price crashes and the owner's 98% is now worth less in INR?**

Acknowledged trade-off. This is why production deployment would include ETH/USDC price oracle integration (Chainlink) and let owners set prices in USDC-equivalent rather than ETH. For the hackathon prototype, the volatility risk is accepted. The escrow still correctly distributes 98% of whatever was paid — the smart contract's promise is intact regardless of fiat conversion rates.

---

**Q: How do you prevent someone from front-running a booking?**

Front-running (someone copying a pending transaction and submitting it first with higher gas) is a known MEV (Miner Extractable Value) problem. Our mitigation: `purchaseAccess()` requires the exact `msg.sender`'s wallet. Even if someone copies the transaction, it records access rights to *their* address, not the original user. The original user's wallet address is embedded in the NFT — you can't use someone else's booking. Capacity is enforced per spot — even if two people simultaneously book, only `maxUsers` can have active sessions.

---

**Q: Can Airlink rug pull — take all the money in the contracts?**

Good question about trust. Short answer: no, with one caveat.

- `PaymentEscrow` holds ETH for active sessions. Only `AccessManager` (which is linked at deploy time) can release funds from it — not the platform owner's EOA directly
- Funds are released to `ownerPendingWithdrawals[ownerAddress]` — only the spot owner can withdraw their balance by calling `withdrawEarnings()`
- The platform fee balance (`platformPendingWithdrawals`) can only be withdrawn by the platform owner address

The caveat: like all smart contract deployments, there is a privileged admin (`Ownable`). The admin can `pause()` the contract in an emergency. In production, this admin key would be moved to a multisig (Gnosis Safe) requiring 3-of-5 team member approvals to prevent a single key compromise. This is standard practice for DeFi protocols.

---

**Q: You said the gateway verifies access on-chain. Isn't that slow?**

A `view` call to an Ethereum node (Alchemy/Infura) returns in ~100–300ms. That is entirely acceptable for a captive portal verification — users already wait seconds for the portal page to load. Crucially, `verifyAccess()` is a `view` function — it reads state without writing. No transaction, no gas, no block confirmation wait. It's as fast as a database query. Compare to Web2: the gateway polls the MongoDB backend every 30 seconds already. The on-chain read is not slower.

---

**Q: What is gas and how does it affect user experience?**

Gas is the fee users pay to the Ethereum network for processing their transaction. For `purchaseAccess()`, estimated gas cost on mainnet is ~150,000 gas units. At 20 Gwei gas price, that is 0.003 ETH (~₹8–15 at current ETH prices). This is the main user experience friction of Web3. On Sepolia testnet (our demo), gas is free. For production, we would deploy on an L2 (Arbitrum or Optimism) where the same transaction costs ~₹0.10 instead of ₹10, making it fully viable for ₹30–100 WiFi sessions.

---

**Q: Why not use Polygon instead of Ethereum for lower gas fees?**

Polygon is a viable future choice. We chose Ethereum mainnet/Sepolia because:
1. **Hackathon simplicity** — MetaMask default network, no custom RPC configuration for judges
2. **Credibility** — deploying on Ethereum mainnet signals seriousness to judges
3. **Tooling** — Hardhat's local node is EVM-identical to mainnet, simplifying the dev loop

Our contracts are EVM-compatible. Deploying to Polygon or Arbitrum requires no contract changes — just a different RPC endpoint in `.env`. This is a deployment decision, not an architecture decision.

---

## CATEGORY E — Demo & Practical Scenarios

**Q: Show me the 30-second demo flow.**

1. Open Airlink at `localhost:5173`. Click "Connect Wallet" — MetaMask pops up, approve.
2. Click "Explore" — see WiFi spots on the map. Click one.
3. Click "Book Access" — select 1 hour duration. Price shows in ETH.
4. Click "Book Now" — MetaMask transaction popup. Confirm.
5. Transaction broadcasts to Hardhat local node. In 2 seconds, booking confirmed.
6. Open MetaMask NFTs tab — your Airlink Access Pass NFT appears with spot name and expiry time.
7. Point at gateway console — it shows `verifyAccess()` returning `true` for the wallet address.

---

**Q: What if a judge doesn't have MetaMask?**

We can import the Hardhat test account private key (`0xac0974bec...`) into any MetaMask installation in 30 seconds. The test account has 10,000 test ETH pre-loaded. Alternatively, we can screen-share the demo from a pre-configured machine.

---

**Q: What is your biggest technical risk going to production?**

Three honest risks:
1. **Gas cost UX** — Ethereum mainnet fees make small bookings economically unviable. **Mitigation:** L2 deployment (Arbitrum/Optimism) reduces fees by 100x.
2. **Gateway OS dependency** — Current gateway uses Windows firewall APIs (`netsh`). Linux (iptables) and OpenWrt (router firmware) versions are required for wide deployment. **Mitigation:** Modular gateway design; netsh calls are isolated in one file.
3. **Key management for non-technical owners** — Most homeowners don't have MetaMask. **Mitigation:** Social login with embedded wallets (Magic.link, Privy) — creates a wallet for users behind the scenes, no seed phrase management required.

---

**Q: What are you most proud of technically?**

The on-chain SVG rendering in `AirlinkAccessNFT.sol`. The contract generates a live SVG image entirely in Solidity — the NFT displays the spot number, session duration, and current status (Active/Expired/Revoked) dynamically. No IPFS dependency, no external URL, no backend. The NFT renders perfectly in MetaMask, OpenSea, and any ERC-721 viewer, entirely from on-chain data. It demonstrates that our system works end-to-end in a fully decentralized way — not just a blockchain payment that links to a centralized server.

---

## One-Line Answers for Rapid-Fire Questions

| Question | Answer |
|---|---|
| What is a blockchain? | A database nobody owns that everyone can read and nobody can edit. |
| What is a smart contract? | A vending machine on the internet — pay the right amount, get the exact promised output, automatically. |
| What is an NFT here? | A time-limited WiFi access pass, stored in your wallet, verifiable by the router directly on-chain. |
| What is gas? | The fee for using the Ethereum network to run code — like postage for a letter. |
| What is escrow? | The smart contract holds the money hostage until the service is delivered — neither side can take it early. |
| What is MetaMask? | A browser wallet that lets you sign transactions without revealing your private key to the website. |
| What is Sepolia? | Ethereum's test network — identical to mainnet but with free fake ETH, used for demos and development. |
| What is ethers.js? | The JavaScript library that lets our React frontend talk to the Ethereum blockchain. |
| What is OpenZeppelin? | A library of pre-audited, battle-tested security code for smart contracts. We didn't reinvent ERC-721 or ReentrancyGuard — we imported proven implementations. |
| What is PLATFORM_FEE_BPS = 200? | Our 2% commission, hardcoded in the contract. 200 basis points = 2%. Publicly readable. Unchangeable without redeployment. |
| Why not just use UPI? | UPI is India-only, requires bank accounts, can be frozen by banks, and gives Airlink (not a smart contract) control over funds. ETH is global, permissionless, and trustless. |
| What is your revenue today? | Zero — it is a hackathon prototype. But `withdrawPlatformFees()` is deployed and functional. First real transaction generates revenue automatically. |

---

*Document prepared for Team QuadCoders — Airlink hackathon presentation.*
*All technical details are sourced directly from the deployed codebase in this repository.*
