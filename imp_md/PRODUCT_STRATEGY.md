# deWifi - Product Strategy & Hackathon Pitch Guide

**Team:** QuadCoders  
**Team Members:** Yash Urade, Samiksha Musale, Vaidehi Narkhede, Spandan Mali

---

## Table of Contents
1. [One-Line Idea](#1-one-line-idea)
2. [Problem](#2-problem)
3. [Root Cause](#3-root-cause)
4. [Solution](#4-solution)
5. [Unique Selling Proposition (USP)](#5-unique-selling-proposition-usp)
6. [Prototype](#6-prototype)
7. [Business Model](#7-business-model)
8. [30-Second Pitch](#8-30-second-pitch)
9. [2-Minute Startup Pitch](#9-2-minute-startup-pitch)

---

## 1. ONE-LINE IDEA

> **"Airbnb for WiFi — Turn your unused internet bandwidth into passive income while travelers get affordable connectivity anywhere."**

Alternative versions:
- "Uber for decentralized WiFi sharing"
- "A peer-to-peer marketplace connecting WiFi owners with users who need affordable, on-demand internet access"
- "Monetize your home WiFi while travelers save 80% on connectivity costs"

---

## 2. PROBLEM

### What Real-World Problem Are We Solving?

**Internet connectivity in India is expensive, limited, and inconvenient for travelers and mobile workers.**

Every day, millions of people face connectivity challenges:

| User Type | Problem They Face |
|-----------|-------------------|
| **Travelers** | Hotel WiFi costs ₹500-1000/day, often with poor speeds |
| **Students** | Need temporary study spots but cafes require purchases |
| **Remote Workers** | Struggle to find reliable internet outside offices |
| **Delivery Partners** | Need quick connectivity for navigation and order updates |
| **Event Attendees** | Conferences/venues have no reliable WiFi |

### Who Faces This Problem? (Target Users)

**Primary Users (WiFi Seekers):**
- Domestic and international travelers
- Digital nomads and freelancers
- Students needing temporary workspaces
- Delivery/gig economy workers
- Business professionals on the go

**Secondary Users (WiFi Owners):**
- Homeowners with underutilized high-speed internet
- Café owners wanting additional revenue
- Office spaces during off-hours
- Libraries and co-working spaces

### Why Is This Problem Important?

1. **Scale of Impact:** India has 800M+ internet users, with 40% facing connectivity gaps when traveling
2. **Cost Burden:** Travelers spend ₹5,000-15,000 annually on expensive ad-hoc connectivity
3. **Wasted Resources:** 70% of home internet bandwidth goes unused during the day
4. **Economic Loss:** Remote workers lose productivity due to unreliable public WiFi
5. **Digital Divide:** Many areas lack affordable connectivity options

### What Happens If This Problem Is Not Solved?

- **Travelers continue overpaying:** ₹500-1000/day for hotel WiFi vs ₹30-100/hour with deWifi
- **Bandwidth waste:** Millions of high-speed connections remain underutilized
- **Lost income opportunity:** Homeowners miss out on ₹2,000-8,000/month passive income
- **Productivity losses:** Remote workers rely on inconsistent café WiFi or expensive mobile data
- **Digital exclusion:** People in underserved areas remain disconnected

### The Problem in Numbers

```
┌─────────────────────────────────────────────────────────────┐
│                    THE CONNECTIVITY GAP                     │
├─────────────────────────────────────────────────────────────┤
│  Hotel WiFi Cost:        ₹500-1000/day                      │
│  Mobile Data (4G):       ₹2.5/GB (slow, unreliable indoors) │
│  Café WiFi:              "Free" but requires ₹200+ purchase │
│  Average Home Bandwidth: 70% UNUSED during work hours       │
│  deWifi Solution:        ₹30-100/hour (80% savings)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ROOT CAUSE

### Why Does This Problem Exist Today?

#### 1. **Infrastructure Mismatch**
- Internet infrastructure is designed for fixed locations (homes, offices)
- No system exists to share this fixed infrastructure with mobile users
- ISPs sell "bandwidth" but users can't resell unused capacity

#### 2. **Information Asymmetry**
- People with extra bandwidth don't know others need it
- People needing WiFi don't know who has extras nearby
- No discovery mechanism connects supply with demand

#### 3. **Trust Deficit**
- Sharing your WiFi password with strangers feels risky
- Users worry about security, misuse, or illegal activity
- No accountability or verification system exists

#### 4. **Payment Friction**
- No easy way to charge for temporary WiFi access
- Micropayments (₹30-100) are complex to process
- No fair revenue-sharing model between platform and provider

#### 5. **Technical Complexity**
- Managing multiple users on a home network is technically challenging
- No way to control who gets internet access and for how long
- ISP terms often discourage sharing (though not explicitly illegal)

### What Limitations Exist in Current Systems?

| Current Option | Why It Fails |
|----------------|--------------|
| **Hotel WiFi** | Expensive (₹500-1000/day), often slow, limited to guests |
| **Café WiFi** | Requires purchase, crowded, limited seating, time-restricted |
| **Mobile Hotspot** | Uses your own data plan, drains battery, unreliable indoors |
| **Co-working Spaces** | Expensive (₹500-2000/day), need membership, not everywhere |
| **Public WiFi** | Unreliable, insecure, very slow speeds |

### The Gap We're Filling

```
┌────────────────┐         ❌ NO BRIDGE         ┌────────────────┐
│   HOME OWNER   │ ─────────────────────────── │    TRAVELER    │
│                │                              │                │
│ "I have 100Mbps│                              │ "I need WiFi   │
│  but only use  │        deWifi creates        │  for 2 hours   │
│  30Mbps"       │ ◄──── THIS CONNECTION ────► │  affordably"   │
│                │                              │                │
│ UNUSED = WASTE │         ✅ SOLUTION          │ HIGH COST/RISK │
└────────────────┘                              └────────────────┘
```

---

## 4. SOLUTION

### Core Idea

**deWifi is a peer-to-peer marketplace that enables homeowners to monetize their unused internet bandwidth by sharing it with travelers and remote workers — with secure access control, integrated payments, and real-time availability.**

Think of it as:
- **Airbnb** for WiFi (list your WiFi, earn money)
- **Uber** for connectivity (find WiFi nearby, pay per hour)
- **Razorpay + Captive Portal** for secure, paid access

### How the System Works (High-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        deWifi ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │  WiFi Owner │    │   deWifi     │    │      WiFi Seeker        │ │
│  │  (Supplier) │    │   Platform   │    │      (Consumer)         │ │
│  └──────┬──────┘    └───────┬──────┘    └───────────┬─────────────┘ │
│         │                   │                       │               │
│         ▼                   ▼                       ▼               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ List WiFi   │───►│  Map-based   │◄───│ Search nearby spots     │ │
│  │ Spot + Set  │    │  Discovery   │    │ View ratings, speeds    │ │
│  │ Price/Hour  │    │  Engine      │    │ Check availability      │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────┘ │
│                             │                       │               │
│                             ▼                       ▼               │
│                     ┌──────────────┐    ┌─────────────────────────┐ │
│                     │   Booking    │◄───│ Select duration + Book  │ │
│                     │   System     │    │ Pay via Razorpay        │ │
│                     └──────┬───────┘    └─────────────────────────┘ │
│                            │                                        │
│         ┌──────────────────┼──────────────────┐                     │
│         ▼                  ▼                  ▼                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ Owner gets  │    │   Captive    │    │ User gets Access Token  │ │
│  │ 98% revenue │    │   Portal     │    │ Enters OTP on portal    │ │
│  │ (2% fee)    │    │   Gateway    │    │ Gets internet access    │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### User Interaction Flow

#### For WiFi Seekers (Finding & Booking WiFi):

```
Step 1: DISCOVER
├── Open deWifi app/website
├── View map of nearby WiFi spots
├── Filter by price, speed, rating, amenities
└── See real-time availability (online/offline status)

Step 2: BOOK
├── Select WiFi spot
├── Choose duration (1-8 hours)
├── See total cost with transparent breakdown
├── Pay via Razorpay (UPI, cards, wallets)
└── Receive access token + OTP

Step 3: CONNECT
├── Connect to owner's WiFi hotspot
├── Browser redirects to captive portal
├── Enter access token and OTP
├── Gateway validates with backend
└── Get full internet access

Step 4: ENJOY & REVIEW
├── Use internet for booked duration
├── Session auto-expires when time ends
├── Leave rating and review
└── View session history in dashboard
```

#### For WiFi Owners (Listing & Earning):

```
Step 1: LIST
├── Create owner account
├── Add WiFi spot details (SSID, password, location)
├── Set price per hour (₹30-500 range)
├── Add amenities (seating, power outlets, AC, etc.)
└── Upload photos of the spot

Step 2: CONFIGURE
├── Download gateway software
├── Run gateway.js on your laptop
├── Enable Windows Mobile Hotspot
├── Gateway manages access automatically
└── No technical skills required

Step 3: EARN
├── Users book your spot
├── Razorpay processes payments
├── You receive 98% of booking amount
├── 2% platform fee deducted
└── View earnings in owner dashboard

Step 4: MANAGE
├── Monitor active sessions
├── View booking history
├── Track earnings over time
├── Respond to reviews
└── Enable/disable spot availability
```

### What Makes This Solution Practical?

1. **No Hardware Required:** Uses existing Windows Mobile Hotspot + laptop
2. **Instant Setup:** Owners can list and start earning in under 10 minutes
3. **Automated Access Control:** Gateway software handles authentication automatically
4. **Secure Payments:** Razorpay integration with UPI, cards, and wallets
5. **Real-Time Monitoring:** Both users and owners can see session status
6. **Trust System:** Ratings and reviews build accountability

---

## 5. UNIQUE SELLING PROPOSITION (USP)

### What Makes deWifi Different?

| Feature | Traditional Solutions | deWifi |
|---------|----------------------|--------|
| **Cost** | ₹500-1000/day | ₹30-100/hour (pay for what you use) |
| **Flexibility** | Fixed daily rates | Hour-by-hour booking |
| **Availability** | Only hotels/cafes | Any home, office, or space |
| **Earnings** | No sharing for owners | Owners earn 98% of bookings |
| **Access Control** | Shared password | Secure token-based system |
| **Discovery** | Word of mouth | Map-based, searchable |
| **Trust** | None | Ratings, reviews, verification |

### Key Innovation

**Captive Portal Gateway System**

deWifi's technical innovation is the **local gateway server** that runs on the owner's laptop:

```javascript
// From gateway.js - The core innovation
/**
 * This script runs on the WiFi OWNER'S laptop and:
 * 1. Starts an HTTP server that acts as a captive portal gateway
 * 2. Intercepts requests from hotspot-connected devices
 * 3. Redirects unauthenticated devices to the captive portal page
 * 4. Manages Windows Firewall rules to allow/block internet access
 * 5. Periodically validates sessions against the backend API
 */
```

**This eliminates the need for:**
- Expensive router hardware
- Custom firmware installation
- Technical configuration by owners
- Third-party network devices

### Competitive Advantage

1. **Software-Only Solution:** No special hardware required
2. **Works on Any Laptop:** Standard Windows Mobile Hotspot feature
3. **Instant Monetization:** Start earning within minutes of signup
4. **Secure by Design:** Token + OTP system prevents password sharing
5. **Indian Payment Focus:** Razorpay integration for UPI, local cards

### Why Users Would Prefer deWifi

**For Seekers:**
- Save 70-80% compared to hotel WiFi
- Pay only for hours needed (not full days)
- Find WiFi spots anywhere (not just hotels)
- Verify speed and reliability before booking
- Secure access (no shared public passwords)

**For Owners:**
- Earn passive income from existing internet
- No investment required (use existing connection)
- Keep 98% of earnings (lowest platform fee)
- Automated management (gateway handles everything)
- Flexible availability (enable/disable anytime)

### Technical Uniqueness

```
┌─────────────────────────────────────────────────────────────────┐
│              TECHNICAL DIFFERENTIATORS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CAPTIVE PORTAL GATEWAY                                      │
│     └── Windows Firewall rule management                        │
│     └── Real-time session validation                            │
│     └── Automatic IP-based access control                       │
│                                                                 │
│  2. SECURE TOKEN SYSTEM                                         │
│     └── Booking generates unique accessToken                    │
│     └── 6-digit OTP for additional verification                 │
│     └── Time-bound sessions with auto-expiry                    │
│                                                                 │
│  3. REAL-TIME MONITORING                                        │
│     └── Spot online/offline status                              │
│     └── Uptime percentage tracking                              │
│     └── Current user count                                      │
│                                                                 │
│  4. MERN + RAZORPAY INTEGRATION                                 │
│     └── Seamless Indian payment processing                      │
│     └── UPI, cards, wallets supported                           │
│     └── Instant settlement to owners                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. PROTOTYPE

### Features Currently Implemented

#### ✅ Fully Functional Features

| Category | Feature | Status |
|----------|---------|--------|
| **Authentication** | User registration & login | ✅ Complete |
| | JWT-based session management | ✅ Complete |
| | Role-based access (user/owner) | ✅ Complete |
| **WiFi Spot Management** | Create/edit WiFi spots | ✅ Complete |
| | Set pricing per hour | ✅ Complete |
| | Add amenities | ✅ Complete |
| | Location with coordinates | ✅ Complete |
| **Discovery** | Map-based spot discovery | ✅ Complete |
| | Filter by city, price, rating | ✅ Complete |
| | Real-time online/offline status | ✅ Complete |
| **Booking System** | Select duration (1-8 hours) | ✅ Complete |
| | Calculate total with platform fee | ✅ Complete |
| | Razorpay payment integration | ✅ Complete |
| | Booking confirmation | ✅ Complete |
| **Captive Portal** | Access token + OTP generation | ✅ Complete |
| | Token validation | ✅ Complete |
| | Session management | ✅ Complete |
| **Gateway** | Windows Mobile Hotspot integration | ✅ Complete |
| | Firewall rule management | ✅ Complete |
| | Auto session expiry | ✅ Complete |
| **Dashboards** | User booking history | ✅ Complete |
| | Owner earnings dashboard | ✅ Complete |
| | Active session monitoring | ✅ Complete |
| **Reviews** | Rating system (1-5 stars) | ✅ Complete |
| | Written reviews | ✅ Complete |

#### ⏳ Planned/Simulated Features

| Feature | Status | Notes |
|---------|--------|-------|
| Mobile app | 📋 Planned | Currently web-only |
| Push notifications | 📋 Planned | Email notifications ready |
| Bandwidth throttling | 📋 Planned | Gateway can be extended |
| Multi-device tracking | ⏳ Simulated | Single device per booking now |
| Dispute resolution | 📋 Planned | Admin panel needed |
| Automated payouts | ⏳ Simulated | Manual Razorpay settlement |

### What the Demo Shows

1. **Complete User Journey:**
   - Sign up → Browse spots → Book WiFi → Pay → Connect → Use → Review

2. **Complete Owner Journey:**
   - Sign up as owner → List spot → Run gateway → Receive bookings → Earn money

3. **Core Technical Innovation:**
   - Captive portal redirecting unauthenticated users
   - Token-based access granting
   - Real-time session management

4. **Payment Flow:**
   - Razorpay checkout integration
   - Payment verification
   - Booking confirmation

### Prototype Screenshots Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEMO WALKTHROUGH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Screen 1: HOME                                                 │
│  └── Hero section with value proposition                        │
│  └── Featured spots preview                                     │
│  └── "Find WiFi" CTA button                                     │
│                                                                 │
│  Screen 2: EXPLORE                                              │
│  └── Interactive map (Leaflet + OpenStreetMap)                  │
│  └── List of WiFi spots with filters                            │
│  └── Real-time availability indicators                          │
│                                                                 │
│  Screen 3: SPOT DETAILS                                         │
│  └── Spot information (speed, amenities, rating)                │
│  └── Owner profile                                              │
│  └── "Book Now" button                                          │
│                                                                 │
│  Screen 4: BOOKING                                              │
│  └── Duration selector                                          │
│  └── Price breakdown                                            │
│  └── Razorpay payment button                                    │
│                                                                 │
│  Screen 5: CAPTIVE PORTAL                                       │
│  └── Token + OTP entry form                                     │
│  └── Session activation                                         │
│  └── Countdown timer                                            │
│                                                                 │
│  Screen 6: OWNER DASHBOARD                                      │
│  └── Earnings summary                                           │
│  └── Active sessions                                            │
│  └── Booking history                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How the Prototype Demonstrates the Core Idea

1. **Discovery Problem → Map-based search shows it works**
2. **Trust Problem → Ratings, reviews, profile verification**
3. **Payment Problem → Razorpay integration handles micropayments**
4. **Access Control Problem → Captive portal + token system**
5. **Monetization Problem → 98% owner earnings, 2% platform fee**

---

## 7. BUSINESS MODEL

### Target Customers

#### Primary Market: WiFi Seekers
- **Domestic Travelers:** 400M+ annual trips in India
- **International Tourists:** 10M+ visitors annually
- **Digital Nomads:** Growing community of 1M+ in India
- **Delivery Partners:** 5M+ gig workers
- **Students:** 40M+ college students

#### Secondary Market: WiFi Owners
- **Urban Homeowners:** 50M+ with broadband connections
- **Café Owners:** 500K+ establishments
- **Co-working Spaces:** 5K+ locations
- **Small Businesses:** Offices with spare bandwidth

### Revenue Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE STREAMS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY: TRANSACTION FEE (2%)                                  │
│  └── Every booking: Platform keeps 2%, owner gets 98%           │
│  └── Example: ₹100 booking = ₹2 platform, ₹98 owner             │
│  └── Estimated: ₹50-100 average booking                         │
│                                                                 │
│  SECONDARY: PREMIUM LISTINGS                                    │
│  └── Owners pay for featured placement                          │
│  └── "Verified" badge for trusted spots                         │
│  └── Priority in search results                                 │
│                                                                 │
│  TERTIARY: ENTERPRISE PLANS                                     │
│  └── Bulk access for companies                                  │
│  └── Corporate travel programs                                  │
│  └── Hotel/café partnerships                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pricing Ideas

| Duration | Price Range | Platform Fee |
|----------|-------------|--------------|
| 1 hour | ₹30-100 | ₹0.60-2.00 |
| 4 hours | ₹100-350 | ₹2.00-7.00 |
| 8 hours | ₹200-600 | ₹4.00-12.00 |

**Revenue Projections (Year 1):**
- 10,000 bookings/month × ₹60 average = ₹6,00,000 GMV
- Platform revenue (2%) = ₹12,000/month
- Target Year 1: 1L bookings = ₹12L platform revenue

### Possible Partnerships

1. **Travel Platforms:** MakeMyTrip, Goibibo, Booking.com
2. **Coworking Chains:** WeWork, 91springboard, Awfis
3. **Café Chains:** Starbucks, CCD, Blue Tokai
4. **Hotels:** Budget hotel chains (OYO, FabHotels)
5. **Universities:** Campus WiFi monetization
6. **Telecom Companies:** Jio, Airtel (complementary service)

### Market Potential

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET SIZE ANALYSIS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TAM (Total Addressable Market):                                │
│  └── India's total connectivity spend: ₹50,000 Cr annually      │
│                                                                 │
│  SAM (Serviceable Addressable Market):                          │
│  └── Travel/temporary connectivity: ₹5,000 Cr                   │
│                                                                 │
│  SOM (Serviceable Obtainable Market):                           │
│  └── Urban travelers in top 10 cities: ₹500 Cr                  │
│  └── Initial Target: 1% = ₹5 Cr GMV                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Three Monetization Strategies

#### Strategy 1: Transaction-Based (Current Model)
- 2% fee on every transaction
- Low barrier to entry for users
- Revenue scales with usage
- **Pros:** Simple, fair, scalable
- **Cons:** Low per-transaction revenue

#### Strategy 2: Subscription Model
- ₹299/month for unlimited bookings (users)
- ₹199/month for premium listing (owners)
- Predictable recurring revenue
- **Pros:** Stable income, customer retention
- **Cons:** Higher barrier to entry

#### Strategy 3: Freemium + Ads
- Free basic access with ads
- Premium ad-free experience
- Sponsored listings for owners
- **Pros:** Maximum user acquisition
- **Cons:** Depends on ad ecosystem

**Recommended:** Start with Strategy 1, add Strategy 2 features progressively.

### Go-To-Market Strategy

```
Phase 1: LAUNCH (Months 1-3)
├── Focus on one city (Mumbai/Bangalore)
├── Onboard 100 owners manually
├── Target 500 first users
├── College students + remote workers
└── Free first booking (₹0 commission)

Phase 2: GROWTH (Months 4-6)
├── Expand to 5 metro cities
├── Partner with travel bloggers
├── Instagram/YouTube marketing
├── Referral program (₹50 both sides)
└── Target 5,000 active users

Phase 3: SCALE (Months 7-12)
├── 20+ cities
├── Mobile app launch
├── Enterprise partnerships
├── Hotel WiFi partnerships
└── Target 50,000 active users
```

### How the Product Could Scale

1. **Geographic Expansion:** City by city, then international
2. **Vertical Integration:** Own routers, partner with ISPs
3. **Service Expansion:** Meeting rooms, charging stations
4. **B2B Pivot:** Corporate travel connectivity solutions
5. **IoT Platform:** Smart home device connectivity sharing

---

## 8. 30-SECOND PITCH

Use this when judges ask "Tell me about your project" and you have limited time:

---

> **"Imagine you're traveling and need WiFi. Hotel charges ₹1000/day. Café requires ₹200 purchase. Mobile data is unreliable.**
>
> **Meanwhile, the person in the next apartment has 100Mbps internet — and only uses 30% of it.**
>
> **deWifi connects these two people.**
>
> **Homeowners list their WiFi and earn passive income. Travelers pay ₹30-100 per hour — 80% cheaper than alternatives.**
>
> **We handle everything: map-based discovery, secure payments via Razorpay, and a captive portal gateway that manages access automatically.**
>
> **Users save money. Owners earn money. We take 2%.**
>
> **It's Airbnb for WiFi."**

---

**Key points to emphasize:**
- Real problem (expensive/unreliable connectivity)
- Clear solution (peer-to-peer WiFi sharing)
- Value proposition (80% savings, passive income)
- Business model (2% platform fee)
- Technical credibility (captive portal, Razorpay)

---

## 9. 2-MINUTE STARTUP PITCH

Use this for formal pitch sessions or detailed Q&A:

---

### Opening Hook (15 seconds)
> "Last month, I paid ₹3,500 for hotel WiFi during a 5-day trip to Goa. That same week, my neighbor in Panaji was paying for 100Mbps Jio Fiber — and barely using half of it. What if I could have just paid him ₹50 per hour instead?"

### Problem (25 seconds)
> "This is the connectivity paradox facing millions of Indians every day. Travelers overpay for WiFi — ₹500 to ₹1000 per day at hotels. Meanwhile, homeowners across the country have high-speed internet connections sitting 70% idle during work hours.
>
> There's no way for these two groups to connect. No discovery mechanism, no trust system, no payment infrastructure. The result? Wasted resources and frustrated users."

### Solution (30 seconds)
> "deWifi solves this with a peer-to-peer WiFi sharing marketplace.
>
> Homeowners list their WiFi spot on our platform — set their price, availability, and amenities. Travelers discover these spots on a map, see ratings and real-time availability, and book for as little as one hour.
>
> Payment happens through Razorpay — UPI, cards, wallets. After payment, the user gets a secure access token. When they connect to the owner's hotspot, our captive portal validates their token and grants internet access automatically.
>
> No password sharing. No manual intervention. Just seamless connectivity."

### USP & Innovation (20 seconds)
> "What makes us different is our gateway technology. It runs on the owner's laptop, uses Windows Mobile Hotspot, and manages firewall rules to control access. No expensive hardware. No router modifications. Just download and run.
>
> Users save 80% compared to hotel WiFi. Owners earn ₹2,000-8,000 per month doing nothing. We take just 2%."

### Traction & Business Model (15 seconds)
> "Our prototype is fully functional — user registration, map-based discovery, Razorpay payments, captive portal access, and owner dashboards. We're targeting the ₹5,000 crore temporary connectivity market in India, starting with urban travelers and remote workers in metro cities."

### Closing & Ask (15 seconds)
> "We're QuadCoders — Yash, Samiksha, Vaidehi, and Spandan. We've built a working product that turns idle bandwidth into income.
>
> deWifi: Airbnb for WiFi. Help travelers connect. Help homeowners earn.
>
> We're ready to launch in Mumbai and need your support to scale."

---

### Alternative Closings Based on Competition Format

**For Investment-Focused:**
> "We're seeking ₹25 lakhs to onboard 1,000 WiFi owners in Mumbai and acquire our first 10,000 users. With your support, we can prove the model and scale nationwide."

**For Technical Excellence:**
> "Our captive portal gateway demonstrates real technical innovation — managing Windows Firewall rules in real-time, validating sessions against our backend, and providing seamless access control without any special hardware."

**For Social Impact:**
> "Beyond business, deWifi addresses digital inclusion. We're making affordable internet accessible in areas without cafés or co-working spaces — enabling students, gig workers, and travelers to stay connected anywhere."

---

## Quick Reference: Judge Q&A Cheat Sheet

| Question | Quick Answer |
|----------|--------------|
| "What's your idea?" | Airbnb for WiFi — homeowners earn, travelers save |
| "Who are your users?" | Travelers needing WiFi + homeowners with unused bandwidth |
| "How do you make money?" | 2% transaction fee on every booking |
| "What's your USP?" | Software-only captive portal — no hardware needed |
| "Is it legal?" | Personal WiFi sharing is not prohibited; we're not an ISP |
| "What about security?" | Token + OTP system; no password sharing; time-limited access |
| "How is it different from public WiFi?" | Paid, verified, controlled access with accountability |
| "Market size?" | ₹5,000 Cr temporary connectivity market in India |
| "Competition?" | No direct competitor; hotel WiFi and cafés are alternatives |
| "Why now?" | 800M internet users, WFH culture, gig economy growth |
| "What's next?" | Launch in one city, mobile app, enterprise partnerships |

---

## Summary Card

```
┌─────────────────────────────────────────────────────────────────┐
│                        deWifi SUMMARY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM:    Expensive/unreliable connectivity for travelers    │
│              + Wasted bandwidth in homes                        │
│                                                                 │
│  SOLUTION:   Peer-to-peer WiFi marketplace with secure          │
│              payments and captive portal access control         │
│                                                                 │
│  USP:        Software-only gateway, no hardware, 98% to owners  │
│                                                                 │
│  MARKET:     ₹5,000 Cr temporary connectivity market            │
│                                                                 │
│  REVENUE:    2% transaction fee                                 │
│                                                                 │
│  ONE-LINE:   "Airbnb for WiFi"                                  │
│                                                                 │
│  TEAM:       QuadCoders (4 members)                             │
│                                                                 │
│  TECH:       MERN Stack + Razorpay + Captive Portal Gateway     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document prepared for hackathon presentation by Team QuadCoders*
