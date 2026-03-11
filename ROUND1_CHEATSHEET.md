# Airlink — Technical Understanding Guide

> Read this before presenting. Every section is structured so you can answer judge questions confidently.

---

# 1. Project Overview

## What Problem Are We Solving?

- Public WiFi is unreliable, insecure, and not always available.
- Personal hotspot owners already pay for mobile data plans but share it for free with no benefit.
- There is no trusted marketplace where someone can buy verified, temporary WiFi access from another person.

## What Does Airlink Do?

Airlink is a **peer-to-peer WiFi marketplace**. Think of it like Airbnb, but instead of renting a room, you are renting internet access.

- **Hotspot owners** list their WiFi or mobile hotspot on the platform with a price per hour.
- **Users** browse nearby spots, pay, and get authenticated access.
- **Smart contracts** handle the payment — so no middleman takes control of the money.
- **NFT access passes** are minted when a booking is confirmed, giving the user verifiable proof of their access right.

## Why Is It Useful?

- Earns money for hotspot owners from unused bandwidth they already pay for.
- Gives users affordable, trusted WiFi access in places where public WiFi is unavailable or unsafe.
- Decentralised payments mean no payment processor can block or delay earnings.
- Transparent, on-chain records prevent fraud on both sides.

## High-Level Architecture

```
+------------------+     REST API     +-----------------+     Mongoose     +--------------+
|    Frontend      | ──────────────>  | Express Backend | ──────────────>  |   MongoDB    |
|   React+Vite     | <──────────────  | (Node/TypeScript)|                  | (Atlas/Local)|
+------------------+                  +-----------------+                  +--------------+
        |                                      |
        |  MetaMask / ethers.js                |  (future: read contract state)
        v                                      v
+----------------------------------------------------------------------+
|                       Ethereum Blockchain                            |
|  AirlinkMarketplace.sol  |  WiFiRegistry.sol  |  NFT access passes  |
+----------------------------------------------------------------------+
```

- **Frontend** — React app. Users sign up, browse spots, connect wallet, book access.
- **Backend** — Express + TypeScript. Handles auth, spot data, bookings, reviews.
- **MongoDB** — Stores users, spots, bookings, reviews, captive sessions.
- **Blockchain** — Handles payments in ETH, mints NFT access passes, records spot registry.

---

# 2. Round 1 Demo Explanation

## What We Will SHOW Live

1. **User Registration** — Fill signup form (name, email, phone, password). Backend creates account, returns JWT token.
2. **User Login** — Enter credentials. Backend verifies password hash, returns new JWT token.
3. **Wallet Connection** — Connect MetaMask wallet to the app. Wallet address gets linked to the user profile.
4. **WiFi Spot Dashboard** — Show the list of WiFi spots loaded from the database. Spots have name, location, price, speed, and rating visible.

## What We Will EXPLAIN Verbally (Not Demoed Yet)

- **Hotspot Discovery** — In the final product, users can filter spots by city, speed, price range, and availability. The spots are stored in MongoDB with lat/lng coordinates for map-based discovery.
- **Booking Flow** — User selects a spot, pays in ETH via MetaMask. The `AirlinkMarketplace` smart contract holds payment in escrow. A booking record is created in MongoDB with a unique access token.
- **Captive Portal** — When the user connects to the hotspot's WiFi network, the router intercepts and redirects the browser to our gateway. The gateway checks the user's booking access token and wallet ownership of the NFT pass, then grants internet access. This is planned for Round 2.
- **NFT Access Pass** — When a booking is confirmed, an ERC-721 NFT is minted to the user's wallet. This acts as a verifiable, on-chain ticket. When the session ends, the NFT is burned.
- **Earnings Release** — After the session ends, the smart contract releases 98% of the payment to the hotspot owner and 2% as a platform fee.

## How to Explain Hotspot Visibility

> "Right now you can see WiFi spots listed on our platform. Each spot has a name, address, price per hour, speed, and rating. In the full product, a hotspot owner would register their spot either on our backend or directly on the blockchain via the WiFiRegistry smart contract. Users would see a map view and filter by location, so this works like a real marketplace."

## How to Explain Captive Portal

> "A captive portal is the login page you see when you connect to hotel or airport WiFi. Our gateway software runs on the hotspot owner's router. When a user connects, the router intercepts all traffic and redirects it to our portal. Our portal checks the user's booking token and their wallet's NFT pass. If both are valid, internet access is granted. This completely removes the need for anyone to manually share a password."

---

# 3. Backend Fundamentals

## How the Backend Is Structured

Every incoming request travels through this pipeline:

```
HTTP Request
     |
     v
  Routes  (which URL + method?)
     |
     v
Middleware  (is this user authenticated?)
     |
     v
Route Handler / Controller  (run the business logic)
     |
     v
  Models  (interact with MongoDB)
     |
     v
HTTP Response  (send JSON back)
```

## Routes

Routes decide **which function runs** when a specific URL is called.

Example from our project:
```
POST /api/auth/signup   -> runs the signup handler
POST /api/auth/login    -> runs the login handler
GET  /api/spots         -> returns list of WiFi spots
POST /api/bookings      -> creates a booking
```

We have these route files:
- `auth.ts` — signup, login, get profile
- `spots.ts` — list spots, get one spot, create/update spot
- `owner.ts` — owner-specific routes (my spots, earnings)
- `bookings.ts` — create booking, view bookings
- `captive.ts` — captive portal authentication
- `reviews.ts` — submit and fetch reviews

## Middleware

Middleware is code that **runs before the actual route handler**. It can check conditions and either allow the request to continue or reject it.

Our `protect` middleware:
1. Reads the `Authorization: Bearer <token>` header
2. Decodes the JWT token using our secret key
3. If valid -> attaches `userId` and `userRole` to the request object and calls `next()`
4. If invalid or missing -> immediately returns `401 Unauthorized`

We also have `requireRole('owner')` middleware that blocks non-owners from accessing owner-only routes.

## Controllers

In our project, the controller logic lives **directly inside the route handler function**. This is a common pattern for smaller projects.

A controller:
- Reads data from `req.body` or `req.params`
- Validates inputs
- Calls the database via Models
- Returns a JSON response

## Models

Models are **TypeScript classes that represent a MongoDB collection**. Each model maps to one collection in the database.

Our models:
| Model | Collection | Purpose |
|---|---|---|
| `User` | users | Stores registered accounts |
| `WifiSpot` | wifispots | All listed hotspots |
| `Booking` | bookings | Session reservations |
| `CaptiveSession` | captivesessions | Active portal sessions |
| `Review` | reviews | User reviews of spots |

## Schemas

A schema is the **blueprint for a document** in MongoDB. It defines what fields exist, what types they are, and what validation rules apply.

Example from our `User` schema:
```typescript
name:     { type: String, required: true, trim: true }
email:    { type: String, required: true, unique: true, lowercase: true }
password: { type: String, required: true, minlength: 8 }
role:     { type: String, enum: ["user", "owner"], default: "user" }
```

## Services

We do not have a dedicated `services/` folder — business logic lives in route handlers. In a larger production system, services would sit between controllers and models to keep things organised.

---

# 4. Database Design

## Why We Chose MongoDB

MongoDB is a **NoSQL document database**. Instead of tables and rows (like SQL), it stores data as JSON-like documents.

**Reasons we chose it:**
- **Flexible schema** — we can add new fields to a document without running a migration script.
- **JSON-native** — our API sends and receives JSON; MongoDB stores JSON. No conversion layer needed.
- **Fast to prototype** — perfect for a hackathon where requirements change every hour.
- **Mongoose** — the TypeScript library Mongoose gives us schema validation and type safety on top of MongoDB's flexibility.
- **Atlas** — MongoDB offers a free cloud-hosted option so we do not need to run a database server locally.

## How Documents Are Stored

Each record is called a **document**, stored as BSON (Binary JSON). Documents are grouped into **collections** (equivalent to tables in SQL).

Example `User` document in MongoDB:
```json
{
  "_id": "64abc123...",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "$2b$12$hashed...",
  "role": "user",
  "walletAddress": "0xABC123...",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## Collections and Their Purpose

### `users`
Stores every registered account. Fields: name, email, hashed password, role (`user` or `owner`), optional wallet address.

### `wifispots`
Every hotspot listed on the platform. Fields: owner reference, name, coordinates (lat/lng), city, price per hour, speed in Mbps, max users, security type (WPA2/WPA3), WiFi password (encrypted at rest), amenities, approval status, monitoring stats.

### `bookings`
A reservation record linking a user to a WiFi spot. Fields: start/end time, duration, price breakdown (subtotal, 2% platform fee, owner earnings), payment status, blockchain `txHash`, NFT `tokenId`, access token for captive portal, OTP fallback.

### `captivesessions`
Tracks active portal sessions per device. Fields: booking reference, device ID, MAC address, IP address, session token, expiry time, data usage in MB.

### `reviews`
User ratings after a completed booking. Fields: overall/speed/reliability/value ratings (1-5), comment, owner response, verified flag (only users who completed a booking can review).

## How the Database Connects to the Backend

In `config.ts` we read `MONGO_URI` from a `.env` file. In `server.ts`:

```typescript
mongoose.connect(MONGO_URI)
  .then(() => app.listen(PORT))
```

Mongoose opens a persistent connection pool. Every Model query uses this connection automatically.

---

# 5. Authentication System

## User Registration — Step by Step

1. User submits: `name`, `email`, `phone`, `password`, optional `walletAddress`
2. Backend validates all required fields are present
3. Backend checks if an account with that email already exists -> returns `409` if so
4. `User.create(...)` is called — Mongoose pre-save hook fires automatically
5. **bcrypt hashes the password** with 12 salt rounds before saving — the raw password is never stored
6. A **JWT token** is signed with our secret and an expiry of 7 days
7. The token + user object (without password) is returned to the frontend

## User Login — Step by Step

1. User submits `email` and `password`
2. Backend queries MongoDB: `User.findOne({ email })`
3. If not found -> `401 Invalid credentials`
4. `user.comparePassword(candidate)` runs `bcrypt.compare()` — compares the submitted password against the stored hash
5. If matched -> a new JWT is signed and returned
6. Frontend stores the token (localStorage or memory)

## How JWT Works

JWT = **JSON Web Token**. It is a compact, signed string with three parts:

```
header.payload.signature
```

- **Header** — algorithm used (HS256)
- **Payload** — contains `{ id: userId }` so the backend knows who is making the request
- **Signature** — proves the token was created by us using `JWT_SECRET`; cannot be faked

On every protected request:
1. Frontend sends `Authorization: Bearer <token>` header
2. `protect` middleware calls `jwt.verify(token, JWT_SECRET)`
3. If valid -> `req.userId` is set, request continues
4. If expired or tampered -> `401`

**Important:** JWT tokens are **stateless** — the backend does not store them. No database query is needed to validate a JWT. This makes it fast.

## Wallet Authentication

- Wallet address is optional — a user can sign up without MetaMask.
- After connecting MetaMask on the frontend, the `walletAddress` field in MongoDB is updated.
- In the blockchain flow, the wallet address becomes the user's identity for smart contract interactions. No password is involved in blockchain transactions.

---

# 6. Blockchain Fundamentals (Beginner Friendly)

## Blockchain — The Analogy

> Imagine a Google Sheet that everyone in the world can read, but nobody can edit a past row. New rows can only be added if the majority of computers agree it is valid. That is a blockchain.

- A chain of blocks, each containing a batch of transactions.
- Once a block is added it cannot be changed without rewriting all subsequent blocks — practically impossible.
- No single company owns or controls it.

## Ethereum

Ethereum is the blockchain we use. Its key advantage over Bitcoin is that it supports **smart contracts** — programs that run on the blockchain.

## Smart Contracts — The Analogy

> Imagine a vending machine. You insert money, press a button, and the machine automatically gives you a snack. No shopkeeper decides. No one can stop it. A smart contract works the same way — it runs automatically when conditions are met.

- Written in Solidity (a language similar to JavaScript/C++)
- Deployed once to the blockchain; they cannot be deleted or modified after deployment
- Our contracts: `AirlinkMarketplace.sol`, `WiFiRegistry.sol`, `AirlinkAccessNFT.sol`, `PaymentEscrow.sol`

## Wallets

- A wallet is your **identity on the blockchain**.
- It has a **public address** (like your bank account number — safe to share): `0xABC123...`
- It has a **private key** (like your PIN — never share this): used to sign transactions and prove ownership.
- We use **MetaMask** — a browser extension wallet.
- Your wallet does not hold coins directly; it holds cryptographic keys that prove ownership on the blockchain.

## Public Key vs Private Key

| | Public Key (Address) | Private Key |
|---|---|---|
| Purpose | Receive funds, identify you | Sign transactions, prove ownership |
| Share? | Yes, freely | Never, ever |
| Analogy | Your email address | Your email password |

## Transactions

Any action that changes data on the blockchain is a transaction:
- Paying for a booking
- Registering a WiFi spot
- Minting an NFT
- Completing/cancelling a booking

Each transaction costs a small fee called **gas**.

## Gas Fees

- The Ethereum network is powered by thousands of computers (nodes) validating transactions.
- Gas is the fee paid to those computers for their work.
- Gas price fluctuates with network demand.
- On testnets (like Hardhat local) gas is free/fake — used only for testing.

## On-Chain vs Off-Chain Data

| On-Chain (Blockchain) | Off-Chain (MongoDB) |
|---|---|
| Payment amounts | User profiles |
| Booking status | Reviews |
| NFT ownership | Session logs |
| Spot registration | Images, descriptions |
| Platform fees | Search metadata |

**Rule of thumb:** Put on-chain only what needs to be trustless and permanent. Everything else goes in MongoDB for speed and cost.

---

# 7. How Blockchain Connects to Our Backend

## Overview

Our architecture is a **hybrid Web2 + Web3 system**:

```
User Action
    |
    +---> Frontend calls Backend API (Web2 part)
    |         -> Creates/reads records in MongoDB
    |
    +---> Frontend calls MetaMask / smart contract (Web3 part)
              -> Sends ETH, mints NFT, updates on-chain state
```

The two systems are **linked by wallet address**. The user's MongoDB record stores their `walletAddress`; the smart contract uses that address as their blockchain identity.

## Smart Contract Interaction

- The frontend uses **ethers.js** (a JavaScript library) to talk to smart contracts.
- When a user books a spot, the frontend calls `AirlinkMarketplace.bookSpot(spotId, hours)` with ETH attached.
- The contract validates the payment, creates a `Booking` struct on-chain, holds ETH in escrow.
- The contract emits an event — `BookingCreated(bookingId, user, spotOwner, amount)`.
- Our backend (or the frontend) reads this event and creates a matching record in MongoDB.

## Wallet Authentication

- When MetaMask is connected, the frontend gets the wallet's public address.
- This address is sent to the backend and saved to `user.walletAddress` in MongoDB.
- For booking, user signs the transaction with their private key via MetaMask — they never give us their key.

## What Lives Where

| Data | Where It Lives | Why |
|---|---|---|
| ETH payment | Smart contract escrow | Trustless, no one can steal it |
| NFT access pass | Ethereum blockchain | Proves ownership without our database |
| Spot registry | `WiFiRegistry.sol` | Cannot be censored |
| User profile, reviews | MongoDB | Fast reads, flexible, cheap to store |
| Active sessions | MongoDB (CaptiveSession) | Changes every second — too expensive on-chain |

---

# 8. Why MongoDB Over SQL

## SQL Databases (like MySQL / PostgreSQL)

- Store data in rigid **tables with fixed columns**.
- Changing the structure requires a **migration** script.
- Joins between tables are powerful but complex.
- Better for highly relational, stable data (banking systems, accounting).

## MongoDB

- Stores data as **documents** (JSON objects) — each document can have different fields.
- No migrations needed for adding new fields.
- Nesting data is natural — e.g. `booking.paymentSetup.walletAddress` is one document, not two joined tables.

## Comparison Table

| Feature | MongoDB | SQL (PostgreSQL) |
|---|---|---|
| Schema | Flexible, optional | Fixed, strict |
| Data format | JSON documents | Tables and rows |
| Adding a new field | Just add it | ALTER TABLE migration |
| Joins | Not needed (embed data) | JOIN queries |
| Speed for prototyping | Very fast | Slower to set up |
| Best for | Hackathons, startups | Banking, ERP systems |

## Why We Specifically Chose MongoDB for Airlink

1. **Spot data changes shape often** — we kept adding fields (monitoring, amenities, security type) without breaking existing records.
2. **Booking documents embed payment data** — no need to join across 3 tables to show a user their booking history.
3. **CaptiveSession tracking** — updates happen every few seconds per device; MongoDB handles high write loads well.
4. **Mongoose gives us TypeScript types** — we get the flexibility of MongoDB with compile-time safety.

---

# 9. Judge Questions and Answers

**Architecture**

1. **"Walk me through a request from the user clicking Login to getting a response."**
   Frontend sends `POST /api/auth/login` with email + password. Express router matches the path. The login handler queries MongoDB via the User model, calls `comparePassword()` (bcrypt), signs a JWT, and returns it. The frontend stores the token and uses it in future requests.

2. **"What does your middleware do?"**
   The `protect` middleware reads the Authorization header, extracts the Bearer token, verifies it with `jwt.verify()`, and attaches `userId` + `userRole` to the request. If the token is missing or invalid, it returns 401 immediately without calling the route handler.

3. **"How do roles work in your system?"**
   Users have a `role` field: `"user"` or `"owner"`. The `requireRole('owner')` middleware guards owner-only routes like creating a spot or viewing earnings.

4. **"What happens if MongoDB goes down?"**
   The Express server would fail to connect on startup and exit (we have a guard in `config.ts`). In production we would use MongoDB Atlas with replica sets for high availability — automatic failover if one node goes down.

5. **"How is your API structured?"**
   RESTful API over HTTP. Resources: `/api/auth`, `/api/spots`, `/api/bookings`, `/api/owner`, `/api/captive`, `/api/reviews`. Standard HTTP verbs (GET, POST, PATCH, DELETE) map to CRUD operations.

**Database**

6. **"Why not use PostgreSQL?"**
   MongoDB suited our use case better — our models changed frequently during development (we added monitoring fields, payment breakdowns, and device tracking without any migration files). For a hackathon, this velocity is critical.

7. **"How do you prevent duplicate email registrations?"**
   The `email` field has `unique: true` in the Mongoose schema, which creates a unique index in MongoDB. We also check explicitly with `User.findOne({ email })` before creating, returning a 409 response if found.

8. **"What are the relationships between your collections?"**
   `Booking` references `User`, `WifiSpot`, and `owner` by ObjectId. `CaptiveSession` references `Booking`, `WifiSpot`, and `User`. `Review` references `User`, `WifiSpot`, and `Booking`. These are `ref` fields — Mongoose can `.populate()` them to join documents when needed.

**Authentication**

9. **"How do you store passwords securely?"**
   Passwords are never stored in plain text. We hash them with bcrypt at salt round 12 (computationally expensive, resistant to brute force). The `UserSchema.pre('save')` Mongoose hook ensures this runs automatically every time a password is set.

10. **"What if a JWT token is stolen?"**
    JWTs are stateless — we cannot invalidate them server-side without a token blacklist (not yet implemented). Our tokens expire in 7 days. For production, we would use short-lived access tokens (15 min) plus refresh tokens stored in httpOnly cookies to limit the attack window.

11. **"Why JWT over sessions?"**
    Sessions require the server to store session state (usually Redis). JWTs are self-contained — the backend only needs the `JWT_SECRET` to validate. Stateless auth scales horizontally with no shared session store.

12. **"How does wallet login work?"**
    Wallet connection is additive to our existing JWT auth — it does not replace it. The user logs in with email+password (gets JWT), then connects MetaMask. The frontend gets the wallet address and saves it to the user profile. For a signature-based wallet login, we would have the user sign a message client-side and verify it server-side using `ethers.verifyMessage()`.

**Blockchain**

13. **"What smart contracts did you write?"**
    - `AirlinkMarketplace.sol` — main contract: registers spots, handles bookings, holds ETH in escrow, auto-splits payments (98% owner, 2% platform fee).
    - `WiFiRegistry.sol` — on-chain registry of hotspot metadata.
    - `AirlinkAccessNFT.sol` — ERC-721 NFT minted as an access pass per booking.
    - `PaymentEscrow.sol` — escrow logic for holding and releasing ETH.

14. **"What is the platform fee?"**
    2% (200 basis points out of 10,000). Defined as `PLATFORM_FEE_BPS = 200` in the contract. Applied automatically at payment time — the owner receives 98%, the platform receives 2%.

15. **"What is an NFT access pass and why use it?"**
    An ERC-721 token minted to the user's wallet when a booking is confirmed. The captive portal gateway calls `ownerOf(tokenId)` on the contract to check ownership. If the user holds the token and the booking is active, they get internet access. No passwords to share, no fraud possible.

16. **"What happens to the ETH if a booking is cancelled?"**
    The `AirlinkMarketplace` contract handles cancellation logic. Funds are held in escrow in the contract itself. On cancellation (within a valid window), ETH is refunded to the user. On completion, ETH is released to the owner minus platform fee.

17. **"How do you test the smart contracts?"**
    We use Hardhat — a local Ethereum development environment. `AirlinkMarketplace.test.ts` and `AirlinkV2.test.ts` in the `test/` folder run unit tests against a local blockchain. We run `npx hardhat test` to execute them.

**Scalability & Security**

18. **"How would you scale this to 10,000 users?"**
    Backend: deploy multiple Express instances behind a load balancer (stateless JWT means any instance can serve any request). MongoDB Atlas scales horizontally with sharding. Blockchain: use Layer 2 networks (Polygon, Arbitrum) to reduce gas costs and increase throughput.

19. **"Is the WiFi password safe in your database?"**
    The `wifiPassword` field in `WifiSpot` is noted as encrypted at rest in our codebase. Credentials are only revealed after a confirmed, paid booking — the `wifiCredentialsRevealed` flag in `Booking` controls this. We would use AES encryption with a server-managed key for production.

20. **"What prevents someone from faking a booking to get free WiFi?"**
    Two checks: (1) MongoDB booking record must have `status: "active"` and `paymentStatus: "paid"` — only set after ETH payment is confirmed on-chain. (2) The NFT access pass is minted on-chain after payment — the gateway verifies wallet ownership of the NFT. Both must be valid simultaneously.

21. **"How are CORS and security handled in the backend?"**
    We have a strict CORS whitelist in `server.ts` — only the configured frontend URL and private LAN addresses are allowed. ngrok tunnels are also whitelisted for demo purposes. Protected routes require a valid JWT. Role-based middleware prevents privilege escalation.

22. **"What is your gas cost per booking?"**
    On Ethereum mainnet this would vary with network congestion. For production we would deploy on Polygon (MATIC) where gas fees are fractions of a cent, making micro-payments for WiFi economically viable.

**Product & Vision**

23. **"Who are your competitors?"**
    Centralised: telecom roaming plans, commercial hotspot providers. Decentralised: no direct equivalent. We combine the marketplace model (Airbnb-style) with blockchain-verified access — that combination does not exist at scale today.

24. **"How does a hotspot owner physically set this up?"**
    They install our gateway software on a router that supports OpenWrt. The gateway registers the router's MAC address, links it to their on-chain spot registration, and starts intercepting new connections. We plan to provide a one-click installer script.

25. **"What is your go-to-market strategy?"**
    Target college campuses and co-working spaces first — high-density environments where portable hotspot owners and data-hungry users are concentrated. For Round 1 we are validating the core product; monetisation strategy matures in later rounds.

---

# 10. 30-Second Pitch

> "Airlink is a peer-to-peer WiFi marketplace. Think Airbnb, but for internet access. Hotspot owners list their unused mobile data or home WiFi, set a price per hour, and users can discover, book, and connect — all through our platform. We use Ethereum smart contracts to hold payments in escrow and mint NFT access passes, so the whole system is trustless: no middleman controls the money, and no one can fake a booking. The router runs our open-source gateway software, which checks the user's NFT pass on-chain and grants internet access automatically. We are solving a real problem — people already have bandwidth, other people need it, and right now there is no secure, fair way to connect them."

---

# 11. Key Technical Terms Cheat Sheet

| Term | Simple Explanation |
|---|---|
| **API** | A set of URLs your app exposes so other programs can interact with it. Like a waiter taking your order to the kitchen. |
| **REST** | A standard style for designing APIs using HTTP methods (GET, POST, PUT, DELETE) and meaningful URLs. |
| **Middleware** | Code that runs between receiving a request and sending a response. Used for auth checks, logging, parsing request body. |
| **Schema** | The definition/blueprint of what a document looks like — fields, types, required/optional, validation rules. |
| **Model** | A JavaScript/TypeScript class built from a schema. You call methods on it to query/write the database (e.g. `User.findOne(...)`). |
| **Controller** | The function that contains actual business logic — reads the request, calls the model, returns the response. |
| **Blockchain** | A distributed, immutable ledger of transactions maintained by thousands of computers, with no single owner. |
| **Smart Contract** | A self-executing program deployed on the blockchain. Runs automatically when its conditions are triggered. Cannot be altered after deployment. |
| **Wallet** | A pair of cryptographic keys. The public key (address) is your on-chain identity. The private key signs transactions and must never be shared. |
| **Gas** | The fee paid to the Ethereum network to execute a transaction or run contract code. Measured in Gwei (fractions of ETH). |
| **JWT** | JSON Web Token — a signed, encoded string that proves who a user is without needing a server-side session. |
| **bcrypt** | A password hashing algorithm designed to be slow (resistant to brute force). We use salt rounds of 12. |
| **NFT (ERC-721)** | A unique, non-fungible token on Ethereum. Proves ownership of one specific item — in our case, a WiFi access pass. |
| **Escrow** | Funds held by a neutral party (our smart contract) and released only when conditions are met. |
| **Captive Portal** | The login page shown when you connect to a network that requires authentication before granting internet access. |