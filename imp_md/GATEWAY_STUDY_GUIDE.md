# AirLink Gateway — Complete Study Guide

> This document covers everything you need to confidently explain the gateway architecture to judges. Read every section at least once before presenting.

---

# 1. Gateway Overview

## What Is a Gateway?

A **gateway** is a device or program that sits at the boundary between two networks and controls what traffic is allowed to pass between them.

Think of it as a **security checkpoint at an entrance**:
- Everyone can walk up to the gate.
- Only people with valid tickets are allowed through.
- The guard (gateway) checks the ticket, not the event organiser (backend).

In networking terms:
- A gateway inspects incoming and outgoing network packets.
- It enforces rules about who can go where.
- It can redirect, block, allow, or log traffic depending on conditions.

## Why Are Gateways Used in Network Systems?

- **Access Control** — A company uses a gateway to ensure only authenticated employees can reach internal systems.
- **Traffic Management** — ISPs use gateways to route data between different networks.
- **Captive Portals** — Hotels and airports use gateways to force users through a login page before granting internet access.
- **Security** — A gateway acts as a firewall, stopping unauthorised traffic before it enters the network.

## The Role of Our Gateway in Airlink

Our gateway is the **last mile enforcement point** between the user's device and the internet.

- The **backend** manages users, bookings, and payments — it is the business logic brain.
- The **blockchain** holds payment escrow and NFT access passes — it is the trustless financial layer.
- The **gateway** enforces access at the network level on the hotspot owner's machine — it is the physical access controller.

Without the gateway, a user could simply connect to the hotspot WiFi and use the internet with no payment, because WiFi itself does not have business logic. The gateway closes this gap.

---

# 2. Role of the Gateway in Our Project

## Why the Gateway Is Necessary

When a user connects to a mobile hotspot on Windows (or any hotspot), connecting to the WiFi network does **not** mean the user has internet access. It just means they are on the local network. The gateway exploits this gap:

1. The user joins the hotspot's local network (gets a local IP address like `192.168.137.x`).
2. By default, the gateway **blocks** all outbound internet packets from that IP.
3. The user must authenticate through the captive portal to have their IP **allowed** through the firewall.
4. If the user never pays or their booking expires, they stay blocked — they can reach only the portal page.

## Why the Backend Alone Cannot Control WiFi Access

This is a critical point judges will ask about.

The backend is a web server running in the cloud (or on a machine). It can:
- Verify payments
- Store bookings
- Issue access tokens

But it **cannot**:
- Physically open or close a network interface
- Modify the firewall rules on the hotspot owner's machine
- Intercept network traffic between a device and the router

Only a program running **on the machine that is sharing the WiFi** can do those things. That is the gateway. It runs locally on the hotspot owner's laptop or router and has operating system-level permissions to:
- Add and remove Windows Firewall rules
- Intercept DNS queries
- Block or allow specific IP addresses

## How the Gateway Interacts with Routers and Clients

Our current implementation runs on **Windows Mobile Hotspot** (the owner's laptop acts as both the router and the gateway):

```
User's Phone/Laptop
        |
   (WiFi connection)
        |
   Owner's Laptop
   ├── Windows Mobile Hotspot (acts as router/AP)
   ├── gateway.js (Express HTTP server on port 8080)
   ├── dns-redirect.js (UDP DNS server on port 53)
   └── Windows Firewall (blocks/allows IP addresses)
        |
   (internet connection — 4G/5G data or home broadband)
        |
     Internet
```

- The owner's laptop has **two network interfaces**: one facing the internet (4G, home WiFi, or ethernet) and one facing the hotspot clients (the virtual adapter created by Mobile Hotspot).
- Windows automatically does **NAT** (Network Address Translation) to share the internet connection across both interfaces.
- Our gateway adds firewall rules to block or allow traffic that passes through the hotspot interface.

---

# 3. Captive Portal System

## What Is a Captive Portal?

A **captive portal** is the login page you see automatically when you connect to hotel WiFi, airport WiFi, or a coffee shop network.

When you open your browser (or even just turn on WiFi), the operating system tests whether you have real internet access. If the portal intercepts this test, your OS shows a popup or redirects your browser to the login page — you are "captured" in a portal before getting through to the real internet.

It is called "captive" because your traffic is held captive until you authenticate.

## How Every Device Detects a Captive Portal

Operating systems periodically send **probe requests** to known test URLs to check internet connectivity:

| Operating System | Probe URL | Expected Response |
|---|---|---|
| iOS / macOS | `http://captive.apple.com/hotspot-detect.html` | HTML with "Success" |
| Android / Chrome | `http://connectivitycheck.gstatic.com/generate_204` | HTTP 204 No Content |
| Windows | `http://www.msftconnecttest.com/ncsi.txt` | Plain text "Microsoft NCSI" |
| Firefox | `http://detectportal.firefox.com/success.txt` | "success" text |

If the response to these probes is **redirected** somewhere else (our gateway), the OS knows there is a captive portal and either shows a popup or opens the system browser to the portal page.

## How Our Project Implements the Captive Portal

Our `gateway.js` intercepts all of these probe URLs. When a new (unauthenticated) device connects to the hotspot:

1. The device's OS sends one of the probe requests.
2. The gateway catches it and redirects the browser to `http://192.168.137.1:8080/`.
3. The gateway serves a self-contained HTML portal page directly from memory (no internet needed).
4. The user enters their **access token** (16 characters) or **OTP** (6 digits).
5. After successful authentication, the gateway tells the OS "you have internet now" by returning `204 No Content` or `"Success"` — the captive portal popup disappears.

The gateway also optionally runs a **DNS redirect server** (`dns-redirect.js`) on port 53. This intercepts ALL DNS queries from unauthenticated devices and resolves every domain name to the gateway IP address. This means that even if the OS does not auto-detect the portal, the moment a user types any URL in a browser, they will land on the gateway's portal page.

## How Users Are Redirected to the Portal

There are two mechanisms in our system:

**Mechanism 1 — OS Captive Portal Detection (Automatic)**
- The phone's OS automatically detects the captive portal using the probe URLs above.
- A system popup or browser window opens automatically.
- No action needed from the user.

**Mechanism 2 — DNS Hijacking (Targeted)**
- `dns-redirect.js` intercepts DNS queries from the hotspot's subnet.
- Every domain query (`google.com`, `youtube.com`, etc.) resolves to `192.168.137.1`.
- The user's browser connects to the gateway instead of the real website.
- The gateway serves the portal page.
- After authentication, DNS queries are forwarded to the real DNS server (`8.8.8.8`).

---

# 4. Access Control Mechanism

## Complete Step-by-Step Flow

### Step 1 — User Connects to WiFi
- The user connects to the hotspot (e.g., named "AirLink-Hotspot").
- Windows DHCP assigns the user's device an IP address (e.g., `192.168.137.45`).
- The device is now on the local network but cannot reach the internet.
- By default, gateway firewall rules block all outbound internet traffic from this new IP.

### Step 2 — Gateway Intercepts the Request
- The device's OS sends a captive portal detection probe (e.g., `GET /generate_204`).
- The DNS redirect server ensures that any DNS query resolves to the gateway IP (`192.168.137.1`).
- The request reaches `gateway.js` running on port 8080.
- The gateway checks its in-memory `authenticatedClients` map. The IP is not there yet.

### Step 3 — Captive Portal Redirect
- The gateway responds with `HTTP 302 Redirect` pointing to `http://192.168.137.1:8080/`.
- The OS/browser follows the redirect and loads the portal HTML page.
- The portal page is served entirely inline from gateway.js — no internet connection needed to load it.
- The page shows two tabs: **Access Token** (16-char code) and **OTP** (6-digit code).

### Step 4 — User Authentication
- The user enters their access token or OTP (received in booking confirmation email).
- The portal form submits a `POST` request to `http://192.168.137.1:8080/api/gateway/authenticate` with the token.
- This is a **local HTTP request** — it goes to the gateway running on the same machine as the hotspot.
- The gateway does NOT validate the token itself — it proxies the request to the backend.

### Step 5 — Payment Verification
- The gateway calls `POST /api/captive/authenticate` on the backend server.
- The backend queries MongoDB for a booking where:
  - `accessToken` matches the submitted token (or `accessTokenOTP` matches the OTP)
  - `wifiSpot` matches the current spot ID
  - `paymentStatus` is `"paid"`
  - `status` is `"confirmed"` or `"active"`
  - `startTime` is in the past and `endTime` is in the future (session is currently valid)
- If all conditions are met, the backend creates a `CaptiveSession` record and returns a session token with an expiry time.
- If any condition fails (e.g., booking expired, payment not confirmed), the backend returns `401`.

### Step 6 — Gateway Validates Token
- If the backend returned success, the gateway:
  - Stores the client's IP in the `authenticatedClients` in-memory Map.
  - Calls `allowIP(clientIP)` which runs a Windows Firewall command.
  - Writes the authenticated IP to a shared `.authenticated-ips.json` file (used by the DNS server).
- The firewall command executed is:
  ```powershell
  netsh advfirewall firewall add rule name="AirLink_Allow_192_168_137_45"
    dir=in action=allow remoteip=192.168.137.45 enable=yes
  ```
- All previous block rules for that IP are deleted first.

### Step 7 — Internet Access Granted
- The gateway returns success to the browser with the session expiry time.
- The portal page shows a countdown timer showing remaining session time.
- The gateway now responds to captive portal probe URLs with the expected "success" responses (204, "Microsoft NCSI", etc.) — the OS's captive portal popup disappears.
- The user now has full internet access through the hotspot.
- **Automatic expiration**: Every 30 seconds, the gateway loops through `authenticatedClients`, re-validates each session token with the backend, and calls `blockIP()` for any expired session.

---

# 5. Gateway Services

## 5.1 Session Management
**What it does:** The gateway maintains an in-memory `Map<IP, SessionData>` where each entry holds the session token, expiry time, and authentication timestamp.

**Why it's necessary:** Without tracking active sessions, the gateway cannot know which devices should have internet access at any point in time. Sessions tie the user's booking (from the backend) to their device's IP address (on the local network).

**How it works in our code:** `authenticatedClients` in `gateway.js` is a JavaScript `Map`. On successful authentication, an entry is added. On expiry or manual disconnect, it is removed and the firewall rule is updated.

## 5.2 Token Validation
**What it does:** When a user submits a token, the gateway sends it to the backend's `/api/captive/authenticate` endpoint and waits for a response.

**Why it's necessary:** The gateway itself does not have access to the database — it does not know which tokens are valid. The backend owns the booking data. The gateway is purely the enforcer; the backend is the authority.

**How it works in our code:** `validateTokenWithBackend(accessToken, otp)` in `gateway.js` uses `node-fetch` to make a POST request to the backend with the spotId and token. The backend checks MongoDB and returns either a `sessionToken` or an error.

## 5.3 Access Expiration
**What it does:** Every 30 seconds, the gateway runs a background check (`SESSION_CHECK_INTERVAL = 30000`). It loops through every authenticated IP, calls the backend to verify the session is still valid, and blocks the device if the session has expired.

**Why it's necessary:** Bookings are time-limited (e.g., 1 hour). Without expiration enforcement, a user could pay for 1 hour and remain connected indefinitely. The periodic check ensures access is revoked promptly.

**How it works in our code:** A `setInterval` calls `validateSessionWithBackend(sessionToken)` for each active client. If the backend returns `authenticated: false`, the gateway removes the IP from `authenticatedClients` and calls `blockIP(ip)`.

## 5.4 Device Tracking
**What it does:** Each device is identified by its IP address on the hotspot subnet. The gateway maps IP → session data. The backend stores device information (IP, MAC address, device type, user agent) in the `CaptiveSession` MongoDB collection.

**Why it's necessary:** Tracking devices allows the platform to:
- Enforce maximum device limits per booking (e.g., limit to 3 devices per booking).
- Attribute bandwidth usage to specific users.
- Detect and block suspicious behaviour (e.g., one token being used from two different devices simultaneously).

**How it works in our code:** The backend's `/api/captive/authenticate` handler counts `CaptiveSession` documents for the booking and rejects authentication if the device limit is reached.

## 5.5 Bandwidth Control
**What it is (theoretical for our project):** A fully implemented gateway can monitor how much data each device uses and throttle or cut off devices that exceed their purchased amount.

**Why it's necessary:** Without bandwidth limits, one user could consume the entire hotspot's data allowance, leaving nothing for others. Fair usage enforcement is essential for a commercial platform.

**Planned approach:** The `CaptiveSession` model in MongoDB has a `dataUsedMB` field. In a production deployment on a router (e.g., OpenWrt), tools like `tc` (traffic control) or `iptables` with traffic accounting could enforce per-IP bandwidth limits and report usage back to the backend.

## 5.6 Logging and Monitoring
**What it does:** Every significant event is logged to the console: authentication attempts, successes, failures, IP blocks/allows, session expirations, and disconnects.

**Why it's necessary:** Logs allow the hotspot owner to see what is happening in real time and help diagnose issues. In production, logs would be shipped to a centralised logging system so platform operators can monitor all gateways across all hotspots.

**What our code logs:** `gateway.js` logs with emoji indicators — `🔑` for auth attempts, `✅` for successful connections, `❌` for failures, `🔄` for redirects, `📴` for disconnections.

---

# 6. Interaction with Backend

## How the Gateway Communicates with the Backend

The gateway calls the backend's REST API over HTTP. This is a **server-to-server call** — the gateway is the client, the backend is the server.

The base URL is configurable: `--backend http://localhost:3000` (or the deployed backend URL).

## API Calls Made by the Gateway

| Gateway Action | Backend Endpoint | Method | Purpose |
|---|---|---|---|
| Validate access token/OTP | `POST /api/captive/authenticate` | POST | Check if token is valid for the spot and booking, get session token |
| Validate existing session | `POST /api/captive/validate` | POST | Periodic check to see if a session is still active |
| Disconnect session | `POST /api/captive/disconnect` | POST | Tell the backend the user has disconnected |
| Fetch spot info | `GET /api/captive/detect/:spotId` | GET | Get spot name/address to display on the portal page |

## Authentication Verification Flow

```
Gateway receives token submission from user
    |
    v
gateway.js → POST /api/captive/authenticate
    |
    v
Backend queries MongoDB:
  - Find booking where:
      accessToken = submitted token
      wifiSpot = SPOT_ID
      paymentStatus = "paid"
      status = "confirmed" or "active"
      startTime <= now <= endTime
    |
    +-- Not found → 401 → Gateway blocks IP
    |
    +-- Found → Create CaptiveSession in MongoDB
              → Return { sessionToken, expiresAt }
              → Gateway stores in authenticatedClients Map
              → Gateway runs allowIP() firewall command
```

## Token Validation for Periodic Checks

Every 30 seconds, the gateway calls `POST /api/captive/validate` with the stored `sessionToken` for each authenticated device. The backend looks up the `CaptiveSession` document:
- If it exists and `expiresAt > now` → returns `{ authenticated: true, expiresAt }`
- If expired or deleted → returns `{ authenticated: false }`

On receiving `authenticated: false`, the gateway immediately blocks the IP.

## Access Status Checks

The gateway also exposes its own status endpoint for the portal page:
- `GET /api/gateway/status` — returns whether the requesting IP is authenticated and how many seconds remain.
- The portal page polls this to update the countdown timer displayed to the user.

---

# 7. Interaction with Blockchain

## Why Blockchain Connects to the Gateway

In our full system design, payment confirmation and access rights are verified on-chain — not just in the database. This prevents fraud: even if the backend database were compromised, a user still needs a valid NFT in their wallet to get network access.

## Payment Confirmation

When a user books a WiFi spot:
1. The frontend calls `AirlinkMarketplace.bookSpot(spotId, hours)` via MetaMask, sending ETH.
2. The smart contract holds the ETH in escrow and emits a `BookingCreated` event.
3. The backend listens for this event and marks the booking as `paymentStatus: "paid"` in MongoDB.
4. When the gateway calls `/api/captive/authenticate`, the backend checks that `paymentStatus = "paid"` — which was only set after the on-chain event was confirmed.
5. This means no on-chain payment = no database flag = no gateway access.

## NFT Access Pass

When a booking is confirmed by the smart contract:
1. `AirlinkAccessNFT.sol` (ERC-721) mints an NFT to the user's wallet address.
2. The token ID is stored in the `Booking` document in MongoDB (`tokenId` field).
3. During gateway authentication, the backend (or future gateway code) can call `ownerOf(tokenId)` on the contract via `ethers.js` to confirm the user still holds the NFT.
4. Since NFTs are held in the user's wallet, they cannot be forged — only the actual wallet owner can prove they hold the token.
5. When the session ends, the NFT is burned — permanently revoking the access credential.

## What Stays On-Chain vs Off-Chain

| Data | Location | Reason |
|---|---|---|
| ETH payment | Smart contract escrow | Trustless — no one can take the money without conditions being met |
| NFT access pass | Ethereum blockchain | Cryptographically proves ownership — cannot be forged |
| Spot registry | `WiFiRegistry.sol` | Permanent, censorship-resistant record of legitimate hotspots |
| Access token (string) | MongoDB only | Changes every booking — too expensive and slow to store on-chain |
| Session expiry time | MongoDB only | Changes every second — on-chain storage is prohibitively expensive |
| Device IP tracking | Gateway memory + MongoDB | Ephemeral, local data — no reason to put on-chain |
| Authentication logs | MongoDB | Off-chain for speed and cost; only the payment outcome needs to be on-chain |

**Rule of thumb:** Put on-chain only what needs to be **trustless, permanent, and publicly verifiable**. Put off-chain everything that changes frequently, is private, or does not need decentralisation.

---

# 8. Deployment Architecture

## Where Does the Gateway Run?

### Current Implementation (Hackathon / Demo)
The gateway runs on the **hotspot owner's Windows laptop**. The owner's machine:
- Shares its internet via Windows Mobile Hotspot (creates a virtual WiFi AP).
- Runs `gateway.js` on port 8080 (the captive portal HTTP server).
- Runs `dns-redirect.js` on port 53 (the DNS hijacking server).
- Applies Windows Firewall rules via `netsh advfirewall`.

This requires the script to run as **Administrator** — only admin processes can modify firewall rules and bind to port 53.

### Production Options

| Deployment Target | Description | Pros | Cons |
|---|---|---|---|
| **Owner's router (OpenWrt)** | Gateway software installed directly on the router's firmware | Most professional, fully isolated, no laptop needed | Requires router with OpenWrt support, more complex setup |
| **Mini PC (Raspberry Pi)** | Small embedded computer sits between the router and the hotspot | Cheap, dedicated hardware, easy to configure, portable | Needs extra hardware |
| **Hotspot device (4G router)** | Custom firmware on a pocket WiFi device | All-in-one portable solution | Limited to specific hardware |
| **Edge server (cloud VM)** | Gateway logic runs on a cloud server; router tunnels traffic to it | Centralised management, easy updates | Higher latency, internet required to authenticate |

### How the Gateway Connects to Other Components

```
                    ┌─────────────────────────────────────────┐
                    │        Owner's Laptop / Gateway Device  │
                    │                                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │  gateway.js (port 8080)          │   │
                    │  │  dns-redirect.js (port 53)       │   │
                    │  │  Windows Firewall rules          │   │
                    │  └─────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
                          │                  │
              ┌───────────┘                  └──────────────┐
              │                                              │
              ▼                                              ▼
   ┌─────────────────────┐                    ┌──────────────────────┐
   │ Backend Server      │                    │  Ethereum Blockchain │
   │ (Express + MongoDB) │                    │  (Smart Contracts)   │
   │ Validates tokens    │                    │  Verifies NFT        │
   │ Manages sessions    │                    │  Holds ETH escrow    │
   └─────────────────────┘                    └──────────────────────┘
              |
   ┌──────────────────────┐
   │  User Devices        │
   │  (phones, laptops)   │
   │  Connected to hotspot│
   └──────────────────────┘
```

**Gateway ↔ Backend:** HTTP REST API calls over the local network or internet. The backend URL is configurable (`--backend` flag). Could be `localhost:3000` for testing or a deployed server URL for production.

**Gateway ↔ Blockchain:** In the current implementation, the gateway delegates blockchain verification to the backend. In a fully decentralised version, the gateway would run an `ethers.js` instance and call the NFT contract directly to verify access passes.

**Gateway ↔ User Devices:** Local network communication. The user's device connects to the hotspot and communicates with the gateway via `192.168.137.1:8080`.

---

# 9. Networking Concepts Needed

## 9.1 DHCP — Dynamic Host Configuration Protocol
**What it is:** The protocol that automatically assigns IP addresses to devices when they connect to a network.

**How it works:** When your phone connects to WiFi, it sends a broadcast: "I need an IP address." The DHCP server (usually the router) responds: "Your IP is 192.168.137.45, the router is at 192.168.137.1, and your DNS server is 192.168.137.1."

**In our system:** Windows Mobile Hotspot acts as a DHCP server. It assigns IPs in the range `192.168.137.x` to connected devices and tells them to use `192.168.137.1` as both their gateway (router) and DNS server — which is the owner's machine where our gateway and DNS redirect server are running.

## 9.2 DNS — Domain Name System
**What it is:** The internet's phonebook. When you type `google.com`, DNS translates it to an IP address like `142.250.194.206` so your computer knows where to connect.

**How it works:** Your device asks a DNS server "what is the IP of google.com?" The DNS server looks it up and replies with the IP address. Your device then connects to that IP.

**In our system:** `dns-redirect.js` runs a DNS server on port 53. For unauthenticated devices, it intercepts every DNS query and returns the gateway's own IP (`192.168.137.1`) as the answer for every domain. This means when the user types `google.com`, their browser connects to the gateway machine — which serves the portal page. For authenticated devices, DNS queries are forwarded normally to `8.8.8.8` (Google's public DNS).

## 9.3 NAT — Network Address Translation
**What it is:** A technique that allows many devices with private IP addresses to share one public IP address when accessing the internet.

**How it works:** Your home router has one public IP (e.g., `203.0.113.5`). All your devices have private IPs (`192.168.1.x`). When your phone requests a webpage, the router translates the source IP to the public IP before sending the packet to the internet, and translates back when the response arrives.

**In our system:** Windows automatically performs NAT when Mobile Hotspot is enabled. Connected devices use private IPs (`192.168.137.x`) but share the owner's internet connection. The gateway controls which private IPs are allowed to participate in this NAT process.

## 9.4 Packet Filtering
**What it is:** Inspecting network packets and deciding whether to allow or drop them based on rules such as source IP, destination IP, port, or protocol.

**How it works:** A firewall maintains a list of rules. Each incoming or outgoing packet is matched against the rules. If a rule matches, the specified action (allow or block) is applied.

**In our system:** Windows Firewall is the packet filter. Our `gateway.js` programmatically adds rules like:
- Block all traffic from `192.168.137.45` (new, unauthenticated device)
- Allow all traffic from `192.168.137.45` (after successful token validation)

These rules are created using `netsh advfirewall firewall add rule` commands executed via PowerShell.

## 9.5 Firewall Rules
**What they are:** Specific instructions that tell the operating system's firewall what to do with network packets.

**How they work in our system:**
```
Rule Name : AirLink_Block_192_168_137_45
Direction : Inbound (from the hotspot adapter)
Action    : Block
Remote IP : 192.168.137.45
```

- **Inbound direction** is used because, from the owner's laptop perspective, packets arriving from connected devices come IN through the hotspot network interface before being forwarded to the internet.
- When a device authenticates, the block rule is deleted and a matching allow rule is added.
- On gateway shutdown, all AirLink firewall rules are cleaned up automatically.

---

# 10. Scalability

## Current Limitations
Our current implementation is designed for a single hotspot owner running the gateway on their personal Windows laptop. This is appropriate for Phase 1 (hackathon/demo) but has limits:
- One gateway instance per laptop.
- In-memory session store — restarting the gateway loses all session state.
- Windows-specific firewall commands — not portable to Linux or router firmware without code changes.

## How the Gateway System Could Scale

### Horizontal Scaling (More Hotspots)
Each hotspot owner runs their own gateway instance. The backend is shared (centralised cloud server). As more owners join the platform, more gateway instances come online independently — this is inherently horizontally scalable.

### Persistent Session Storage
Replace the in-memory `authenticatedClients` Map with a Redis store. Redis is an in-memory database with network access. If the gateway crashes and restarts, it reconnects to Redis and recovers all active sessions without kicking users off.

### Centralised Management
A gateway management dashboard where owners can:
- See real-time connection counts per spot.
- Remotely revoke access for specific devices.
- Configure bandwidth limits per booking tier.

### Router/OpenWrt Deployment
Moving the gateway from a laptop to dedicated router firmware:
- The gateway runs continuously without needing a laptop on.
- `iptables` (Linux firewall) replaces Windows Firewall commands — more powerful and efficient.
- Traffic shaping (`tc qdisc`) enables per-user bandwidth throttling.
- Better suited for 24/7 commercial operation.

### Layer 2 Blockchain (Reduced Gas Costs)
For scale, deploy smart contracts on Polygon or Arbitrum instead of Ethereum mainnet. Gas fees drop from dollars to fractions of a cent — making micro-transactions for short WiFi sessions economically viable.

---

# 11. Security Considerations

## Risk 1 — Unauthorised Access (Token Theft)

**Threat:** A malicious user steals another user's access token from an email or intercepted network traffic.

**Possible attack:** The attacker connects to the hotspot and enters the stolen token to get free internet access.

**Mitigation:**
- Tokens are single-use per device — once a `CaptiveSession` is created for a device, the same token cannot create a second session on a different device.
- The booking model enforces maximum device limits per booking (checked via `CaptiveSession.countDocuments`).
- OTP fallback codes expire quickly (time-limited).
- HTTPS for the booking flow ensures tokens in transit cannot be intercepted (the portal page itself is over HTTP on the local network, but token issuance happens over HTTPS on the main site).

## Risk 2 — Token Misuse (Sharing Codes)

**Threat:** A user shares their access token with friends, allowing more devices than paid for.

**Mitigation:**
- Device count is enforced at the backend level — the `CaptiveSession` collection is queried every time a token is used and authentication is rejected if the device limit is reached.
- The platform fee model incentivises honest usage: users who paid for one device benefit by not sharing.

## Risk 3 — Network Abuse (Bypassing the Portal)

**Threat:** A technically sophisticated user sets their IP address to one that is already in the firewall's allowed list, bypassing authentication completely.

**Mitigation:**
- Firewall rules are based on IP address, which is assigned by the DHCP server. A client can request a specific IP, but the DHCP server can be configured to only honour requests from known MAC addresses.
- In a production deployment, MAC address filtering adds a second layer — IP + MAC must both match.
- The gateway periodically re-validates all sessions with the backend, so an allowed IP that corresponds to an expired session will be blocked within 30 seconds.

## Risk 4 — Command Injection

**Threat:** The firewall rules are generated using string concatenation with the client IP address. A crafted IP could inject malicious commands.

**Mitigation:**
- IP addresses are extracted from the HTTP socket connection — they are assigned by the operating system's network stack, not from user-supplied input. A user cannot inject an arbitrary string as their IP.
- Rule names are derived from sanitised IP addresses with `.` replaced by `_`.

## Risk 5 — Gateway Downtime

**Threat:** If the gateway crashes, what happens to connected users? If no blocking rules exist, do all devices get free internet?

**Mitigation:**
- Our default-block policy runs at startup — `setupDefaultBlock()` cleans up stale rules and the default posture is "block new devices."
- On shutdown (`SIGINT`/`SIGTERM`), the gateway runs `cleanupFirewallRules()` to remove all allow rules, ensuring no device retains access after the gateway exits.

---

# 12. Possible Judge Questions and Strong Answers

**Q1: Why do you need a gateway? Can't the backend just control access?**

The backend is a cloud web server — it has no ability to interact with the Windows Firewall on a hotspot owner's laptop. Only a process running locally on the machine sharing the WiFi can add and remove firewall rules, intercept DNS requests, or block/allow network traffic at the OS level. The gateway is our locally-installed enforcer; the backend is the authority that tells the enforcer what to do.

---

**Q2: What is a captive portal and how does yours work?**

A captive portal is a login page that appears automatically when you connect to a network — like hotel WiFi. Our gateway intercepts the OS-level connectivity probe that every phone and laptop sends when connecting to WiFi (e.g., Android's `/generate_204`, Apple's `/hotspot-detect.html`). We redirect these probes to our local HTTP server, which serves a portal page asking for the user's access token. Once authenticated, we return the expected success responses and the OS stops showing the portal popup.

---

**Q3: How does token verification work end-to-end?**

1. User submits the 16-character token on the portal page.
2. The portal sends it `POST /api/gateway/authenticate` — to the gateway running locally.
3. The gateway forwards it `POST /api/captive/authenticate` — to the backend server.
4. The backend queries MongoDB for a booking matching the token with `paymentStatus: "paid"` and a valid time window.
5. If found, the backend creates a `CaptiveSession` record and returns a session token with expiry time.
6. The gateway adds a Windows Firewall allow rule for the device's IP.
7. The user now has internet access.

---

**Q4: How do you prevent someone from just skipping the portal and using the internet?**

New devices that connect to our hotspot have no firewall allow rule — by default they can reach only our gateway server on port 8080. Without an allow rule, Windows drops their outbound internet packets. The only way to get an allow rule is to successfully authenticate with a valid, paid booking token. There is no way to bypass this at the network layer without physical control of the gateway machine.

---

**Q5: What happens when a booking expires?**

The gateway runs a background validation loop every 30 seconds. It calls the backend for every authenticated device and asks "Is this session still valid?" When the booking's `endTime` passes, the backend marks the session as expired and returns `authenticated: false`. The gateway immediately removes the device's IP from its in-memory list and runs the Windows Firewall block command. The user loses internet access and would see a reconnect prompt if they try to load a page.

---

**Q6: What is the role of DNS in your captive portal?**

DNS is the mechanism that makes the captive portal appear automatically. Our `dns-redirect.js` server listens on port 53 (the standard DNS port). It intercepts every DNS query from unauthenticated devices and returns our gateway IP as the answer for every domain. So when the user opens any webpage, their browser connects to us instead of the real site — landing them on the portal. Once authenticated, DNS queries are forwarded to a real DNS server (Google's 8.8.8.8).

---

**Q7: Why do you run an HTTP server rather than HTTPS for the portal?**

This is intentional and necessary. The captive portal page is served before the user has internet access. They cannot load external HTTPS certificates or reach any CDN. More importantly, if the portal were served over HTTPS, the browser's Mixed Content policy would block all `fetch()` calls to our HTTP gateway endpoints — authentication would silently fail. Since everything (portal page + gateway API) runs on the same HTTP origin on the local network, there are no cross-origin or mixed content issues.

---

**Q8: How does the NFT access pass connect to the gateway?**

When a booking is confirmed on-chain (the ETH payment is processed by the `AirlinkMarketplace` contract), an ERC-721 NFT is minted to the user's wallet address. This NFT is the user's on-chain proof of purchase. The gateway (via the backend) can call `ownerOf(tokenId)` on the `AirlinkAccessNFT` contract to verify the user still owns the NFT. This adds a second verification layer beyond just the database — even if the database were manipulated, only the actual wallet holder who received the NFT can prove ownership.

---

**Q9: What is NAT and how does it relate to your system?**

NAT (Network Address Translation) is what allows all hotspot clients to share the owner's single internet connection. Each client has a private IP (192.168.137.x) and the owner's machine translates these to the single public IP before sending traffic to the internet. Our firewall rules control which private IPs are permitted to have their traffic translated and forwarded. Without an allow rule, the packet reaches the hotspot interface but is dropped before it can be NAT'd outward.

---

**Q10: How does the gateway know which device is which?**

Each device is identified by its **IP address** on the hotspot subnet (assigned by DHCP). The gateway maps IP → session data in its `authenticatedClients` Map. The backend also stores the device's IP, MAC address (if available in the request headers), device type, and user agent in the `CaptiveSession` MongoDB collection. In production, MAC address tracking would be used as a more reliable identifier since IPs can change if a device reconnects.

---

**Q11: Can a user use their token on two devices simultaneously?**

The backend enforces a device limit per booking. When a token is used for authentication, `CaptiveSession.countDocuments({ booking: bookingId, isActive: true })` is called. If the count equals or exceeds the booking's device limit, authentication is rejected with an error message. The exact limit depends on the booking tier purchased.

---

**Q12: What happens if the backend goes down while the gateway is running?**

Already-authenticated users keep their internet access because the gateway has already added firewall allow rules for their IPs — those rules persist until explicitly removed. New users would fail to authenticate (the gateway cannot reach the backend to validate tokens) and see an error message on the portal page. The periodic session validation loop would also fail, meaning expired sessions might not be cleaned up immediately. For production resilience, the backend would run with redundancy (multiple instances behind a load balancer with MongoDB Atlas replica sets).

---

**Q13: Why does the setup require Administrator privileges?**

Two reasons:
1. **Port 53** — DNS servers must bind to port 53, a "well-known port" below 1024. Operating systems restrict access to these ports to processes running as Administrator for security reasons.
2. **Windows Firewall rules** — `netsh advfirewall firewall add rule` is a system-level command that requires elevated privileges. Without admin rights, the gateway cannot block or allow IP addresses.

---

**Q14: How does the OTP (one-time password) system work as an alternative to the token?**

The booking confirmation email contains both a 16-character access token and a 6-digit OTP. Some users find short numeric codes easier to type on a portal page. The OTP is stored in `booking.accessTokenOTP` in MongoDB. The gateway and backend accept either credential — the token for the primary flow and the OTP as a fallback for simpler entry. Unlike the descriptive name "one-time," in our current implementation the OTP is valid for the entire booking window (though in production we would expire it after first use).

---

**Q15: How do you handle devices that reconnect mid-session?**

If a device disconnects and reconnects, it gets the same IP from DHCP (DHCP leases are cached by MAC address). The gateway's `authenticatedClients` Map still has that IP → session entry and the firewall allow rule is still in place. The device regains internet access immediately without needing to re-authenticate — as long as the session has not expired.

---

**Q16: What is the difference between `gateway.js` and `dns-redirect.js`?**

`gateway.js` is the **HTTP server** — it handles the portal page, token submission, session management, and firewall rules. It operates at the **application layer** (HTTP on port 8080).

`dns-redirect.js` is a **DNS server** — it operates at the **DNS layer** (UDP on port 53) and intercepts domain name queries. It is optional but makes the captive portal appear automatically by resolving all domains to the gateway IP for unauthenticated clients.

Together they cover both discovery (DNS) and enforcement (HTTP + Firewall).

---

**Q17: How would this work on a router instead of a laptop?**

On a Linux-based router running OpenWrt:
- `gateway.js` would run as a system service (using Node.js compiled for the router's CPU architecture or replaced with a similar program in C).
- `iptables` (Linux's firewall) replaces `netsh advfirewall` commands — `iptables -A FORWARD -s 192.168.137.45 -j DROP` blocks an IP.
- DNS hijacking would use `dnsmasq` (already on OpenWrt) configured to redirect all queries to the gateway.
- The advantage: dedicated hardware, always on, no laptop needed, more powerful traffic control.

---

**Q18: Is the WiFi password itself a security layer?**

In our design, the WiFi password is intentionally kept simple and shared openly at the venue (posted on a notice board, for example). The WiFi password is NOT the security mechanism — the captive portal is. This is the same approach used by most enterprise WiFi systems. Everyone can join the "company-wifi" network, but the captive portal or 802.1X authentication controls what they can actually access.

---

**Q19: How does your system compare to traditional captive portals (like hotel WiFi)?**

Traditional captive portals (like hotel WiFi systems such as Cisco Meraki, Ruckus, or pfSense):
- Use a dedicated router/firewall appliance
- Store sessions in the router's memory
- No blockchain involvement — they use usernames, passwords, or voucher codes

Our system uses the same captive portal concept but adds:
- **Blockchain payment verification** — can't fake a payments
- **NFT access passes** — on-chain proof of access rights
- **Marketplace model** — any owner can list their hotspot, not just commercial venues
- **Portable implementation** on any Windows laptop, making it accessible to individuals

---

**Q20: What is the `.authenticated-ips.json` file?**

It is a temporary file used for **inter-process communication** between `gateway.js` and `dns-redirect.js`. These are two separate Node.js processes. To share the list of authenticated IPs, `gateway.js` writes the current list to this JSON file every time the list changes. `dns-redirect.js` reads this file before deciding whether to forward DNS queries to the real DNS server or redirect to the gateway. In production, this inter-process communication would use a proper IPC mechanism (Unix socket, named pipe) or a shared Redis store.

---

**Q21: What prevents someone from faking their IP address to impersonate an authenticated device?**

IP spoofing on a local network would require the attacker to be on the same LAN segment and intercept/respond to packets destined for the real device — this is an ARP spoofing attack. For a simple hotspot scenario, this is a real but advanced attack. Mitigations include:
- Dynamic ARP Inspection (DAI) on the router — filters ARP packets based on MAC-to-IP bindings.
- MAC address tracking — the allowed firewall rule would also check the MAC address, not just the IP.
- Short session tokens that rotate frequently — even if spoofed, the window is brief.

---

**Q22: Why use Windows Firewall instead of a VPN or proxy?**

A VPN would require each user to install and configure the VPN client — too much friction. A proxy would require users to configure their device's proxy settings — again, too much friction. The captive portal + firewall approach requires:
- **Zero configuration** from users — just connect to WiFi and pay.
- No software to install on the user's device.
- Works with all protocols (not just HTTP like a proxy).

The firewall approach is exactly how commercial captive portal systems work.

---

**Q23: How does your system scale to multiple simultaneous users?**

The gateway's `authenticatedClients` Map can hold as many entries as memory allows. Windows Firewall can hold thousands of rules. Each rule is a simple lookup — performance does not degrade significantly with more users. The bottleneck in our current implementation is the hotspot's internet bandwidth and the laptop's processing power, not the gateway software itself. For a commercial deployment, the gateway would run on dedicated hardware designed for higher throughput.

---

**Q24: What would you change about the gateway for a production launch?**

1. **Platform** — Move from Windows laptop to OpenWrt router for dedicated, always-on operation.
2. **Firewall** — Replace `netsh` with `iptables` for more granular control including bandwidth throttling.
3. **Session store** — Replace in-memory Map with Redis for persistence across restarts.
4. **On-chain verification** — Have the gateway call `ownerOf(tokenId)` directly from the smart contract instead of delegating to the backend.
5. **HTTPS** — Use a local self-signed certificate or a dedicated local IP with a certificate for the portal page.
6. **Monitoring** — Stream logs to a centralised platform (e.g., Grafana) so all hotspot gateways can be monitored from one dashboard.

---

**Q25: Walk me through a complete user journey — from booking to browsing.**

1. The user opens the Airlink website and finds a nearby hotspot.
2. They click "Book" and pay in ETH via MetaMask. The `AirlinkMarketplace.sol` smart contract holds the payment in escrow and emits a `BookingCreated` event.
3. The backend picks up the event, marks the booking as paid, and emails the user their **access token** (e.g., `A3B5C7D9`) and OTP.
4. An ERC-721 NFT is minted to the user's wallet as their verifiable access pass.
5. The user goes to the hotspot location, connects to the owner's WiFi (the SSID is listed on the booking).
6. Their phone detects the captive portal automatically and shows a popup — or the DNS server redirects their first browser request to the portal page.
7. The user enters their access token on the portal page.
8. The gateway sends the token to the backend, which checks the booking record in MongoDB (status: paid, time window: valid).
9. The backend creates a `CaptiveSession` record and returns a session token.
10. The gateway runs `netsh advfirewall firewall add rule ... action=allow` for the user's IP.
11. The user now has full internet access. The portal shows a countdown timer.
12. When the booking expires, the gateway's 30-second validation loop detects the expired session and blocks the IP.
13. The smart contract releases 98% of the ETH to the hotspot owner and 2% to the platform.
14. The NFT access pass is burned, revoking the on-chain credential.

---

# 13. Quick Explanation (30 Seconds)

> "When a user connects to our hotspot WiFi, they get a local IP address but no internet access. Our gateway — a small Node.js server running on the owner's laptop — acts as a checkpoint. All DNS requests are redirected to our local server, so the first thing the user sees is our captive portal page. They enter the access token they got after paying for their booking. Our gateway sends that token to our backend, the backend verifies the payment and booking are valid in MongoDB, and returns a session token. The gateway then adds a Windows Firewall allow rule for that device's IP — and internet access is granted. When the booking expires, the rule is removed automatically. This way, WiFi access is fully gated by payment — no payment, no internet, and neither the owner nor the user has to do anything manually."

---

*End of AirLink Gateway Study Guide*
