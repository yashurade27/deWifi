# deWifi - Complete Hackathon Preparation Guide

**Team:** QuadCoders  
**Team Members:** Yash Urade, Samiksha Musale, Vaidehi Narkhede, Spandan Mali  
**Project:** Peer-to-Peer WiFi Sharing Marketplace

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete System Architecture](#2-complete-system-architecture)
3. [Technology Stack with Justification](#3-technology-stack-with-justification)
4. [File and Folder Walkthrough](#4-file-and-folder-walkthrough)
5. [Complete User Flow](#5-complete-user-flow)
6. [API Analysis](#6-api-analysis)
7. [Database Design](#7-database-design)
8. [Networking and Connectivity](#8-networking-and-connectivity)
9. [Hackathon Judge Questions (40 Questions)](#9-hackathon-judge-questions)
10. [Critical Thinking Questions (20 Questions)](#10-critical-thinking-questions)
11. [Limitations](#11-limitations)
12. [Future Improvements](#12-future-improvements)
13. [One Minute Pitch](#13-one-minute-pitch)
14. [Deep Technical Explanation](#14-deep-technical-explanation)

---

## 1. PROJECT OVERVIEW

### What Problem This Project Solves

**The WiFi Accessibility Problem:**
- Travelers, remote workers, and students often need temporary internet access
- Hotel WiFi costs ₹500-1000/day and is often slow
- Mobile data is expensive and unreliable in many areas
- Public WiFi is insecure and often congested
- Many homes have unused bandwidth (especially during work hours)

**deWifi Solution:**
A peer-to-peer marketplace that connects people who need WiFi with those who have spare bandwidth, creating a win-win economy.

### Target Users

| User Type | Description | Pain Points Solved |
|-----------|-------------|-------------------|
| **WiFi Users** | Travelers, students, remote workers, tourists | Affordable, fast, temporary internet access |
| **WiFi Owners** | Homeowners, cafe owners, co-working spaces | Monetize unused bandwidth, passive income |
| **Digital Nomads** | People working from different locations | Reliable WiFi discovery in new cities |
| **Event Organizers** | Temporary gatherings needing internet | Quick WiFi setup for events |

### Real World Use Cases

1. **Tourist in a new city**: Opens deWifi, finds nearby WiFi spots on a map, books 2 hours for ₹60, connects instantly
2. **Work-from-home professional**: Lists their home WiFi during office hours, earns ₹4000/month passive income
3. **Student in hostel**: Needs fast WiFi for an important exam, books a nearby home WiFi for ₹30/hour
4. **Cafe owner**: Lists cafe WiFi, attracts more customers who see the listing on the map

### What Makes This Solution Unique/Innovative

1. **Captive Portal Technology**: True access control (not just password sharing) - users only get internet after payment verification through a real captive portal gateway
2. **Real-time Monitoring**: Live health checks showing WiFi reliability, latency, and uptime before booking
3. **Windows Firewall Integration**: Automatic IP-level access control through Windows Firewall rules
4. **Pay-per-hour Model**: Granular pricing unlike monthly subscriptions
5. **Map-based Discovery**: Visual exploration of nearby WiFi spots using Leaflet/OpenStreetMap
6. **Token-based Portal Access**: Secure access tokens and OTPs for connecting to paid WiFi
7. **No Blockchain Complexity**: Pure MERN stack solution that's practical and deployable today

---

## 2. COMPLETE SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD/INTERNET                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐        │
│   │   MongoDB Atlas │◄────►│  Node.js/Express │◄────►│   Razorpay API  │        │
│   │   (Database)    │      │    Backend       │      │   (Payments)    │        │
│   └─────────────────┘      └────────┬─────────┘      └─────────────────┘        │
│                                      │                                           │
│                                      │ REST API                                  │
│                                      ▼                                           │
│                           ┌─────────────────┐                                   │
│                           │  ngrok Tunnel   │ (Development/Demo)                │
│                           └────────┬────────┘                                   │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────────┐
│                            OWNER'S LAPTOP                                        │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│   ┌────────────────┐     ┌────────┴────────┐     ┌─────────────────┐          │
│   │  React/Vite    │     │  Gateway Server  │     │ Windows Firewall │          │
│   │  Frontend      │     │  (Port 8080)     │────►│   Rules Manager  │          │
│   │  (Port 5173)   │     │                  │     │                  │          │
│   └────────────────┘     └────────┬─────────┘     └─────────────────┘          │
│                                    │                                            │
│                           ┌────────┴────────┐                                   │
│                           │ Windows Mobile  │                                   │
│                           │ Hotspot         │                                   │
│                           │ (192.168.137.1) │                                   │
│                           └────────┬────────┘                                   │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │ WiFi
┌────────────────────────────────────┼────────────────────────────────────────────┐
│                           USER'S DEVICE (Phone/Laptop)                          │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│   ┌───────────────────────────────────────────────────────────────────┐        │
│   │  1. Connect to Hotspot WiFi                                        │        │
│   │  2. Captive Portal appears (redirect to 192.168.137.1:8080)       │        │
│   │  3. Enter Access Token/OTP                                         │        │
│   │  4. Gateway validates with Backend → Firewall allows IP           │        │
│   │  5. Internet access granted until booking expires                  │        │
│   └───────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Structure

```
frontend/src/
├── App.tsx                 # Main router with all routes defined
├── main.tsx               # React entry point
├── index.css              # Global styles with Tailwind
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx     # Navigation with auth state, theme toggle
│   │   └── Footer.tsx     # Site footer
│   ├── Home/              # Landing page components
│   │   ├── Hero.tsx       # Hero section with CTA
│   │   ├── FeaturedSpots.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── StatsBar.tsx
│   │   └── Testimonials.tsx
│   └── ui/                # Reusable UI components (Button, Card, Input, etc.)
├── pages/
│   ├── Home.tsx           # Landing page
│   ├── Explore.tsx        # Map-based spot discovery with Leaflet
│   ├── SpotDetails.tsx    # Individual spot page with reviews
│   ├── BookWifi.tsx       # Booking flow with Razorpay integration
│   ├── CaptivePortal.tsx  # Portal page for WiFi authentication
│   ├── WifiSession.tsx    # Active session management
│   ├── UserDashboard.tsx  # User's booking history
│   ├── OwnerDashboard.tsx # Owner's spot management
│   ├── WifiSetup.tsx      # Create/edit WiFi spot
│   ├── Login.tsx / Signup.tsx # Authentication pages
│   ├── Profile.tsx        # User profile management
│   └── Community.tsx, Enterprise.tsx, HowItWorksPage.tsx
├── context/
│   ├── AuthContext.tsx    # JWT auth state management
│   └── ThemeContext.tsx   # Dark/light mode
├── hooks/
│   └── useSpots.ts        # Custom hook for fetching spots
├── lib/
│   ├── api.ts             # API fetch wrapper with auth headers
│   └── utils.ts           # Utility functions (cn for classnames)
└── types/
    └── razorpay.d.ts      # TypeScript types for Razorpay
```

### Backend Structure

```
backend/src/
├── server.ts              # Express app initialization, middleware, routes
├── config.ts              # Environment variables (JWT_SECRET, MONGO_URI, etc.)
├── middleware/
│   └── auth.ts            # JWT verification middleware (protect, requireRole)
├── models/
│   ├── User.ts            # User schema with bcrypt password hashing
│   ├── WifiSpot.ts        # WiFi spot with monitoring, payment setup
│   ├── Booking.ts         # Booking with Razorpay integration, access tokens
│   ├── Review.ts          # Review with verified flag, owner response
│   └── CaptiveSession.ts  # Device sessions for captive portal
├── routes/
│   ├── auth.ts            # signup, signin, signout, profile, change-password
│   ├── spots.ts           # Public spot listing and details
│   ├── owner.ts           # Owner's CRUD for spots
│   ├── bookings.ts        # Create booking, verify payment, get bookings
│   ├── captive.ts         # Captive portal authentication
│   └── reviews.ts         # Create/list reviews
├── utils/
│   └── razorpay.ts        # Razorpay order creation, signature verification
└── seeds/
    ├── seedSpots.ts       # Seed test WiFi spots
    └── seedTestBooking.ts # Seed test bookings
```

### Gateway Structure (Local Server)

```
gateway/
├── gateway.js             # Main captive portal gateway server
├── setup-hotspot.js       # Windows hotspot configuration script
├── dns-redirect.js        # Optional DNS redirect for auto-portal
└── package.json           # Express, http-proxy, node-fetch
```

### Data Flow Step-by-Step

**User Booking Flow:**
```
1. User opens Explore page
   └─► Frontend calls GET /api/spots
       └─► Backend queries MongoDB → Returns spots list

2. User selects a spot and clicks "Book"
   └─► Frontend redirects to /book/:spotId
       └─► Calls GET /api/spots/:id for details
       └─► Calls GET /api/spots/:id/health for live status

3. User selects duration and clicks "Pay"
   └─► Frontend calls GET /api/bookings/razorpay-key
   └─► Frontend calls POST /api/bookings (creates booking + Razorpay order)
       └─► Backend creates booking with status "pending"
       └─► Backend calls Razorpay API to create order
       └─► Returns razorpayOrderId to frontend

4. Razorpay checkout opens
   └─► User completes payment
   └─► Razorpay calls frontend handler with payment details

5. Frontend calls POST /api/bookings/verify-payment
   └─► Backend verifies signature with HMAC-SHA256
   └─► Backend updates booking: status="confirmed", paymentStatus="paid"
   └─► Backend generates accessToken and accessTokenOTP
   └─► Returns credentials to frontend

6. User connects to WiFi hotspot
   └─► Captive portal appears (192.168.137.1:8080)
   └─► User enters access token

7. Gateway validates token
   └─► Gateway calls POST /api/captive/authenticate
   └─► Backend validates token against booking
   └─► Gateway creates CaptiveSession
   └─► Gateway calls Windows Firewall to allow user's IP
   └─► User gets internet access!

8. When booking expires
   └─► Gateway's cleanup interval detects expired session
   └─► Gateway removes firewall allow rule
   └─► User loses internet access
```

---

## 3. TECHNOLOGY STACK WITH JUSTIFICATION

### Backend Technologies

#### Technology: Node.js + Express.js
**Purpose in Project:** Backend server runtime and web framework

**Why Chosen:**
- JavaScript everywhere (same language as frontend)
- Non-blocking I/O perfect for handling many concurrent WiFi connections
- Rich ecosystem for payment integration and database drivers
- Team familiarity with JavaScript

**Advantages:**
- Fast development cycle
- Easy to deploy (single executable)
- Great for real-time features (if adding WebSockets later)
- Excellent npm ecosystem

**Limitations:**
- Single-threaded (can bottleneck on CPU-intensive tasks)
- Callback complexity (mitigated by async/await)
- Less performant than compiled languages for heavy computation

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Python/Django** | Batteries included, great ORM | Slower than Node, different language stack | Team more comfortable with JS |
| **Go/Gin** | Extremely fast, compiled, concurrent | Steeper learning curve, less npm-like ecosystem | Hackathon time constraints |
| **Java/Spring** | Enterprise-grade, type safety | Verbose, slower development cycle | Overkill for MVP |

---

#### Technology: MongoDB + Mongoose
**Purpose in Project:** Database for storing users, spots, bookings, reviews

**Why Chosen:**
- Schema-flexible - perfect for evolving hackathon requirements
- JSON-native (matches JavaScript objects directly)
- Built-in geospatial queries for map-based spot discovery
- Easy to start (no schema migrations needed)

**Advantages:**
- Mongoose provides schema validation and middleware hooks
- $geoNear for finding nearby WiFi spots
- Easy denormalization (storing ownerName on WifiSpot for fast reads)
- Free tier on MongoDB Atlas

**Limitations:**
- No ACID transactions across collections (mitigated by embedding)
- No joins (requires $lookup aggregations)
- Less suitable for complex relational queries

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **PostgreSQL** | ACID compliant, powerful queries | Needs schema migrations, more setup | MongoDB's flexibility better for rapid prototyping |
| **Firebase Firestore** | Real-time sync, serverless | Vendor lock-in, complex queries limited | Need more control over backend logic |
| **MySQL** | Widely used, relational integrity | Schema-first approach slows iteration | Document model fits our data better |

---

#### Technology: JWT (JSON Web Tokens)
**Purpose in Project:** Stateless authentication for API requests

**Why Chosen:**
- Stateless - no session storage needed on server
- Can be verified locally without database lookup
- Contains user ID and role for authorization
- Works well with single-page applications

**Advantages:**
- Scales horizontally (any server can verify)
- Mobile-friendly (stored in localStorage/AsyncStorage)
- 7-day expiry reduces login friction
- Standard implementation with jsonwebtoken library

**Limitations:**
- Cannot invalidate individual tokens (user stays "logged in" until expiry)
- Token theft is dangerous (mitigated by HTTPS)
- Larger than session cookies

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Session cookies** | Can be invalidated server-side | Needs session store (Redis), stateful | Added complexity for hackathon |
| **OAuth 2.0** | Industry standard, third-party login | Complex to implement, overkill for MVP | Using simpler email/password for demo |
| **Passport.js** | Many strategies, well-tested | Adds abstraction layer | Direct JWT simpler to understand |

---

#### Technology: Razorpay
**Purpose in Project:** Payment gateway for booking payments

**Why Chosen:**
- Indian payment gateway (UPI, cards, wallets, netbanking)
- Excellent test mode for hackathon demos
- Simple integration with clear documentation
- No KYC required for test mode

**Advantages:**
- Supports all Indian payment methods
- Webhook support for async payment confirmation
- Automatic refunds via API
- Test credentials work without real money

**Limitations:**
- India-only (can't accept international cards directly)
- 2% + ₹3 transaction fee in production
- Requires merchant verification for production

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Stripe** | Global, excellent developer experience | Not as strong in India (no UPI) | Indian users prefer UPI |
| **PayPal** | Global recognition | High fees, complex integration | Poor UPI support |
| **Paytm** | Strong in India | Less developer-friendly API | Razorpay has better docs |

---

#### Technology: bcryptjs
**Purpose in Project:** Password hashing

**Why Chosen:**
- Industry-standard password hashing with salt
- Configurable work factor (12 rounds used)
- Pure JavaScript (works everywhere)

**Advantages:**
- Protects against rainbow table attacks
- Slow by design (prevents brute force)
- Well-audited library

**Alternatives:**
| Alternative | Why Not Chosen |
|-------------|----------------|
| **argon2** | Better but requires native compilation |
| **scrypt** | Good but bcrypt is more common |

---

### Frontend Technologies

#### Technology: React 19 + TypeScript
**Purpose in Project:** Frontend user interface framework

**Why Chosen:**
- Component-based architecture for reusable UI
- TypeScript catches errors at compile time
- Team familiarity
- Excellent tooling and ecosystem

**Advantages:**
- Strong type safety with TypeScript interfaces
- React hooks for state management (useState, useEffect, useContext)
- Large community and resources
- Works well with Vite for fast development

**Limitations:**
- Requires build step
- React 19 is very new (some libraries may lag)
- Client-side rendering (SEO challenges)

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Vue.js** | Simpler learning curve | Smaller ecosystem | Team knows React better |
| **Next.js** | SSR, better SEO | More complex setup | Not needed for this app |
| **Angular** | Full framework | Steeper learning curve, verbose | Too heavy for hackathon |

---

#### Technology: Vite
**Purpose in Project:** Frontend build tool and dev server

**Why Chosen:**
- Instant Hot Module Replacement (HMR)
- Native ES modules in development
- Much faster than Create React App
- Built-in proxy for API calls

**Advantages:**
- `vite.config.ts` proxy forwards /api to backend (single origin)
- TypeScript support out of the box
- Optimized production builds with Rollup
- Path aliases (@/ for src/)

**Limitations:**
- Relatively new (2020)
- Some legacy plugins not compatible

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Create React App** | Official React tooling | Slow, heavy webpack config | Vite is 10x faster |
| **Webpack** | Maximum control | Complex configuration | Overkill for this project |

---

#### Technology: Tailwind CSS 4
**Purpose in Project:** Utility-first CSS framework

**Why Chosen:**
- Rapid UI development with utility classes
- No context switching to CSS files
- Dark mode built-in (dark: prefix)
- Highly customizable

**Advantages:**
- Consistent spacing, colors, typography
- Small production bundle (purges unused classes)
- Works great with component libraries
- Version 4 has built-in Vite plugin

**Limitations:**
- Long class strings in JSX
- Learning curve for utility approach
- Some designers prefer traditional CSS

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **CSS Modules** | Scoped CSS | More files, slower development | Slower to prototype |
| **Styled Components** | CSS-in-JS, dynamic | Runtime overhead | Tailwind faster for prototyping |
| **Material-UI** | Pre-built components | Heavy bundle, opinionated look | Want custom design |

---

#### Technology: Leaflet + React-Leaflet
**Purpose in Project:** Interactive map for WiFi spot discovery

**Why Chosen:**
- Free and open-source (unlike Google Maps)
- Works with OpenStreetMap tiles (free)
- Lightweight and fast
- Good React integration

**Advantages:**
- No API key required
- Custom markers and popups
- Smooth panning and zooming
- Works offline with cached tiles

**Limitations:**
- Less polished than Google Maps
- No built-in street view
- Geocoding requires external service

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **Google Maps** | Best quality, street view | $$$ pricing, API key required | Cost and complexity |
| **Mapbox** | Beautiful styling | Free tier limited | Leaflet is truly free |

---

#### Technology: Framer Motion
**Purpose in Project:** Animations and transitions

**Why Chosen:**
- Declarative animations with React
- Simple API for complex animations
- AnimatePresence for exit animations
- Gestures support

**Advantages:**
- Smooth page transitions
- Loading state animations
- Micro-interactions (hover, tap)
- Layout animations

**Limitations:**
- Bundle size (~50KB)
- Can impact performance if overused

---

### Gateway Technologies

#### Technology: Windows Mobile Hotspot + Firewall
**Purpose in Project:** Actual WiFi access control

**Why Chosen:**
- Built into Windows 10/11 (no hardware needed)
- Firewall rules provide real network-level access control
- Works for hackathon demo without additional equipment

**Advantages:**
- True captive portal behavior
- IP-level blocking/allowing
- No router configuration needed
- Demonstrates the concept convincingly

**Limitations:**
- Windows-only
- Requires admin privileges
- Limited to ~8 clients on Windows hotspot

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **OpenWRT Router** | Production-ready, hardware | Needs physical router | Hackathon simplicity |
| **Raspberry Pi** | Low cost, dedicated | Additional hardware | Time constraints |
| **pfSense** | Enterprise-grade | Heavy setup | Overkill for demo |

---

#### Technology: ngrok
**Purpose in Project:** Expose local development server to internet

**Why Chosen:**
- Zero-config tunneling
- HTTPS out of the box
- Works through firewalls and NAT
- Essential for testing payment callbacks

**Advantages:**
- Single command: `ngrok http 5173`
- Razorpay can reach our callback URL
- Easy to share demo with judges
- Free tier sufficient for hackathon

**Limitations:**
- Random URLs on free tier (changes each restart)
- 40 connections/minute limit on free tier
- Not for production use

**Alternatives:**
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| **LocalTunnel** | Free, open-source | Less reliable, often down | ngrok more stable |
| **Cloudflare Tunnel** | Free, permanent URLs | More complex setup | ngrok simpler for demo |
| **Serveo** | SSH-based, no client | Intermittent availability | ngrok more reliable |
| **Tailscale Funnel** | Permanent URLs | Requires Tailscale setup | More configuration |

---

## 4. FILE AND FOLDER WALKTHROUGH

### Root Directory

| File/Folder | Purpose |
|-------------|---------|
| `PROJECT_PLAN.md` | Original development plan with schemas and API specs |
| `RAZORPAY_INTEGRATION_GUIDE.md` | Payment integration documentation |
| `CAPTIVE_PORTAL_TEST_RESULTS.md` | Testing documentation for captive portal |
| `package.json` | Root workspace configuration |

### Backend Files (`backend/`)

| File | Purpose |
|------|---------|
| `src/server.ts` | Express app setup, CORS configuration, route mounting, MongoDB connection |
| `src/config.ts` | Environment variables with validation (fails fast if missing) |
| `src/middleware/auth.ts` | `protect` middleware extracts JWT, `requireRole` for owner-only routes |
| `src/models/User.ts` | User schema with bcrypt pre-save hook and comparePassword method |
| `src/models/WifiSpot.ts` | WiFi spot with denormalized owner info, monitoring data, payment setup |
| `src/models/Booking.ts` | Booking with full pricing breakdown, Razorpay IDs, access tokens |
| `src/models/CaptiveSession.ts` | Device sessions with expiry, MAC/IP tracking |
| `src/models/Review.ts` | Reviews with multi-dimensional ratings, owner responses |
| `src/routes/auth.ts` | signup, signin, signout, profile update, password change |
| `src/routes/spots.ts` | Public spot listing with filters, health check endpoint |
| `src/routes/owner.ts` | Owner CRUD for spots (create, update, delete, toggle active) |
| `src/routes/bookings.ts` | Create booking, Razorpay payment flow, get user bookings |
| `src/routes/captive.ts` | Captive portal authentication with token/OTP |
| `src/routes/reviews.ts` | Create review (verified bookings only), list reviews |
| `src/utils/razorpay.ts` | Razorpay order creation, signature verification, refunds |
| `package.json` | Dependencies: express, mongoose, bcryptjs, jsonwebtoken, razorpay, cors |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Template for environment variables |

### Frontend Files (`frontend/`)

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route definitions with BrowserRouter |
| `src/main.tsx` | React 19 entry point with StrictMode |
| `src/context/AuthContext.tsx` | Auth state with localStorage persistence, signup/signin/signout methods |
| `src/context/ThemeContext.tsx` | Dark/light mode toggle with system preference detection |
| `src/lib/api.ts` | `apiFetch` wrapper with auth headers, ngrok-skip-browser-warning |
| `src/hooks/useSpots.ts` | Custom hook for fetching and caching WiFi spots |
| `src/pages/Explore.tsx` | Map view with Leaflet, spot cards, filtering (city, tag, price) |
| `src/pages/BookWifi.tsx` | Booking flow: duration selection, health check, Razorpay checkout |
| `src/pages/CaptivePortal.tsx` | WiFi authentication with token/OTP, gateway detection, HTTPS handling |
| `src/pages/UserDashboard.tsx` | Active sessions, booking history |
| `src/pages/OwnerDashboard.tsx` | Spot management, gateway setup instructions |
| `src/pages/WifiSetup.tsx` | Create/edit WiFi spot form |
| `src/components/layout/Navbar.tsx` | Nav with user dropdown, theme toggle, mobile menu |
| `src/components/ui/*` | Reusable components (Button, Card, Input, etc.) |
| `vite.config.ts` | Vite config with Tailwind plugin, proxy for /api |
| `tailwind.config.js` | Tailwind customization |
| `package.json` | Dependencies: react 19, leaflet, framer-motion, lucide-react |

### Gateway Files (`gateway/`)

| File | Purpose |
|------|---------|
| `gateway.js` | Main server: captive portal routes, firewall management, session validation |
| `setup-hotspot.js` | Interactive setup wizard for Windows Mobile Hotspot |
| `dns-redirect.js` | Optional DNS hijacking for automatic portal redirect |
| `README.md` | Setup instructions for WiFi owners |
| `.authenticated-ips.json` | Runtime state shared between gateway and DNS redirect |

---

## 5. COMPLETE USER FLOW

### Flow 1: User Registration and Login

```
1. User opens deWifi website
   ├── Home page loads with Hero, Features, HowItWorks sections
   └── Navbar shows "Login" and "Sign Up" buttons

2. User clicks "Sign Up"
   ├── Navigate to /signup
   └── Form displays: Name, Email, Phone, Password, Role (User/Owner)

3. User fills form and submits
   ├── Frontend validates (all fields required, password >= 8 chars)
   ├── POST /api/auth/signup
   ├── Backend:
   │   ├── Check if email exists
   │   ├── bcrypt.hash(password, 12)
   │   ├── Create User document
   │   └── Sign JWT with user ID
   └── Frontend:
       ├── Store token in localStorage
       ├── Store user in localStorage
       ├── Update AuthContext state
       └── Redirect to Home (or previous page)

4. User logs out
   ├── Click user dropdown → Sign Out
   ├── POST /api/auth/signout (confirmation only)
   └── Clear localStorage, redirect to Home
```

### Flow 2: Discovering and Booking WiFi

```
1. User navigates to /explore
   ├── Map loads centered on default location (India)
   ├── GET /api/spots?limit=100 fetches all spots
   └── Spots rendered as markers on map + cards in sidebar

2. User applies filters
   ├── City dropdown, Tag filter, Price slider
   ├── Client-side filtering (no API call)
   └── Filtered spots update instantly

3. User clicks a spot marker/card
   ├── Spot details popup on map
   ├── Shows: name, price, speed, rating, live status
   └── "View Details" or "Book" button

4. User clicks "Book"
   ├── If not authenticated: redirect to /login
   └── Navigate to /book/:spotId

5. BookWifi page loads
   ├── GET /api/spots/:spotId for details
   ├── GET /api/spots/:spotId/health for live status
   ├── Show health badge (Live/Unverified/Offline)
   └── Duration selection (1-12 hours)

6. User selects 2 hours, clicks "Pay ₹80"
   ├── Frontend:
   │   ├── GET /api/bookings/razorpay-key
   │   └── POST /api/bookings with wifiSpotId, durationHours
   ├── Backend:
   │   ├── Validate spot is active and available
   │   ├── Calculate: subtotal, platformFee (2%), ownerEarnings
   │   ├── Create Razorpay order via razorpay.orders.create()
   │   ├── Create Booking with status="pending"
   │   └── Return razorpayOrderId, amount
   └── Frontend: Opens Razorpay checkout modal

7. Razorpay checkout
   ├── User enters card/UPI details
   ├── Payment processed by Razorpay
   └── Razorpay calls frontend handler with:
       ├── razorpay_order_id
       ├── razorpay_payment_id
       └── razorpay_signature

8. Payment verification
   ├── POST /api/bookings/verify-payment
   ├── Backend:
   │   ├── Verify signature: HMAC-SHA256(orderId|paymentId, secret)
   │   ├── Update booking: paymentStatus="paid", status="confirmed"
   │   ├── Generate accessToken (16 chars) and accessTokenOTP (6 digits)
   │   └── Return credentials
   └── Frontend:
       ├── Show success screen with access token/OTP
       ├── Save to localStorage for reload recovery
       └── Show instructions to connect to WiFi
```

### Flow 3: Connecting to WiFi (Captive Portal)

```
1. User connects phone to owner's WiFi hotspot
   ├── Device gets IP (e.g., 192.168.137.10)
   └── DNS hijacked to 192.168.137.1 (gateway)

2. User opens browser or receives captive portal notification
   ├── Browser redirects to http://192.168.137.1:8080/portal
   └── Captive portal page loads

3. CaptivePortal.tsx detects situation
   ├── Check for stored session token
   ├── Check for URL parameters (token, otp, spotId)
   └── If token in URL, auto-authenticate

4. User enters access token (or OTP)
   ├── Click "Authenticate"
   └── POST to gateway /api/gateway/authenticate

5. Gateway validates
   ├── Gateway calls backend POST /api/captive/authenticate
   ├── Backend:
   │   ├── Find booking with matching token, spotId
   │   ├── Verify: paymentStatus="paid", within time range
   │   ├── Check device limit (maxDevices)
   │   ├── Create CaptiveSession document
   │   └── Return success with expiresAt
   └── Gateway:
       ├── Store client IP in authenticatedClients Map
       ├── Call Windows Firewall: netsh advfirewall add rule
       └── Return session token

6. User gets internet access!
   ├── All traffic from their IP is now allowed
   ├── Captive portal shows "Connected" with countdown
   └── Session stored in localStorage

7. When booking expires
   ├── Gateway's cleanup interval (every 60s)
   ├── Detects expired session
   ├── Removes firewall allow rule
   └── User's internet access revoked
```

### Flow 4: WiFi Owner Setup

```
1. Owner registers with role="owner"
   └── Same as user registration

2. Owner navigates to /owner/dashboard
   ├── Shows stats: total spots, active, online
   └── "Add WiFi Spot" button

3. Owner clicks "Add WiFi Spot"
   └── Navigate to /owner/spots/new (WifiSetup.tsx)

4. Owner fills spot details
   ├── Name, description
   ├── Location (map click or address)
   ├── Price per hour
   ├── Speed, max users
   ├── Amenities (checkboxes)
   ├── Availability hours
   ├── WiFi credentials (SSID, password, security type)
   └── Tag (Home/Cafe/Office/Library/CoWorking)

5. Owner submits
   ├── POST /api/owner/spots
   ├── Backend:
   │   ├── Validate owner role
   │   ├── Create WifiSpot with isApproved=true (auto-approve for demo)
   │   └── Initialize monitoring data
   └── Redirect to dashboard

6. Owner starts gateway server
   ├── Open PowerShell as Administrator
   ├── cd gateway && npm install
   ├── node gateway.js --spot <SPOT_ID> --backend http://localhost:3000
   └── Gateway:
       ├── Detects hotspot interface
       ├── Cleans up stale firewall rules
       ├── Starts HTTP server on port 8080
       └── Ready to accept captive portal connections
```

---

## 6. API ANALYSIS

### Authentication Routes (`/api/auth`)

| Endpoint | Method | Request Body | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/auth/signup` | POST | `{name, email, phone, password, role}` | `{message, token, user}` | `Signup.tsx` |
| `/api/auth/signin` | POST | `{email, password}` | `{message, token, user}` | `Login.tsx` |
| `/api/auth/signout` | POST | - | `{message}` | `Navbar.tsx` |
| `/api/auth/profile` | PUT | `{name, email, phone, profilePhoto}` | `{message, user}` | `Profile.tsx` |
| `/api/auth/change-password` | PUT | `{currentPassword, newPassword}` | `{message}` | `Profile.tsx` |

### Spots Routes (`/api/spots`)

| Endpoint | Method | Query Params | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/spots` | GET | `city, tag, maxPrice, minSpeed, active, search, page, limit, sort` | `{success, total, page, pages, spots[]}` | `Explore.tsx`, `useSpots.ts` |
| `/api/spots/:id` | GET | - | `{success, spot}` | `SpotDetails.tsx`, `BookWifi.tsx` |
| `/api/spots/:id/health` | GET | - | `{success, health: {isOnline, uptimePercent, latencyMs, recommendation}}` | `BookWifi.tsx` |

### Owner Routes (`/api/owner`) - Protected

| Endpoint | Method | Request Body | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/owner/spots` | GET | - | `{success, spots[]}` | `OwnerDashboard.tsx` |
| `/api/owner/spots/:id` | GET | - | `{success, spot}` | `WifiSetup.tsx` (edit mode) |
| `/api/owner/spots` | POST | `{name, lat, lng, address, city, state, pricePerHour, ssid, wifiPassword, ...}` | `{success, spot}` | `WifiSetup.tsx` |
| `/api/owner/spots/:id` | PUT | `{...fieldsToUpdate}` | `{success, spot}` | `WifiSetup.tsx` |
| `/api/owner/spots/:id` | DELETE | - | `{success}` | `OwnerDashboard.tsx` |
| `/api/owner/stats` | GET | - | `{stats: {totalSpots, activeSpots, avgRating}}` | `OwnerDashboard.tsx` |

### Booking Routes (`/api/bookings`) - Protected

| Endpoint | Method | Request Body | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/bookings/razorpay-key` | GET | - | `{success, key}` | `BookWifi.tsx` |
| `/api/bookings` | POST | `{wifiSpotId, durationHours, startTime?}` | `{success, booking: {id, razorpayOrderId, amount, ...}}` | `BookWifi.tsx` |
| `/api/bookings/verify-payment` | POST | `{bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature}` | `{success, booking: {accessToken, accessTokenOTP}, wifiCredentials}` | `BookWifi.tsx` |
| `/api/bookings/my-bookings` | GET | `?status=active` | `{success, bookings[]}` | `UserDashboard.tsx` |
| `/api/bookings/active` | GET | - | `{success, bookings[]}` | `UserDashboard.tsx` |
| `/api/bookings/:id` | GET | - | `{success, booking}` | `WifiSession.tsx` |

### Captive Portal Routes (`/api/captive`) - Public

| Endpoint | Method | Request Body | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/captive/detect/:spotId` | GET | - | `{authenticated, requiresAuth, spot}` | `CaptivePortal.tsx` |
| `/api/captive/authenticate` | POST | `{spotId, accessToken?, otp?}` | `{success, sessionToken, expiresAt, deviceInfo}` | `CaptivePortal.tsx` |
| `/api/captive/validate-session` | POST | `{sessionToken, spotId}` | `{valid, booking, spot}` | Gateway |
| `/api/captive/heartbeat` | POST | `{sessionToken}` | `{success}` | `CaptivePortal.tsx` |

### Review Routes (`/api/reviews`)

| Endpoint | Method | Request Body | Response | Frontend Component |
|----------|--------|--------------|----------|-------------------|
| `/api/reviews` | POST | `{bookingId, overallRating, speedRating, reliabilityRating, valueRating, comment}` (Protected) | `{success, review}` | `WifiSession.tsx` |
| `/api/reviews/spot/:spotId` | GET | `?page, limit` | `{success, reviews[], stats, pagination}` | `SpotDetails.tsx` |

### Gateway Routes (Local: `http://192.168.137.1:8080`)

| Endpoint | Method | Request Body | Response | Purpose |
|----------|--------|--------------|----------|---------|
| `/api/gateway/authenticate` | POST | `{spotId, accessToken, otp}` | `{success, sessionToken, expiresAt}` | Validates with backend, manages firewall |
| `/api/gateway/register-session` | POST | `{sessionToken}` | `{success}` | Notifies gateway to whitelist IP |
| `/api/gateway/status` | GET | - | `{authenticatedClients, spotId}` | Debug endpoint |

---

## 7. DATABASE DESIGN

### Database Type: MongoDB (Document-oriented NoSQL)

**Why MongoDB:**
1. Schema flexibility for rapid iteration
2. JSON documents match JavaScript objects
3. Built-in geospatial queries ($geoNear, 2dsphere index)
4. Embedded documents reduce joins
5. Free MongoDB Atlas tier

### Schema Design

#### User Collection
```javascript
{
  _id: ObjectId,
  name: String,          // "Yash Urade"
  email: String,         // unique, lowercase
  phone: String,         // "+91 9876543210"
  password: String,      // bcrypt hash
  role: "user" | "owner",
  profilePhoto: String,  // URL
  createdAt: Date,
  updatedAt: Date
}
// Index: email (unique)
```

#### WifiSpot Collection
```javascript 
{
  _id: ObjectId,
  owner: ObjectId,       // ref: User
  ownerName: String,     // denormalized for fast reads
  ownerAvatar: String,
  name: String,          // "Yash's Home WiFi"
  description: String,
  lat: Number,           // 18.5204
  lng: Number,           // 73.8567
  address: String,
  city: String,          // indexed for filtering
  state: String,
  pricePerHour: Number,  // 40
  speedMbps: Number,     // 100
  maxUsers: Number,      // 5
  currentUsers: Number,  // 2
  rating: Number,        // 4.5
  reviewCount: Number,   // 23
  isActive: Boolean,
  isApproved: Boolean,
  amenities: [String],   // ["AC", "Seating", "Power"]
  availableFrom: String, // "09:00"
  availableTo: String,   // "22:00"
  images: [String],
  ssid: String,
  wifiPassword: String,  // stored for reveal after payment
  securityType: "WPA2" | "WPA3" | "WEP" | "Open",
  tag: "Home" | "Cafe" | "Office" | "Library" | "CoWorking",
  paymentSetup: {
    upiId: String,
    bankAccountNumber: String,
    // ... for future owner payouts
  },
  monitoring: {
    lastPingAt: Date,
    isOnline: Boolean,
    uptimePercent: Number,
    latencyMs: Number,
    pingHistory: [{
      timestamp: Date,
      isOnline: Boolean,
      latencyMs: Number
    }]
  }
}
// Indexes: city, tag, isActive, owner
```

#### Booking Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,        // ref: User
  wifiSpot: ObjectId,    // ref: WifiSpot
  owner: ObjectId,       // ref: User (denormalized)
  startTime: Date,
  endTime: Date,
  durationHours: Number,
  pricePerHour: Number,
  subtotal: Number,      // pricePerHour * durationHours
  platformFee: Number,   // 2% of subtotal
  ownerEarnings: Number, // 98% of subtotal
  totalAmount: Number,
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled",
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  wifiCredentialsRevealed: Boolean,
  accessToken: String,      // "A3B5C7D9E1F2G4H6"
  accessTokenOTP: String,   // "847293"
  maxDevices: Number,
  activeDeviceCount: Number
}
// Indexes: user, wifiSpot, status, startTime, accessToken
```

#### CaptiveSession Collection
```javascript
{
  _id: ObjectId,
  booking: ObjectId,
  wifiSpot: ObjectId,
  user: ObjectId,
  deviceId: String,        // MAC or fingerprint
  deviceType: String,      // "mobile", "laptop"
  deviceName: String,      // User agent
  ipAddress: String,       // "192.168.137.10"
  macAddress: String,
  isActive: Boolean,
  authenticatedAt: Date,
  lastActivityAt: Date,
  expiresAt: Date,
  sessionToken: String,    // unique
  dataUsedMB: Number
}
// Indexes: booking, sessionToken, expiresAt
```

#### Review Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  wifiSpot: ObjectId,
  booking: ObjectId,       // unique - one review per booking
  overallRating: Number,   // 1-5
  speedRating: Number,
  reliabilityRating: Number,
  valueRating: Number,
  title: String,
  comment: String,
  ownerResponse: String,
  ownerRespondedAt: Date,
  isVerified: Boolean,     // true if booking was completed
  helpful: Number          // upvotes
}
// Indexes: wifiSpot, booking (unique)
```

### Why This Structure Was Chosen

1. **Denormalization**: `ownerName` stored on WifiSpot to avoid join on every spot listing
2. **Embedded Monitoring**: `pingHistory` embedded in WifiSpot for atomic updates
3. **Separate CaptiveSession**: Allows tracking multiple devices per booking
4. **Pricing Breakdown**: Full audit trail of fees in Booking document
5. **Status Enums**: Clear state machine for booking lifecycle

### Possible Alternatives

| Alternative | Pros | Cons |
|-------------|------|------|
| **PostgreSQL** | ACID transactions, relational integrity | Schema migrations slow iteration |
| **Redis** | Ultra-fast session storage | Not persistent, limited queries |
| **DynamoDB** | Serverless, auto-scaling | AWS lock-in, complex pricing |

---

## 8. NETWORKING AND CONNECTIVITY

### Why ngrok is Used

**Problem**: During development and demo:
- Backend runs on `localhost:3000`
- Frontend runs on `localhost:5173`
- Neither is accessible from the internet
- Razorpay cannot send webhooks to localhost
- Phone on hotspot cannot reach developer's laptop

**Solution**: ngrok creates a secure tunnel from a public URL to your local server.

```bash
ngrok http 5173
# Output: https://abc123.ngrok-free.app -> http://localhost:5173
```

**How It Works:**
```
[Internet] 
    │
    ▼
[ngrok Edge Servers] ─── encrypted tunnel ───► [ngrok client on laptop]
    │                                                    │
    ▼                                                    ▼
[Public URL: abc123.ngrok-free.app]           [localhost:5173 + proxy to :3000]
```

### How Local Servers are Exposed

1. **Vite Proxy Configuration** (vite.config.ts):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```
This forwards all `/api` calls from the frontend to the backend.

2. **Single ngrok Tunnel Strategy**:
- Run `ngrok http 5173` (frontend port)
- The ngrok URL serves the React app
- React app's `/api` calls go through Vite proxy to backend
- Result: One URL for everything!

3. **ngrok-skip-browser-warning Header** (api.ts):
```typescript
headers: {
  "ngrok-skip-browser-warning": "true"
}
```
This bypasses ngrok's free-tier warning page for API calls.

### Security Implications

**Risks:**
1. **Public Exposure**: Anyone with ngrok URL can access your dev server
2. **Token Interception**: If not using HTTPS, tokens could be stolen
3. **Brute Force**: No rate limiting on free ngrok

**Mitigations Implemented:**
1. ngrok always uses HTTPS
2. JWT tokens expire in 7 days
3. Razorpay signature verification prevents payment tampering
4. Gateway firewall rules are per-IP

**Production Considerations:**
- Replace ngrok with proper hosting (Vercel, Railway, Render)
- Use environment-specific API URLs
- Implement rate limiting
- Add HTTPS certificates

### Alternative Tunneling Solutions

| Solution | Pros | Cons |
|----------|------|------|
| **LocalTunnel** | Free, open-source | Often unreliable, random subdomains |
| **Cloudflare Tunnel** | Free, permanent URL | Requires Cloudflare account, more setup |
| **Serveo** | SSH-based, no client | Intermittent availability |
| **Expose (beyondco/expose)** | PHP focused | Requires Laravel Valet |
| **Tailscale Funnel** | Permanent URL, secure | Requires Tailscale network setup |

### Captive Portal Network Flow

```
[User's Phone connects to Hotspot]
         │
         ▼
[Gets IP: 192.168.137.10]
[Gateway IP: 192.168.137.1]
         │
         ▼
[User opens browser → any URL]
         │
         ▼
[Gateway DNS/Redirect intercepts]
         │
         ▼
[Redirects to http://192.168.137.1:8080/portal]
         │
         ▼
[CaptivePortal.tsx loads]
         │
         ▼
[User enters token]
         │
         ▼
[Gateway calls backend for validation]
         │
         ▼
[Success → Gateway runs: netsh advfirewall firewall add rule ...]
         │
         ▼
[User's IP (192.168.137.10) now allowed through firewall]
         │
         ▼
[Full internet access!]
```

---

## 9. HACKATHON JUDGE QUESTIONS (40 Questions with Answers)

### Basic Questions (1-10)

**Q1: What is deWifi in simple terms?**
> A: deWifi is Airbnb for WiFi - people with spare internet bandwidth can rent it out to travelers and remote workers on an hourly basis. Users find WiFi spots on a map, pay through Razorpay, and get instant access through a captive portal.

**Q2: Who are your target users?**
> A: Two groups - (1) WiFi Users: travelers, students, remote workers needing temporary internet, and (2) WiFi Owners: homeowners, cafes, co-working spaces wanting to monetize unused bandwidth.

**Q3: How do users find WiFi spots?**
> A: Through an interactive map (Leaflet + OpenStreetMap) that shows all available spots with real-time status indicators. Users can filter by city, price, speed, and venue type.

**Q4: How does payment work?**
> A: Razorpay handles all payments. Users pay upfront for their booking duration (₹30-100/hour). The platform takes 2% and owners get 98%. All Indian payment methods (UPI, cards, wallets) are supported.

**Q5: What happens after payment?**
> A: Users receive an access token (16 characters) and OTP (6 digits). They connect to the WiFi hotspot, enter the token in the captive portal, and get internet access.

**Q6: How does the WiFi owner know someone paid?**
> A: They don't need to! Everything is automated. The gateway server on the owner's laptop validates tokens with our backend and automatically grants/revokes access via Windows Firewall rules.

**Q7: What tech stack are you using?**
> A: MERN stack - MongoDB for database, Express.js for backend, React for frontend, Node.js for runtime. Plus Razorpay for payments, Leaflet for maps, and Windows Firewall for access control.

**Q8: Is this legal?**
> A: Yes, in India sharing your personal internet connection isn't illegal. However, commercial ISPs may have terms against it. This is similar to Airbnb's early challenges - regulations vary by region.

**Q9: How long did it take to build?**
> A: We built this over [X weeks/days] as a team of 4. The core functionality (booking + payment) took about [X days], and the captive portal system took another [X days].

**Q10: What makes this different from just sharing your WiFi password?**
> A: Three key differences - (1) True access control through captive portal (internet blocked until token verified), (2) Time-based access (automatically revoked when booking expires), (3) Payment integration (owners actually get paid).

---

### Concept Questions (11-18)

**Q11: What is a captive portal?**
> A: A captive portal is a web page that users see when connecting to a WiFi network before they can access the internet. Think of hotel WiFi, airport WiFi, or Starbucks WiFi - you have to log in or accept terms first. We built a captive portal that validates payment tokens.

**Q12: How do you ensure users can't share their access token?**
> A: Each token has a device limit (default 1). When a device authenticates, we create a CaptiveSession with its IP address. If another device tries to use the same token, it's rejected due to the device limit. The owner can configure higher limits if needed.

**Q13: What happens if the owner's laptop restarts?**
> A: The gateway server clears all firewall rules on shutdown (cleanup function). When it restarts, existing sessions are no longer authorized and users would need to re-authenticate. Future improvement: persist sessions to disk.

**Q14: Why use Windows Firewall instead of router-level blocking?**
> A: (1) No additional hardware needed - Windows Mobile Hotspot is built-in, (2) Easier to demo at hackathons - no router configuration, (3) Programmatic control via netsh commands, (4) IP-level blocking is effective for basic access control.

**Q15: How do you handle time zones?**
> A: All times are stored as UTC Date objects in MongoDB. The frontend converts to local time for display. JavaScript's Date handling with toLocaleDateString handles timezone conversion automatically.

**Q16: What's the 2% platform fee for?**
> A: Server hosting, payment gateway fees (~2% from Razorpay), customer support, and eventually dispute resolution. This is standard marketplace commission - lower than Airbnb's 3% + 14-20%.

**Q17: How do reviews work?**
> A: Only users with completed, paid bookings can leave reviews. Reviews are "verified" automatically. We track four dimensions: overall, speed, reliability, and value. Owners can respond to reviews.

**Q18: What's the "health check" feature?**
> A: Before booking, users can see real-time WiFi status - is it online, what's the latency, what's the uptime percentage. This data comes from periodic pings (when gateway is running) and helps users avoid booking offline spots.

---

### Technology Choice Questions (19-26)

**Q19: Why MongoDB instead of PostgreSQL?**
> A: Schema flexibility was crucial for rapid iteration. WiFi spots have varying fields (some have images, different amenities). Document model matches JavaScript naturally. Mongoose schemas still provide validation. For a hackathon, the speed advantage of not writing migrations was significant.

**Q20: Why React instead of Vue or Angular?**
> A: Team familiarity was the main factor. React 19's improved hooks and concurrent features help with real-time updates. The ecosystem (Vite, Tailwind, Framer Motion) integrates seamlessly. Vue would also have been a good choice.

**Q21: Why not use WebSockets for real-time updates?**
> A: We considered it but polling the health endpoint works well for our use case. WebSockets add complexity (reconnection handling, scaling). For v2, we'd add Socket.io for real-time session updates.

**Q22: Why Razorpay over Stripe?**
> A: Razorpay has better UPI support for Indian users. UPI is zero-fee for users and widely adopted. Stripe's India presence is growing but UPI integration isn't as mature. Test mode credentials work identically to production.

**Q23: Why not use Firebase?**
> A: Firebase would lock us into Google's ecosystem. Our custom backend gives full control over business logic (captive portal, access control). Firestore's pricing can spike unexpectedly with scale.

**Q24: Why Tailwind CSS over styled-components?**
> A: Rapid prototyping. Writing `className="px-4 py-2 bg-blue-600 text-white rounded"` is faster than defining styled components. Dark mode is trivial with `dark:` prefix. Production CSS is tiny thanks to tree-shaking.

**Q25: Could this work without a local gateway server?**
> A: Partially. The booking and payment works entirely cloud-based. The captive portal enforcement needs local infrastructure. Alternatives: configure the router directly (complex), use managed captive portal hardware (expensive).

**Q26: Why JWT instead of sessions?**
> A: Statelessness. Any server can verify a JWT without database lookup. This scales horizontally. For a single-server demo, sessions would also work, but JWT is more common in modern SPAs.

---

### Architecture Questions (27-32)

**Q27: Walk me through the data flow when a user books WiFi.**
> A: 
> 1. Frontend POSTs to /api/bookings with spotId and duration
> 2. Backend validates spot availability, calculates price
> 3. Backend calls Razorpay API to create order
> 4. Backend creates Booking document with status="pending"
> 5. Frontend receives razorpayOrderId, opens Razorpay checkout
> 6. User completes payment in Razorpay modal
> 7. Razorpay calls frontend handler with payment details
> 8. Frontend POSTs to /api/bookings/verify-payment
> 9. Backend verifies HMAC signature, updates booking to "paid"
> 10. Backend generates accessToken, returns to frontend

**Q28: How does the gateway authenticate without an internet connection?**
> A: It doesn't - the gateway needs internet to validate tokens with the backend. However, the connected users (whose internet we're blocking) can still reach the gateway at 192.168.137.1 because it's local network traffic.

**Q29: What if the backend goes down?**
> A: New authentications would fail (gateway can't validate tokens). Existing authenticated IPs would continue to work until the gateway restarts. For production, we'd cache recent valid tokens locally.

**Q30: How do you handle multiple devices per booking?**
> A: Each device creates a CaptiveSession document. The Booking has maxDevices and activeDeviceCount. Before authenticating, we check if activeDeviceCount < maxDevices. Default is 1 device to prevent sharing.

**Q31: How does the frontend know which gateway to connect to?**
> A: CaptivePortal.tsx tries multiple addresses in order: (1) same host as page, (2) 192.168.137.1:8080 (Windows default), (3) localhost:8080. It uses AbortSignal.timeout(4000) to fail fast on unreachable addresses.

**Q32: Why is the WiFi password stored in plain text?**
> A: It's revealed to paying users - encryption wouldn't add security since users need the plaintext to connect. In production, we could encrypt at rest and decrypt on read. The password is excluded from public API responses.

---

### Real World Feasibility Questions (33-36)

**Q33: Would users trust random people's WiFi?**
> A: Valid concern. Our mitigations: (1) Verified reviews from actual users, (2) Health monitoring showing reliability, (3) Escrow payments (refunds if service is bad), (4) Venues like cafes already provide WiFi. Trust builds with ratings over time.

**Q34: How do you handle ISP terms of service?**
> A: Most residential connections prohibit commercial use. Our positioning: this is "occasional sharing" not a business. Similar to Airbnb's initial gray area. Commercial owners (cafes) have business connections anyway. We'd need legal review for production.

**Q35: What's your revenue model?**
> A: 2% platform fee on all transactions. At scale: ₹100/hour average × 1000 bookings/day × 2% = ₹2000/day. Additional revenue: premium listings, owner subscriptions, enterprise packages.

**Q36: How would you scale this to 1 million users?**
> A: (1) Move to cloud infrastructure (AWS/GCP), (2) Horizontal scaling with load balancers, (3) MongoDB Atlas auto-scaling, (4) CDN for frontend assets, (5) Redis for session caching, (6) Microservices for payment/booking/auth.

---

### Edge Cases and Security (37-40)

**Q37: What if someone spoofs their IP address?**
> A: IP spoofing is difficult for TCP connections (which require two-way handshake). The firewall rules work at the IP level. MAC address filtering could add another layer but is also spoofable. True security requires enterprise APs.

**Q38: What if a user doesn't disconnect and keeps using WiFi?**
> A: The gateway's cleanup interval runs every 60 seconds. When the booking's endTime passes, the firewall allow rule is removed. The user's next request times out. They'd see "No internet" instantly.

**Q39: How do you handle payment failures?**
> A: Razorpay signature verification catches invalid/manipulated payments. If payment fails, booking stays "pending" forever. For production, we'd add: webhook handlers for async payment updates, scheduled cleanup of stale pending bookings.

**Q40: Could someone access the backend directly without paying?**
> A: Without paying, they don't have a valid accessToken. The gateway only allows IPs that have been authenticated against a valid, paid booking. Even if they knew the WiFi SSID/password, firewall blocks their internet access.

---

## 10. CRITICAL THINKING QUESTIONS (20 Questions)

These questions test deep understanding of system design and trade-offs.

**Q1: Why did you denormalize ownerName into WifiSpot instead of using a populate/join?**
> A: Spots are listed frequently but owner names change rarely. Every spot listing would require a User lookup otherwise. The trade-off: if an owner changes their name, we'd need to update all their spots. For fast reads, denormalization is worth it.

**Q2: Why store pricing breakdown (subtotal, platformFee, ownerEarnings) instead of calculating on-the-fly?**
> A: Historical accuracy. If we change the fee from 2% to 3%, old bookings should show their original prices. Also provides audit trail for disputes. Space is cheap; correctness is invaluable.

**Q3: What's the failure mode if Razorpay's API is down?**
> A: (1) createRazorpayOrder fails - frontend shows error, booking not created. (2) Webhook delays - booking stays "pending" until manual verification. Mitigation: retry with exponential backoff, fallback payment methods in production.

**Q4: Why use accessToken (16 chars) AND accessTokenOTP (6 digits)?**
> A: Different use cases. Token is for copy-paste (web form, QR code). OTP is for manual entry (phone keyboard easier for 6 digits than 16 chars). Both map to the same booking for flexibility.

**Q5: How would you handle dispute resolution?**
> A: Current: not implemented. Design: (1) Escrow payment for 24 hours, (2) User can report "didn't work" within window, (3) We investigate via session logs, (4) Full or partial refund via Razorpay API, (5) Repeated issues → owner suspension.

**Q6: Why is the gateway written in JavaScript instead of Go or Rust?**
> A: (1) Same language as backend reduces context switching, (2) npm ecosystem for HTTP server, (3) Hackathon time constraints, (4) Performance isn't critical for ~8 concurrent users. Production gateway might warrant rewrite.

**Q7: What's the security risk of storing WiFi passwords in MongoDB?**
> A: If database is breached, passwords are exposed. Mitigations: (1) MongoDB Atlas encryption at rest, (2) Network isolation (only backend can reach DB), (3) In production, encrypt passwords with app-level encryption and decrypt on demand.

**Q8: Why does CaptivePortal.tsx check for HTTPS and show a redirect card?**
> A: Mixed Content Policy. If CaptivePortal is served via ngrok (HTTPS), browser blocks HTTP fetch to gateway (192.168.137.1:8080). The redirect card tells users to open the local HTTP URL directly, bypassing the issue.

**Q9: How would you add support for multiple owners sharing one device (cafe staff)?**
> A: Design: (1) Add "team" concept linking multiple users to one owner account, (2) Role: "staff" with limited permissions, (3) Each staff can start gateway with their credentials. Or simpler: shared owner account with password management.

**Q10: What happens if two users try to book the last slot simultaneously?**
> A: No explicit locking currently. MongoDB's single-document updates are atomic. We could add: (1) Check currentUsers < maxUsers in booking route, (2) Use MongoDB transactions, (3) Optimistic locking with version numbers.

**Q11: Why auto-approve spots (isApproved: true) instead of admin review?**
> A: Hackathon simplicity. Production would need: (1) Admin dashboard, (2) Verification queue, (3) Location verification via photos, (4) Speed test requirement. Auto-approve enables frictionless demo.

**Q12: How would you implement "instant booking" vs "request to book"?**
> A: Current: instant booking (pay and access). For request mode: (1) Booking status starts as "requested", (2) Owner gets notification, (3) Owner approves/rejects in dashboard, (4) On approval, payment is captured. Would need Razorpay authorize-then-capture flow.

**Q13: Why use polling for health checks instead of the backend pushing updates?**
> A: Simplicity. Pushing requires WebSockets or Server-Sent Events, connection management, reconnection logic. Health data isn't real-time critical (checking once per minute is fine). For live session status, we'd add WebSockets.

**Q14: How would you handle users in different countries?**
> A: (1) Multi-currency support (Razorpay supports USD, etc.), (2) Internationalization (i18n) for UI text, (3) Time zone handling (already UTC-based), (4) Compliance with local regulations (GDPR for EU). The architecture is location-agnostic.

**Q15: What's your strategy for testing the captive portal flow?**
> A: (1) Unit tests for gateway auth logic, (2) Integration tests with mock backend, (3) Manual testing: one laptop as gateway, phone as client, (4) Test matrix: Windows 10, Windows 11, different phone OSes. Documented in CAPTIVE_PORTAL_TEST_RESULTS.md.

**Q16: Why use Framer Motion for animations instead of CSS animations?**
> A: (1) Declarative API fits React model, (2) AnimatePresence for exit animations, (3) Gesture support (drag, tap), (4) Layout animations for smooth list reordering. CSS animations can't easily handle element removal animations.

**Q17: How would you add offline support?**
> A: (1) Service Worker to cache frontend assets, (2) Local storage for viewed spots, (3) Queue bookings for sync when online, (4) Background sync API. The captive portal itself requires network, but exploration could be offline.

**Q18: What's your testing strategy for the payment flow?**
> A: (1) Use Razorpay test mode exclusively, (2) Test cards from Razorpay docs, (3) Verify signature validation with known good/bad signatures, (4) Check refund flow. Never test with real money until production-ready.

**Q19: How would you implement a referral system?**
> A: (1) Unique referral codes per user, (2) Track signups with referral code, (3) Reward on first successful booking (both referrer and referee), (4) Store in User document or separate Referral collection. Consider fraud prevention (self-referral).

**Q20: If you had to remove one feature to simplify, what would it be?**
> A: The monitoring/health check system. It adds complexity (pingHistory, freshness calculations) and requires gateway running for accurate data. Core value prop works without it: book, pay, get token, authenticate. Health is nice-to-have optimization.

---

## 11. LIMITATIONS

### Current System Limitations

1. **Windows-Only Gateway**: Gateway uses Windows Firewall commands (netsh). Linux/Mac would need iptables/pf rules.

2. **Single Hotspot Limit**: Windows Mobile Hotspot supports ~8 clients. Production would need commercial APs.

3. **No Real-Time Session Updates**: Frontend polls for status. Users don't see instant notifications when time is running out.

4. **No Owner Payouts**: Owners don't actually receive money yet. Need Razorpay Route API for split payments.

5. **No Admin Dashboard**: No way to verify spots, handle disputes, or view platform analytics.

6. **No Speed Testing**: We show claimed speedMbps but don't verify it. Could integrate Speedtest API.

7. **No Geolocation Verification**: Owner could list fake location. Need photo verification or IP geolocation.

8. **No Offline Resilience**: If backend is down, new bookings and authentications fail completely.

9. **Token Sharing Risk**: Users could screenshot token and share before device limit is reached.

10. **No Multi-Language Support**: UI is English-only. India has 22 official languages.

---

## 12. FUTURE IMPROVEMENTS

### Short-Term (v1.1 - 2-4 weeks)

1. **Owner Payouts**: Integrate Razorpay Route for automatic daily settlements to owner bank accounts.

2. **Push Notifications**: Use Firebase Cloud Messaging for booking confirmations and session expiry warnings.

3. **Mobile App**: React Native app for better captive portal experience and push notifications.

4. **Speed Tests**: Periodic actual speed tests using fast.com API, stored in monitoring data.

5. **QR Code Generation**: Generate QR codes that encode the captive portal URL with token for easy scanning.

### Medium-Term (v2.0 - 2-3 months)

6. **Admin Dashboard**: Next.js admin panel for spot verification, dispute resolution, analytics.

7. **Cross-Platform Gateway**: Rewrite gateway in Go with iptables (Linux), pf (Mac), and netsh (Windows) support.

8. **Enterprise SSO**: Allow businesses to integrate with OAuth providers for employee WiFi access.

9. **Usage Analytics**: Track bandwidth per session, busy hours, popular spots for owners.

10. **Dynamic Pricing**: Suggest prices based on demand, time of day, nearby competition.

### Long-Term (v3.0 - 6+ months)

11. **IoT Integration**: Hardware device (Raspberry Pi-based) for reliable captive portal without owner laptop.

12. **Mesh Network Support**: Multiple APs under one spot for larger venues.

13. **API Platform**: Public API for third-party integrations (hotels, event apps).

14. **International Expansion**: Multi-currency, compliance with GDPR, SOC2 certification.

15. **Blockchain Payments**: Accept cryptocurrency for privacy-conscious users.

---

## 13. ONE MINUTE PITCH

### The Problem (15 seconds)
> "Have you ever been frustrated by expensive hotel WiFi? Or struggled to find reliable internet while traveling? Millions of people face this daily, while at the same time, millions of homes have ultra-fast internet sitting idle."

### The Solution (20 seconds)
> "deWifi is Airbnb for WiFi. Homeowners and cafes list their spare bandwidth on our map. Travelers find nearby spots, pay per hour through UPI, and get instant access. No passwords to share, no awkward requests - just scan, pay, and connect."

### How It Works (15 seconds)
> "Our captive portal technology - the same tech used by airports and hotels - ensures only paying customers get access. Payment through Razorpay is instant. The WiFi owner doesn't even need to be home - everything is automated."

### The Impact (10 seconds)
> "Users save 70% compared to hotel WiFi. Owners earn passive income from their existing connection. We take just 2%. It's peer-to-peer sharing economy for connectivity."

---

## 14. DEEP TECHNICAL EXPLANATION

### For Technical Judges

**Authentication Flow:**
We implement stateless JWT authentication. On signup/signin, the server signs a JWT containing `{id: userId}` using HMAC-SHA256 with a secret key. The token is valid for 7 days. Every protected route uses the `protect` middleware which extracts the token from `Authorization: Bearer <token>`, verifies the signature, and attaches `userId` to the request object.

**Payment Security:**
Razorpay uses a webhook/callback pattern. When creating an order, we generate a unique `receiptId` containing the timestamp and partial userId. After the user pays, Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The signature is an HMAC-SHA256 of `orderId|paymentId` using our secret. We verify this server-side before marking payment as successful - this prevents payment tampering.

**Captive Portal Architecture:**
The gateway server (Express on port 8080) acts as the captive portal controller. When a device connects to the Windows Mobile Hotspot, Windows assigns it an IP in the 192.168.137.x range. By default, all traffic from these IPs can reach the internet through Windows' NAT/ICS. We add deny rules first, then add specific allow rules for authenticated IPs.

```javascript
// Pseudo-code for firewall management
async function allowIP(ip) {
  await runCmd(`netsh advfirewall firewall delete rule name="deWifi_Block_${ip}"`);
  await runCmd(`netsh advfirewall firewall add rule name="deWifi_Allow_${ip}" dir=in action=allow remoteip=${ip}`);
}
```

**Token Generation:**
Access tokens are 16-character alphanumeric strings generated using `crypto.randomBytes(8).toString('hex')`. OTPs are 6 random digits. Both are stored in the Booking document. The token has higher entropy (16^16 combinations) while OTP is user-friendly (10^6 combinations).

**Database Indexing Strategy:**
- `User.email`: unique index for login lookup
- `WifiSpot.city, WifiSpot.tag, WifiSpot.isActive`: compound index for filtering
- `Booking.accessToken`: index for captive portal authentication (O(log n) lookup)
- `CaptiveSession.sessionToken, expiresAt`: compound index for session validation

**Frontend State Management:**
We use React Context for auth (AuthContext) and theme (ThemeContext). Component-level state uses useState/useEffect hooks. The `useSpots` custom hook implements the fetch-cache-refetch pattern with loading/error states.

**Vite Proxy Deep Dive:**
The proxy in `vite.config.ts` intercepts `/api/*` requests during development. The `changeOrigin: true` option rewrites the `Host` header to match the target (localhost:3000). This lets us develop with a single origin, avoiding CORS entirely. In production, we'd configure nginx to proxy `/api` to the backend service.

**Mixed Content Handling:**
When the React app is served over HTTPS (via ngrok), browsers block HTTP requests to the local gateway. Our solution: detect `window.location.protocol === 'https:'`, recognize that gateway fetch will fail, and show a redirect card telling users to open `http://192.168.137.1:8080` directly.

---

## Appendix: Commands Reference

### Starting the Development Environment

```powershell
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: ngrok tunnel (for payment testing)
ngrok http 5173

# Terminal 4: Gateway (as Administrator)
cd gateway
npm install
node gateway.js --spot <YOUR_SPOT_ID>
```

### Test Credentials (Razorpay)

```
Test Card: 4111 1111 1111 1111
Any future expiry date
Any CVV
OTP: 1234

Test UPI: success@razorpay
```

### Seeding Test Data

```powershell
cd backend
npm run seed  # Adds sample WiFi spots
```

---

*Generated for QuadCoders Hackathon Preparation*  
*deWifi - Democratizing WiFi Access*
