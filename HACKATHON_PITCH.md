# Airlink — Complete Hackathon Pitch

### Team QuadCoders | Yash Urade · Samiksha Musale · Vaidehi Narkhede · Spandan Mali

---

> **How to use this document:**
>
> - **30-second version** → Section A
> - **2-minute elevator pitch** → Section B
> - **Full presentation script (5–7 min)** → Sections 1–11
> - **Judge Q&A prep** → Section 12
> - **One-page judge summary** → Section 13

---

# SECTION A — 30-Second Version

_Use this when someone asks "what's your project in one sentence."_

> "We built Airlink — the Airbnb for WiFi. Homeowners earn passive income by sharing their unused internet bandwidth. Travelers pay ₹30–₹100 per hour and get automatic, secure access. No passwords. No awkward conversations. Access is enforced by a physical gateway device and a blockchain smart contract — so it's completely trustless and can't be gamed. We're solving a ₹40,000 crore problem that nobody has touched yet."

---

# SECTION B — 2-Minute Elevator Pitch

_Use this for demo rounds, booth conversations, or quick judge intros._

"You've walked into a hotel and paid ₹800 for WiFi that barely works. Meanwhile, there's a guy in the room next door with 200 Mbps that he's using for one WhatsApp call. Nobody connects those two people. That's the gap we're filling.

Airlink is a peer-to-peer WiFi marketplace. Owners list their spare bandwidth, set a price — maybe ₹50 an hour. Users open the app, see a live map of nearby spots, pay, and they're connected. Automatically. No passwords. It just works.

The critical question everyone asks is: 'Isn't this just sharing a WiFi password?' No. When someone pays, they don't get a password — they get a time-locked NFT access token on the Ethereum blockchain. It works exactly for the duration they paid for. When time's up, the physical gateway device at the owner's router disconnects them automatically. The owner does absolutely nothing. No approvals, no manual disconnects. Completely passive.

We made this Web3 because this is a marketplace between strangers. Neither party should have to trust us — Airlink. The smart contract holds the payment in escrow, releases 98% to the owner when the session completes, and keeps 2% as our fee. Every rupee is on-chain. Every transaction is verifiable on Etherscan. We literally cannot cheat our own users.

Business model: 2% fee on every booking. ₹100 booking = ₹2 for us. At 10,000 bookings a day across one city, that's ₹20,000 per day. Scale that to Tier 1 and Tier 2 cities — and the numbers get very interesting. The market is 900 million Indian internet users with 70% of home bandwidth going to waste every day.

We are Team QuadCoders — Yash, Samiksha, Vaidehi, and Spandan. We built the full stack: smart contracts, backend API, frontend app, and a working physical gateway device. Thank you."

---

# FULL PRESENTATION SCRIPT (5–7 Minutes)

---

## 1. THE PROBLEM (30 seconds)

You're travelling. Your phone has one bar. You walk into a café and ask for WiFi.  
They say — _"Sorry, only for paying customers."_

You order a coffee you didn't want. The password works for 5 minutes. Then it drops.

Meanwhile, **the person in the flat above that café is paying ₹999/month for 200 Mbps — using 3% of it.**

**Two people. Same building. One needs WiFi. One is wasting it. Nobody connects them.**

That's the market failure we're fixing.

---

---

# 1. THE HOOK — Open With a Story

_[Say this to start. Make it personal. Look at the judges.]_

"Let me start with a scenario that every single person in this room has lived.

You're travelling. Your phone has one bar of signal. You walk into a café and ask for the WiFi password. They say — 'Sorry, it's only for paying customers.'

You order a coffee you didn't want. The password is scribbled on a receipt. The connection drops in five minutes anyway.

Meanwhile — the person in the apartment right above that café is paying ₹999 a month for 200 Mbps of internet. Using three percent of it. Right now. While you sat there battling 2G.

**Two people. Same building. One needs WiFi desperately. One is wasting it completely. Nobody is connecting them.**

That's not a small inconvenience. That is a market failure. And that is exactly what we built Airlink to fix."

---

# 2. THE PROBLEM — Why This Matters

_[Say this clearly. Show the scale.]_

Let's look at the numbers, because the problem is bigger than it feels:

- **Hotel WiFi** costs ₹500–1,000 per day. Often slow and shared with 200 other guests.
- **Public WiFi** at malls and stations? Open networks — anyone can see your traffic.
- **Mobile data** works outdoors, but the moment you step inside a mall, a basement, or a building — it dies.
- **Home broadband** in India crossed ₹40,000 crore this year. **70% of that bandwidth sits idle** during the day.

The problem breaks into two real pains:

| The Person Needing WiFi                          | The Person Wasting WiFi                    |
| ------------------------------------------------ | ------------------------------------------ |
| Paying ₹500–1,000/day for hotel WiFi             | Paying ₹999/month, using 30% of it         |
| Using overloaded, insecure public hotspots       | Has no way to monetize the other 70%       |
| Can't find reliable indoor connectivity          | Completely passive resource going to waste |
| Travelers, gig workers, students, remote workers | Homeowners, café owners, offices           |

**Supply exists. Demand exists. There is no marketplace connecting them.**

---

# 3. THE SOLUTION — Airlink

> **Airlink is Airbnb for WiFi.**
> WiFi owners earn passive income from their idle bandwidth. Users get affordable, secure, on-demand internet anywhere. No passwords. No awkward conversations. Completely automatic.

---

# 4. HOW IT WORKS — 3 Steps Each Side

_[Keep this crisp. Two personas, three steps each.]_

### For the person who NEEDS WiFi:

```
Step 1  →  Open Airlink app. See a live map of nearby WiFi spots
            with real speeds, prices, and ratings from other users.

Step 2  →  Pick a spot. Pay ₹30–₹100 for the hour.
            (Less than a cup of coffee at that café.)

Step 3  →  You're connected. Automatically.
            No password. No asking. No receipt. It just works.
```

### For the person who HAS spare WiFi:

```
Step 1  →  Plug our small gateway device into your home router.
            (Takes 2 minutes. No technical knowledge needed.)

Step 2  →  List your WiFi on the app.
            Set your price, set your hours, set your rules.

Step 3  →  Sit back. Money comes to you every time
            someone connects — while you're at work, asleep,
            or watching cricket. 100% passive.
```

---

# 5. THE HARD PART WE SOLVED — Security

_[This is where judges get curious. Address it head on.]_

"The first question everyone asks is — 'Isn't this just sharing a WiFi password?'

No. And here is exactly why.

In a normal setup, sharing a password means someone can screenshot it, give it to 10 friends, and stay connected forever. The owner has no control. That's why nobody does this today.

**We built a completely different access system.**

When a user pays, they don't get a password. They get a **time-locked NFT access token** — minted on the Ethereum blockchain.

Here is what makes it different:

| Property       | Traditional Password                     | Airlink Token                       |
| -------------- | ---------------------------------------- | ----------------------------------- |
| Duration       | Permanent until changed                  | Exact hours purchased               |
| Shareable?     | Yes — one screenshot and it's everywhere | No — tied to one wallet address     |
| Auto-expires?  | No — manual password change              | Yes — contract kills it at checkout |
| Forceable off? | Router password reset required           | Gateway disconnects automatically   |
| Forgeable?     | Yes if password leaks                    | No — cryptographic, on Ethereum     |

The **physical gateway device** at the owner's router is the enforcement arm. Every 60 seconds, it checks the blockchain: 'Is this user's token still valid?' When the answer is no — the user is disconnected. Automatically. The owner never touches anything.

Think of it as a hotel key card — except it lives on the blockchain and self-destructs the moment checkout time hits."

---

# 6. THE TECH STACK

_[Show you actually built something real.]_

```
                         ┌─────────────────┐
                         │   User's Phone  │
                         │ (Airlink App)   │
                         └────────┬────────┘
                                  │ ethers.js
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
          ┌──────────────────┐        ┌──────────────────┐
          │  React Frontend  │        │  Express Backend  │
          │  TypeScript+Vite │        │  Node.js + MongoDB│
          └────────┬─────────┘        └──────────────────┘
                   │
                   │ Smart contract calls
                   ▼
   ┌──────────────────────────────────────────────────────┐
   │              Ethereum Blockchain                      │
   │                                                      │
   │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
   │  │ WiFiRegistry│  │  AccessNFT   │  │  Escrow    │  │
   │  │ (Spot list) │  │ (ERC-721     │  │  (ETH held │  │
   │  │             │  │  pass)       │  │   safely)  │  │
   │  └─────────────┘  └──────────────┘  └────────────┘  │
   │             All three controlled by AccessManager    │
   └────────────────────────┬─────────────────────────────┘
                            │ on-chain verification
                            ▼
                  ┌──────────────────────┐
                  │  Physical Gateway    │
                  │  Device at Router   │
                  │  (real enforcement) │
                  └──────────────────────┘
```

| Layer               | Technology                                                      |
| ------------------- | --------------------------------------------------------------- |
| **Frontend**        | React 18, TypeScript, Vite, TailwindCSS, ethers.js v6           |
| **Backend**         | Node.js, Express, TypeScript, MongoDB (bookings + users)        |
| **Smart Contracts** | Solidity ^0.8.28, 4 modular contracts, OpenZeppelin v5, Hardhat |
| **Auth**            | JWT + MetaMask wallet sign-in                                   |
| **Gateway**         | Node.js captive portal — runs on the physical device            |
| **Blockchain**      | Ethereum (Hardhat local / Sepolia testnet)                      |

**4 Smart Contracts — each with a single responsibility:**

| Contract             | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| **WiFiRegistry**     | Stores all spot metadata, speeds, prices, availability                 |
| **AirlinkAccessNFT** | Mints the ERC-721 access pass when payment is made                     |
| **PaymentEscrow**    | Holds ETH safely until session completes, then auto-splits             |
| **AccessManager**    | The orchestrator — user calls one function and all three work together |

---

# 7. WHAT WE ACTUALLY BUILT

_[This section proves the project is real — not just an idea.]_

Everything below is working in our demo right now:

- **Live spot map** — search nearby spots, filter by speed, price, rating
- **Full booking flow** — pick spot → select duration → MetaMask payment → instant NFT access pass
- **Smart contract escrow** — ETH held until session ends, then released: 98% owner / 2% platform
- **Physical captive portal gateway** — detects new device connections, validates blockchain token, grants or blocks access
- **Auto session expiry** — exactly when time runs out, gateway disconnects the user. Zero manual action.
- **Owner dashboard** — real-time earnings, active sessions, booking history, withdraw button
- **Review system** — users rate spots after each session. Verified reviews only (can't review without booking).
- **Dispute system** — on-chain dispute raised by either party, resolved by admin with proportional refund
- **On-chain NFT metadata** — access pass renders as an NFT in MetaMask with spot details + expiry time

---

# 8. WHY WEB3 — EXPLAINED SIMPLY

_[Judges will ask this. Have your answer ready.]_

"Why did we put this on blockchain? Can't you just use a regular database?"

**Great question. Here's the honest answer.**

Airlink is a marketplace between **strangers**. A homeowner in Pune shares their network with someone they've never met. That person sends money to someone they've never met. In the middle — us, Airlink — a startup they've never heard of.

In that scenario, **why should either party trust us?**

Here is what happens in a traditional (Web2) system:

```
User pays ₹100
  → Razorpay confirms to Airlink server
  → Airlink server writes "ownerEarnings = ₹98" in MongoDB
  → Owner must trust that number is correct
  → Owner manually requests payout
  → Airlink manually processes bank transfer
```

The owner has **zero proof** the ₹98 number is real. We could show ₹98 in the dashboard and actually send ₹60. They'd never know. And if our server goes down — nobody gets paid, nobody gets access.

**Here's what happens with Web3:**

```
User pays ETH to smart contract
  → Contract code (public on Etherscan) splits: 98% owner / 2% Airlink
  → Owner's withdrawable balance updates on-chain instantly
  → Owner calls withdrawEarnings() any time — directly from their wallet
  → Nobody can block it. Nobody can change the split. Not even us.
```

The 98/2 split is not a number in our database. It is a constant in Solidity code that is **permanently deployed on the blockchain**:

```solidity
uint256 public constant PLATFORM_FEE_BPS = 200; // 2% — forever
```

Anyone can read this on Etherscan right now. We literally cannot change it without redeploying and everyone seeing it immediately.

**Web3 isn't a gimmick here. It's the only architecture that removes the need to trust us.**

---

# 9. COMPETITIVE LANDSCAPE & OUR MOAT

_[Show you've thought about competition.]_

|                    | Hotel WiFi      | Public WiFi  | Mobile Hotspot | Airlink                  |
| ------------------ | --------------- | ------------ | -------------- | ------------------------ |
| **Cost**           | ₹500–1,000/day  | "Free"       | Uses own data  | ₹30–100/hour             |
| **Security**       | Shared password | Open network | N/A            | NFT token, cryptographic |
| **Reliability**    | Varies          | Poor         | Good           | Verified by users        |
| **Owner earns?**   | ISP only        | No           | No             | ✅ Passive income        |
| **Trustless?**     | No              | No           | No             | ✅ Smart contract        |
| **Works indoors?** | Yes             | Hit or miss  | Yes            | Yes                      |

**Who could be a competitor?**

Nobody has built this in India. Globally, companies like Wigo and Fon tried version 1.0 of this idea but:

- No blockchain — easily cheated
- No physical gateway — no real enforcement
- No marketplace discovery — just router-level sharing

**Our defensible moat has three layers:**

1. **Physical hardware** — our gateway device. Apps can be cloned in a weekend. A deployed network of hardware devices cannot.
2. **Network effects** — every owner who joins makes the app more valuable for users, which brings more owners. Classic marketplace flywheel.
3. **Verified review ecosystem** — real-use reviews build trust over time. Trust doesn't transfer to a copycat.

_(Same moat Airbnb has with hosts, Uber has with drivers — the network itself.)_

---

# 10. BUSINESS MODEL + NUMBERS

_[Be specific. Judges love concrete numbers.]_

**Revenue:** 2% platform fee on every booking. That's it.

```
₹100 booking:
  ├── ₹98 → WiFi Owner  (auto-released by smart contract)
  └── ₹2  → Airlink     (platform fee)
```

**Why 2%?** Low enough that owners are happy. High enough to build a real business at scale.

**Conservative projections:**

| Scenario              | Bookings/Day | Avg Booking | Daily Revenue | Annual Revenue |
| --------------------- | ------------ | ----------- | ------------- | -------------- |
| 1 city, early         | 1,000        | ₹80         | ₹1,600        | ₹5.8L          |
| 5 cities              | 10,000       | ₹100        | ₹20,000       | ₹72L           |
| Tier 1 + Tier 2 scale | 1,00,000     | ₹100        | ₹2,00,000     | ₹7.2Cr         |

**Owner side — why they'll join:**

- Average unused bandwidth: 70% of plan speed
- Average listing price: ₹60/hour
- Average 3 bookings/day = **₹180/day = ₹5,400/month passive income**
- Their plan cost: ₹999/month
- **Net gain: ₹4,400/month for doing absolutely nothing**

---

# 11. THE MARKET OPPORTUNITY

The total addressable market for this is massive — and untouched:

- **900 million+ Indian internet users**
- **India home broadband: ₹40,000 crore/year** — 70% bandwidth idle
- **Hotel WiFi globally: $1.2B market** — growing 8% per year
- **Gig economy workers in India: 15 million+** — all needing daily connectivity
- Travelers spend **₹5,000–15,000/year** on ad-hoc connectivity

No company has built a trusted, scalable, hardware-backed WiFi sharing marketplace for India.  
The timing is right. The infrastructure (UPI, broadband, smartphones) is finally here.

---

# 12. THE BIGGER VISION

_[End the pitch with something meaningful.]_

This isn't just a product for tech-savvy traveling professionals.

This is connectivity infrastructure for people who can't afford a ₹999/month broadband plan — but can afford ₹30 when they need it. People in Tier 2 cities, transit zones, rural edges. People being left behind by a system designed for fixed addresses and monthly plans.

Airlink creates a **shared economy of connectivity**. The person with the ₹999 plan becomes a micro-ISP for their neighborhood. The person without a plan gets access when they need it, for what they can afford.

> _"The internet is everywhere. Access to it shouldn't be a privilege."_

---

# TEAM — QuadCoders

Four engineers. One problem we've all lived.

| Name                 | Role                                        |
| -------------------- | ------------------------------------------- |
| **Yash Urade**       | Backend API + Smart Contract Architecture   |
| **Samiksha Musale**  | Frontend (React) + User Experience          |
| **Vaidehi Narkhede** | Blockchain (Solidity) + System Architecture |
| **Spandan Mali**     | Gateway Device + System Integration         |

We didn't build Airlink because it was a cool idea for a hackathon.  
We built it because we've sat in hotels with broken WiFi, burned mobile data in basements, and thought — _someone should fix this._

So we did.

---

# THE ASK

Three things from the judges:

1. **Feedback** — What are we missing? What would you need to see to take this seriously?
2. **Connections** — ISPs, router manufacturers, hospitality chains, co-working spaces = our ideal launch partners
3. **Recognition** — Help us get this in front of the people who need it

---

---

# SECTION 12 — JUDGE Q&A PREP

_[Every tough question a judge might ask — with the right answer.]_

---

**Q: "Is this even legal? Won't ISPs block this?"**

A: Sharing WiFi is not illegal in India. ISPs restrict commercial resale in their ToS, but personal sharing of bandwidth is common and accepted — the same way sharing your Netflix password technically violates ToS but isn't a criminal act. The real question is whether we can work _with_ ISPs rather than against them. Our long-term plan includes ISP partnerships where they supply bandwidth specifically for Airlink hosts — creating a new distribution channel for them, not a threat.

---

**Q: "What stops someone from using my WiFi for illegal activity?"**

A: Three layers of protection. First, every user is verified by wallet address — there is a permanent on-chain transaction record linking every session to a specific wallet. Second, our gateway device logs which user accessed the network at which time — traceable if law enforcement ever needs it. Third, our ToS makes the user legally responsible for their activity. This is the same framework ISPs use — they aren't liable for what their customers do, but they maintain logs.

---

**Q: "This is Web3 — why not just use a regular database? What does blockchain actually do here?"**

A: Three things blockchain does that a database cannot:

1. **Trustless payments** — the 98/2 split is a smart contract constant anybody can verify on Etherscan. We literally cannot change it. A database is just a number we control.
2. **Unforgeable access tokens** — an NFT on Ethereum can only be owned by one wallet. You can't screenshot an NFT and give it to your friend. A database record can be duplicated by anyone with DB access.
3. **Always-on availability** — if our backend server crashes, smart contracts don't. On-chain bookings still work, gateway still verifies on-chain, owners still withdraw earnings directly from the contract.

---

**Q: "MetaMask is too complicated for regular users. Who is your actual user?"**

A: You're right that MetaMask is a barrier for mass adoption. Our current demo uses MetaMask because this is a hackathon and we wanted to show the full Web3 flow. Our production plan: abstract the wallet away. We create a custodial wallet behind the scenes for new users — they sign up with phone number, we handle the wallet. Power users can connect their own wallet. Same as how Coinbase onboards non-crypto users. The blockchain benefits are real; the UX friction is solvable.

---

**Q: "The gateway device — how does it actually work technically?"**

A: The gateway device runs a Node.js captive portal. When a new device connects to the WiFi, DNS is hijacked so all traffic goes to our portal page first. The portal asks for a booking confirmation. The gateway then calls `AccessManager.verifyAccess(spotId, userAddress)` — a free read-only call directly to the smart contract. If it returns true, internet access is granted. If false, the user sees the portal. Every 60 seconds, running sessions are re-checked. When the NFT expires on-chain, the next check disconnects them. No backend required for this verification. Just the on-device Node.js process talking directly to the blockchain node.

---

**Q: "What happens if the owner's internet goes down?"**

A: The user's session is interrupted, same as if a hotel's WiFi goes down. We have a dispute system built in — user can raise a dispute on-chain, admin reviews, and a proportional refund is issued. Long-term, we can use uptime monitoring (ping from our servers) to automatically trigger partial refunds if an owner's gateway goes offline mid-session. This is a solvable operational problem, not a fundamental architectural one.

---

**Q: "How do you prevent an owner from listing their neighbour's WiFi?"**

A: During onboarding, the gateway device must be plugged in, and the WiFi credentials must match what's registered. The device pings our backend to confirm it's live and connected before the listing goes active. An owner can't list a fake network because there's no physical device at that network confirming it works. Think of it like Airbnb's address verification — you can't list a property without proving you have access to it.

---

**Q: "What's your go-to-market? How do you get the first 100 owners?"**

A: Classic marketplace strategy — supply first, in a tight geography.

- Target co-working spaces and cafes in one neighbourhood (they already serve a mobile-worker audience)
- Partner with PGs and hostels (their guests are exactly our user, and the owner gets extra income)
- Student hostels near colleges — high density, price-sensitive users, owners who want extra money
- Offer early owners a 0% platform fee for the first 6 months as incentive

Once 20–30 spots are live in one area, organic user demand follows because the app is useful in that area.

---

**Q: "How is this different from just being a better public WiFi system?"**

A: Public WiFi is free, open, and owned by a single entity (mall, government, ISP). Airlink is a private, paid, decentralized network owned by thousands of individual homeowners. The key differences:

- **Paid = accountability** — when money is involved, owners maintain their connections. Public WiFi has no such incentive.
- **Private network** — each owner's gateway creates a separate authenticated session, not an open shared network. Your traffic is not visible to other Airlink users.
- **Distributed = resilience** — 1,000 owner nodes in a city can't all fail at once. A central ISP hotspot can.

---

# SECTION 13 — ONE-PAGE JUDGE SUMMARY

_[Print this as a handout or show it on a final slide.]_

|                      |                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- |
| **Project Name**     | Airlink                                                                           |
| **Team**             | QuadCoders — Yash, Samiksha, Vaidehi, Spandan                                     |
| **One Line**         | Airbnb for WiFi — powered by Ethereum smart contracts                             |
| **The Problem**      | 70% of home bandwidth wasted. Travelers pay ₹500–1,000/day for bad hotel WiFi.    |
| **The Solution**     | P2P WiFi marketplace. Owners earn passive income. Users pay ₹30–100/hour.         |
| **How access works** | Time-locked ERC-721 NFT + physical gateway device. Auto-expires. Can't be shared. |
| **Business model**   | 2% fee per booking. No subscriptions. Aligned incentives.                         |
| **Revenue at scale** | ₹7.2 Cr/year at 1,00,000 bookings/day across Tier 1+2 cities                      |
| **Market size**      | ₹40,000 Cr home broadband + $1.2B hotel WiFi globally                             |
| **Why Web3?**        | Strangers transacting need trustless rules, not "trust Airlink"                   |
| **What we built**    | React app + Express API + MongoDB + 4 Solidity contracts + physical gateway       |
| **Our moat**         | Physical hardware network + verified reviews + network effects                    |
| **Hackathon**        | HackOverflow 2026                                                                 |

---

_"Every unused Mbps is a wasted resource. Airlink turns waste into wealth — for owners, for users, and for India's digital infrastructure."_

**— Team QuadCoders**
