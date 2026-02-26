# WiFi Sharing Marketplace - Development Plan

**Team:** QuadCoders  
**Team Members:** Yash Urade, Samiksha Musale, Vaidehi Narkhede, Spandan Mali  
**Tech Stack:** MERN (MongoDB, Express, React, Node.js)  
**Payment Gateway:** Razorpay (Test APIs)  
**Authentication:** In-built JWT (WifiUser, WifiOwner, Admin roles)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Schema Design](#database-schema-design)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [Frontend Pages](#frontend-pages)
5. [Required Packages](#required-packages)
6. [Project Structure](#project-structure)
7. [Development Phases](#development-phases)
8. [Key Features & Business Logic](#key-features--business-logic)

---

## Project Overview

A peer-to-peer WiFi sharing marketplace where:
- **WiFi Owners** can monetize their unused bandwidth by listing their WiFi spots
- **Users** can discover and book WiFi access for flexible durations (pay-per-hour)
- **Platform** charges 2% fee, owners keep 98% earnings
- **Payments** handled via Razorpay with automatic settlement
- **Map-based discovery** for finding nearby WiFi spots

**Core Value Proposition:**
- Users: Pay ₹30-100/hour instead of ₹500-1000/day for hotel WiFi
- Owners: Earn ₹2000-8000/month passive income from existing internet
- No blockchain complexity - pure MERN stack solution

---

## Database Schema Design

### 1. User Schema
**Collection:** `users`

```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed with bcrypt),
  role: String (enum: ["user", "owner", "admin"], default: "user"),
  phone: String (required),
  avatar: String (URL, default: placeholder),
  wallet: {
    balance: Number (default: 0),
    currency: String (default: "INR")
  },
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- email (unique)
- role
```

### 2. WifiSpot Schema
**Collection:** `wifispots`

```javascript
{
  owner: ObjectId (ref: "User", required),
  name: String (required, e.g., "Yash's Home WiFi"),
  description: String,
  location: {
    type: String (enum: ["Point"], required),
    coordinates: [Number] ([longitude, latitude], required)
  },
  address: {
    street: String,
    city: String (required),
    state: String (required),
    pincode: String (required),
    country: String (default: "India")
  },
  pricePerHour: Number (required, min: 10, max: 500),
  ssid: String (required),
  password: String (required, encrypted),
  speedMbps: Number (required, e.g., 50),
  maxUsers: Number (default: 5),
  currentUsers: Number (default: 0),
  isActive: Boolean (default: true),
  isApproved: Boolean (default: false, admin moderation),
  amenities: [String] (e.g., ["AC", "Seating", "Power Outlet", "Parking"]),
  images: [String] (URLs, max: 5),
  rating: {
    average: Number (Connectivity, everywhere
default: 0),
    count: Number (default: 0)
  },
  availableHours: {
    from: String (e.g., "09:00"),
    to: String (e.g., "22:00")
  },
  totalEarnings: Number (default: 0),
  totalBookings: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- location (2dsphere for geo-queries)
- owner
- isActive, isApproved
- city, state
```

### 3. Booking Schema
**Collection:** `bookings`

```javascript
{
  user: ObjectId (ref: "User", required),
  wifiSpot: ObjectId (ref: "WifiSpot", required),
  owner: ObjectId (ref: "User", required),
  
  startTime: Date (required),
  endTime: Date (required),
  duration: Number (hours, required),
  
  amount: Number (total amount in INR),
  platformFee: Number (2% of amount),
  ownerEarning: Number (98% of amount),
  
  status: String (enum: [
    "pending",      // Payment not completed
    "active",       // Currently active session
    "completed",    // Session ended successfully
    "cancelled",    // Cancelled by user/owner
    "disputed"      // Dispute raised
  ], default: "pending"),
  
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  paymentStatus: String (enum: ["pending", "paid", "refunded"], default: "pending"),
  
  wifiCredentials: {
    ssid: String,
    password: String
  },
  
  autoCompleteAt: Date,
  actualEndTime: Date,
  
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- user, wifiSpot, owner
- status, paymentStatus
- startTime, endTime
- razorpayPaymentId (unique, sparse)
```

### 4. Review Schema
**Collection:** `reviews`

```javascript
{
  user: ObjectId (ref: "User", required),
  wifiSpot: ObjectId (ref: "WifiSpot", required),
  booking: ObjectId (ref: "Booking", required, unique),
  
  rating: Number (required, min: 1, max: 5),
  comment: String (max: 500 chars),
  
  speedRating: Number (1-5),
  reliabilityRating: Number (1-5),
  locationRating: Number (1-5),
  
  ownerResponse: String,
  ownerResponseAt: Date,
  
  isHidden: Boolean (default: false),
  
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- wifiSpot
- user
- booking (unique)
```

### 5. Transaction Schema
**Collection:** `transactions`

```javascript
{
  user: ObjectId (ref: "User", required),
  type: String (enum: [
    "booking_payment",    // User paid for booking
    "owner_earning",      // Owner earned from booking
    "refund",            // Refund to user
    "withdrawal",        // Owner withdrew earnings
    "platform_fee"       // Platform fee collected
  ], required),
  
  amount: Number (required),
  currency: String (default: "INR"),
  
  booking: ObjectId (ref: "Booking"),
  
  razorpayPaymentId: String,
  razorpayRefundId: String,
  razorpayTransferId: String,
  
  status: String (enum: ["pending", "completed", "failed"], default: "pending"),
  
  description: String,
  metadata: Object,
  
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- user
- type, status
- booking
- createdAt (for sorting)
```

### 6. Dispute Schema
**Collection:** `disputes`

```javascript
{
  booking: ObjectId (ref: "Booking", required, unique),
  raisedBy: ObjectId (ref: "User", required),
  against: ObjectId (ref: "User", required),
  
  reason: String (enum: [
    "connectivity_issue",
    "wrong_credentials",
    "slow_speed",
    "location_issue",
    "owner_unavailable",
    "other"
  ], required),
  
  description: String (required, max: 1000 chars),
  evidence: [String] (image URLs),
  
  status: String (enum: ["open", "investigating", "resolved", "rejected"], default: "open"),
  
  resolution: String,
  refundAmount: Number,
  
  resolvedBy: ObjectId (ref: "User"),
  resolvedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- booking (unique)
- raisedBy, against
- status
```

---

## Backend API Endpoints

### Authentication Routes
**Base URL:** `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user (user/owner role) |
| POST | `/login` | Public | Login with email/password, returns JWT |
| GET | `/me` | Protected | Get current user profile |
| PUT | `/me` | Protected | Update user profile |
| PUT | `/change-password` | Protected | Change password |
| POST | `/logout` | Protected | Logout (optional, for token blacklisting) |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password/:token` | Public | Reset password with token |

**Request/Response Examples:**

```javascript
// POST /api/auth/register
Request: {
  name: "Yash Urade",
  email: "yash@example.com",
  password: "SecurePass123",
  phone: "9876543210",
  role: "owner"
}
Response: {
  success: true,
  user: { id, name, email, role },
  token: "jwt_token_here"
}

// POST /api/auth/login
Request: {
  email: "yash@example.com",
  password: "SecurePass123"
}
Response: {
  success: true,
  user: { id, name, email, role },
  token: "jwt_token_here"
}
```

---

### WiFi Spot Routes
**Base URL:** `/api/spots`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all spots with filters & pagination |
| GET | `/nearby` | Public | Get nearby spots (geo-query) |
| GET | `/:id` | Public | Get single spot details |
| POST | `/` | Owner | Create new WiFi spot |
| PUT | `/:id` | Owner | Update own spot |
| DELETE | `/:id` | Owner | Delete own spot |
| GET | `/owner/my-spots` | Owner | Get owner's all spots |
| POST | `/:id/toggle-active` | Owner | Activate/deactivate spot |

**Query Parameters for GET `/`:**
```
?city=Pune
&minPrice=20
&maxPrice=100
&minSpeed=50
&minRating=4
&amenities=AC,Parking
&page=1
&limit=20
&sort=-rating (or pricePerHour, -createdAt)
```

**Query Parameters for GET `/nearby`:**
```
?lat=18.5204
&lng=73.8567
&radius=5000 (meters, default: 5000)
&maxResults=50
```

**Request/Response Examples:**

```javascript
// POST /api/spots
Request: {
  name: "Yash's Home WiFi",
  description: "High-speed fiber connection with AC seating",
  location: {
    type: "Point",
    coordinates: [73.8567, 18.5204]
  },
  address: {
    street: "123 Main St",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411033"
  },
  pricePerHour: 50,
  ssid: "HomeWiFi_5G",
  password: "SecurePass123",
  speedMbps: 100,
  maxUsers: 3,
  amenities: ["AC", "Seating", "Power Outlet"],
  images: ["url1", "url2"],
  availableHours: {
    from: "09:00",
    to: "22:00"
  }
}
Response: {
  success: true,
  spot: { ...spotData }
}
```

---

### Booking Routes
**Base URL:** `/api/bookings`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | User | Create booking & Razorpay order |
| POST | `/verify-payment` | User | Verify Razorpay payment & activate booking |
| GET | `/my-bookings` | User | Get user's all bookings |
| GET | `/owner/bookings` | Owner | Get owner's received bookings |
| GET | `/:id` | User/Owner | Get booking details with WiFi credentials |
| PUT | `/:id/cancel` | User/Owner | Cancel booking & process refund |
| PUT | `/:id/complete` | System/User | Mark booking as completed |
| GET | `/active` | User | Get currently active bookings |

**Request/Response Examples:**

```javascript
// POST /api/bookings
Request: {
  wifiSpotId: "spot_id_here",
  duration: 3 (hours)
}
Response: {
  success: true,
  booking: { ...bookingData },
  razorpayOrder: {
    orderId: "order_xxx",
    amount: 150,
    currency: "INR",
    key: "rzp_test_xxx"
  }
}

// POST /api/bookings/verify-payment
Request: {
  bookingId: "booking_id",
  razorpay_order_id: "order_xxx",
  razorpay_payment_id: "pay_xxx",
  razorpay_signature: "signature_xxx"
}
Response: {
  success: true,
  booking: {
    ...bookingData,
    status: "active",
    wifiCredentials: {
      ssid: "HomeWiFi_5G",
      password: "SecurePass123"
    }
  }
}
```

---

### Review Routes
**Base URL:** `/api/reviews`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | User | Add review (only after completed booking) |
| GET | `/spot/:spotId` | Public | Get all reviews for a spot |
| GET | `/user/:userId` | Public | Get reviews written by user |
| GET | `/my-reviews` | User | Get user's own reviews |
| PUT | `/:id` | User | Edit own review |
| DELETE | `/:id` | User | Delete own review |
| POST | `/:id/response` | Owner | Owner respond to review |

**Request/Response Examples:**

```javascript
// POST /api/reviews
Request: {
  bookingId: "booking_id",
  rating: 5,
  comment: "Excellent WiFi connection and great host!",
  speedRating: 5,
  reliabilityRating: 4,
  locationRating: 5
}
Response: {
  success: true,
  review: { ...reviewData }
}
```

---

### Payment Routes
**Base URL:** `/api/payments`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/create-order` | User | Create Razorpay order for booking |
| POST | `/verify` | User | Verify Razorpay payment signature |
| POST | `/refund/:bookingId` | System/Admin | Process refund |
| GET | `/transactions` | User | Get user's transaction history |
| GET | `/owner/earnings` | Owner | Get owner's earnings summary |
| POST | `/withdraw` | Owner | Request withdrawal (future feature) |

---

### Admin Routes
**Base URL:** `/api/admin`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin | Get platform stats & analytics |
| GET | `/users` | Admin | List all users with filters |
| PUT | `/users/:id/toggle-ban` | Admin | Ban/unban user |
| GET | `/spots` | Admin | List all spots (pending approval) |
| PUT | `/spots/:id/approve` | Admin | Approve/reject spot |
| GET | `/bookings` | Admin | List all bookings |
| GET | `/transactions` | Admin | All platform transactions |
| GET | `/disputes` | Admin | List all disputes |
| PUT | `/disputes/:id/resolve` | Admin | Resolve dispute |
| GET | `/reports` | Admin | Generate revenue/usage reports |

---

### Dispute Routes
**Base URL:** `/api/disputes`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | User/Owner | Raise dispute on booking |
| GET | `/my-disputes` | User/Owner | Get user's disputes |
| GET | `/:id` | User/Owner/Admin | Get dispute details |
| PUT | `/:id` | Admin | Update dispute status |
| POST | `/:id/resolve` | Admin | Resolve dispute with decision |

---

## Frontend Pages

### 1. Landing/Home Page
**Route:** `/`  
**Access:** Public

**Sections:**
- Hero section with CTA ("Find WiFi Near You" / "List Your WiFi")
- How it works (3-step process for users & owners)
- Live stats (Total spots, Active users, Money saved)
- Featured spots carousel
- Testimonials
- Pricing comparison (Hotel WiFi vs Our Platform)
- FAQ section
- Footer with links

**Components:**
- `Hero.tsx`
- `HowItWorks.tsx`
- `StatsBar.tsx`
- `FeaturedSpots.tsx`
- `Testimonials.tsx`

---

### 2. Login Page
**Route:** `/login`  
**Access:** Public (redirect if authenticated)

**Features:**
- Email/password form
- "Remember me" checkbox
- Forgot password link
- Social login (future)
- Link to signup

**Components:**
- `LoginForm.tsx`

---

### 3. Signup Page
**Route:** `/signup`  
**Access:** Public (redirect if authenticated)

**Features:**
- Role selection (User / Owner) with toggle
- Name, email, phone, password fields
- Terms & conditions checkbox
- Link to login

**Components:**
- `SignupForm.tsx`
- `RoleSelector.tsx`

---

### 4. Map Explorer Page
**Route:** `/explore`  
**Access:** Public

**Features:**
- Full-screen interactive map (Leaflet)
- Spot markers (clustered when zoomed out)
- Sidebar with filters:
  - Price range slider
  - Minimum speed
  - Minimum rating
  - Amenities checkboxes
  - Search by city/area
- Click marker → show spot card popup
- "View Details" button on popup → navigate to spot details

**Components:**
- `MapView.tsx` (Leaflet integration)
- `SpotMarker.tsx` (custom marker with pricing badge)
- `FilterSidebar.tsx`
- `SpotCardPopup.tsx`

**Libraries:**
- react-leaflet
- leaflet
- leaflet.markercluster

---

### 5. Spot Details Page
**Route:** `/spots/:id`  
**Access:** Public

**Features:**
- Image gallery/carousel
- Spot name, description, rating
- Pricing (₹X/hour)
- Specifications (Speed, Max users, Available hours)
- Amenities badges
- Location map (small embedded map)
- Owner info card (name, rating, join date)
- Reviews section with pagination
- "Book Now" button (sticky CTA)

**Components:**
- `ImageGallery.tsx`
- `SpotInfo.tsx`
- `OwnerCard.tsx`
- `ReviewsList.tsx`
- `BookingCTA.tsx`

---

### 6. Booking/Checkout Page
**Route:** `/book/:spotId`  
**Access:** Protected (User only)

**Features:**
- Spot summary card
- Duration selector (hours, using slider/dropdown)
- Date/time picker (start time)
- Price breakdown:
  - Hourly rate × hours
  - Platform fee (2%)
  - Total amount
- "Proceed to Pay" → Razorpay modal
- After payment → redirect to active session

**Components:**
- `BookingForm.tsx`
- `DurationSelector.tsx`
- `PriceBreakdown.tsx`
- `RazorpayCheckout.tsx`

---

### 7. User Dashboard
**Route:** `/dashboard`  
**Access:** Protected (User only)

**Tabs:**
- **Active Bookings:** Current sessions with timer, WiFi credentials
- **Upcoming:** Scheduled bookings
- **History:** Past bookings with review option
- **Wallet:** Balance, transaction history
- **Reviews:** Reviews given to spots

**Components:**
- `DashboardLayout.tsx`
- `ActiveBookingCard.tsx` (with countdown timer)
- `BookingHistoryTable.tsx`
- `WalletSection.tsx`
- `TransactionList.tsx`

---

### 8. Owner Dashboard
**Route:** `/owner/dashboard`  
**Access:** Protected (Owner only)

**Sections:**
- **Overview Cards:**
  - Total earnings (all-time & this month)
  - Active bookings count
  - Total spots
  - Average rating
- **Earnings Chart:** Monthly revenue graph (Recharts)
- **My Spots:** Grid/list of owned spots with quick actions (edit, toggle active)
- **Incoming Bookings:** Table with accept/decline options
- **Recent Reviews:** Latest reviews received
- **Add Spot** button (prominent CTA)

**Components:**
- `OwnerStatsCards.tsx`
- `EarningsChart.tsx`
- `MySpotsList.tsx`
- `IncomingBookingsTable.tsx`

---

### 9. Add/Edit Spot Page
**Route:** `/owner/spots/new` (add) or `/owner/spots/:id/edit` (edit)  
**Access:** Protected (Owner only)

**Form Fields:**
- Basic Info: Name, description
- Location: 
  - Map picker (click to set coordinates)
  - Address autocomplete
- Pricing: Hourly rate (₹)
- WiFi Details: SSID, password (encrypted before save)
- Specifications: Speed (Mbps), max users
- Availability: Time range (from-to)
- Amenities: Multi-select checkboxes
- Images: Upload up to 5 images
- Preview before submit

**Components:**
- `SpotForm.tsx`
- `MapPicker.tsx` (Leaflet with click-to-place marker)
- `AddressAutocomplete.tsx`
- `ImageUploader.tsx`
- `AmenitiesSelector.tsx`

---

### 10. Admin Dashboard
**Route:** `/admin`  
**Access:** Protected (Admin only)

**Tabs:**
- **Overview:** Platform stats, revenue, growth charts
- **Users:** List with search, filter, ban/unban
- **Spots:** Pending approvals, moderation queue
- **Bookings:** All bookings with status filters
- **Disputes:** Open disputes requiring resolution
- **Transactions:** All payment transactions
- **Reports:** Generate CSV/PDF reports

**Components:**
- `AdminStatsCards.tsx`
- `UserManagementTable.tsx`
- `SpotModerationTable.tsx`
- `DisputeQueue.tsx`
- `RevenueChart.tsx`

---

### 11. Profile Page
**Route:** `/profile`  
**Access:** Protected

**Features:**
- Edit profile form (name, phone, avatar)
- Rating & reputation display
- Badge achievements (future)
- Account settings (email, password)
- Logout button

**Components:**
- `ProfileForm.tsx`
- `AvatarUpload.tsx`
- `ReputationCard.tsx`

---

### 12. Active Session Page
**Route:** `/session/:bookingId`  
**Access:** Protected (User only)

**Features:**
- Large countdown timer (HH:MM:SS remaining)
- WiFi credentials display (SSID, password with copy button)
- QR code for easy WiFi connection
- Connection quality indicator
- "Extend Session" button
- "Report Issue" button → opens dispute form
- Auto-redirect when session ends

**Components:**
- `SessionTimer.tsx`
- `WiFiCredentials.tsx`
- `QRCodeDisplay.tsx`
- `ExtendSessionModal.tsx`

---

### 13. Transaction History Page
**Route:** `/transactions`  
**Access:** Protected

**Features:**
- Table with columns: Date, Type, Amount, Status, Details
- Filters: Date range, transaction type
- Export to CSV
- Search by transaction ID

**Components:**
- `TransactionTable.tsx`
- `TransactionFilters.tsx`

---

## Required Packages

### Backend Dependencies

```bash
# Install production dependencies
npm install bcryptjs jsonwebtoken razorpay multer cloudinary zod crypto-js

# Install dev dependencies
npm install @types/bcryptjs @types/jsonwebtoken @types/multer --save-dev
```

**Package Details:**
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `razorpay` - Payment gateway integration
- `multer` - File upload handling
- `cloudinary` - Image storage (or use local storage)
- `zod` - Request validation
- `crypto-js` - Encrypt WiFi passwords

### Frontend Dependencies

```bash
# Install production dependencies
npm install react-router-dom axios react-leaflet leaflet zustand date-fns recharts react-qr-code

# Install dev dependencies
npm install @types/leaflet --save-dev
```

**Package Details:**
- `react-router-dom` - Routing
- `axios` - HTTP client
- `react-leaflet` + `leaflet` - Map integration
- `zustand` - State management (lightweight alternative to Redux)
- `date-fns` - Date/time formatting
- `recharts` - Charts for dashboards
- `react-qr-code` - QR code generator for WiFi credentials

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── server.ts                 # Entry point
│   ├── config/
│   │   ├── db.ts                 # MongoDB connection
│   │   ├── razorpay.ts           # Razorpay instance
│   │   └── cloudinary.ts         # Image storage config
│   ├── models/
│   │   ├── User.ts
│   │   ├── WifiSpot.ts
│   │   ├── Booking.ts
│   │   ├── Review.ts
│   │   ├── Transaction.ts
│   │   └── Dispute.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── spot.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── review.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── admin.routes.ts
│   │   └── dispute.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── spot.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── review.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── admin.controller.ts
│   │   └── dispute.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── role.middleware.ts     # Role-based access
│   │   ├── validate.middleware.ts # Zod validation
│   │   ├── upload.middleware.ts   # Multer config
│   │   └── error.middleware.ts    # Error handler
│   ├── services/
│   │   ├── razorpay.service.ts   # Payment operations
│   │   ├── email.service.ts       # Email notifications
│   │   └── crypto.service.ts      # WiFi password encryption
│   ├── utils/
│   │   ├── geo.utils.ts          # Geo-query helpers
│   │   ├── validation.schemas.ts  # Zod schemas
│   │   └── helpers.ts             # Common utilities
│   └── types/
│       └── index.ts               # TypeScript interfaces
├── mongo-data/                    # Local MongoDB data
├── uploads/                       # Uploaded images (if not using cloud)
├── .env
├── package.json
└── tsconfig.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Explore.tsx
│   │   ├── SpotDetails.tsx
│   │   ├── Checkout.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── AddSpot.tsx
│   │   ├── EditSpot.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── ActiveSession.tsx
│   │   └── Transactions.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── SpotMarker.tsx
│   │   │   ├── MapPicker.tsx
│   │   │   └── FilterSidebar.tsx
│   │   ├── booking/
│   │   │   ├── BookingForm.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   ├── SessionTimer.tsx
│   │   │   └── WiFiCredentials.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── EarningsChart.tsx
│   │   │   ├── BookingTable.tsx
│   │   │   └── SpotCard.tsx
│   │   ├── spot/
│   │   │   ├── SpotForm.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── OwnerCard.tsx
│   │   │   └── AmenitiesSelector.tsx
│   │   └── ui/               # Existing shadcn components
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSpots.ts
│   │   ├── useBookings.ts
│   │   ├── useReviews.ts
│   │   └── useRazorpay.ts
│   ├── services/
│   │   ├── api.ts            # Axios instance
│   │   ├── auth.service.ts
│   │   ├── spot.service.ts
│   │   ├── booking.service.ts
│   │   ├── payment.service.ts
│   │   └── review.service.ts
│   ├── store/
│   │   ├── authStore.ts      # Zustand auth state
│   │   ├── spotStore.ts
│   │   └── bookingStore.ts
│   ├── lib/
│   │   └── utils.ts          # Existing utilities
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── assets/
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Development Phases

### Phase 1: Foundation & Authentication (Week 1)
**Priority: CRITICAL**

**Backend Tasks:**
- ✅ Setup project structure
- ✅ Create MongoDB connection (`config/db.ts`)
- ✅ Create User model with roles
- ✅ Implement auth routes (register, login, getMe)
- ✅ Create JWT middleware
- ✅ Create role middleware
- ✅ Setup error handling middleware
- ✅ Create validation schemas (Zod)

**Frontend Tasks:**
- ✅ Setup React Router
- ✅ Create Navbar & Footer components
- ✅ Create Login page with form validation
- ✅ Create Signup page with role selection
- ✅ Setup Axios instance with auth interceptor
- ✅ Create auth service & Zustand store
- ✅ Create ProtectedRoute component
- ✅ Create basic Home page

**Deliverables:**
- Users can register as User/Owner
- Users can login and get JWT token
- Protected routes work correctly
- Role-based access control implemented

---

### Phase 2: WiFi Spot Management (Week 2)
**Priority: HIGH**

**Backend Tasks:**
- ✅ Create WifiSpot model with geo-indexing
- ✅ Implement spot CRUD routes
- ✅ Implement geo-query for nearby spots
- ✅ Setup image upload (multer + cloudinary)
- ✅ Implement filters & pagination
- ✅ Encrypt WiFi passwords before storing

**Frontend Tasks:**
- ✅ Create Map Explorer page (Leaflet integration)
- ✅ Create spot markers with clustering
- ✅ Create filter sidebar with price/speed/rating filters
- ✅ Create Spot Details page
- ✅ Create Add/Edit Spot page for owners
- ✅ Create MapPicker component
- ✅ Create ImageUploader component
- ✅ Create Owner Dashboard (basic)

**Deliverables:**
- Owners can add WiFi spots with location, pricing, images
- Users can browse spots on map
- Users can filter by location, price, speed
- Spot details page shows all info

---

### Phase 3: Bookings & Payments (Week 3)
**Priority: CRITICAL**

**Backend Tasks:**
- ✅ Create Booking model
- ✅ Create Transaction model
- ✅ Setup Razorpay config
- ✅ Implement create booking + Razorpay order
- ✅ Implement payment verification
- ✅ Implement booking status updates
- ✅ Auto-complete bookings after endTime
- ✅ Implement refund logic
- ✅ Decrypt & return WiFi credentials after payment

**Frontend Tasks:**
- ✅ Create Checkout page with Razorpay integration
- ✅ Create duration selector
- ✅ Create price breakdown component
- ✅ Create Active Session page with timer
- ✅ Create WiFi credentials display with QR code
- ✅ Create booking cards for dashboards
- ✅ Update User Dashboard with active/upcoming bookings

**Deliverables:**
- Users can book WiFi for X hours
- Razorpay test payment flow works
- After payment, WiFi credentials revealed
- Platform fee (2%) auto-calculated
- Owner earnings credited
- Bookings auto-complete after duration

---

### Phase 4: Dashboards & User Experience (Week 4)
**Priority: MEDIUM**

**Backend Tasks:**
- ✅ Create dashboard stats endpoints
- ✅ Implement transaction history API
- ✅ Implement earnings summary for owners
- ✅ Create analytics queries (total bookings, revenue)

**Frontend Tasks:**
- ✅ Complete User Dashboard (all tabs)
- ✅ Complete Owner Dashboard with charts (Recharts)
- ✅ Create earnings chart (monthly revenue)
- ✅ Create transaction history page
- ✅ Create wallet section
- ✅ Create booking history table
- ✅ Add loading states & error handling
- ✅ Improve UX/UI polish

**Deliverables:**
- Users see active bookings, history, wallet
- Owners see earnings chart, incoming bookings
- Transaction history fully functional
- Responsive design for mobile

---

### Phase 5: Reviews & Trust System (Week 5)
**Priority: MEDIUM**

**Backend Tasks:**
- ✅ Create Review model
- ✅ Implement review CRUD routes
- ✅ Update spot rating after each review
- ✅ Update user rating (owner rating)
- ✅ Restrict reviews to completed bookings only

**Frontend Tasks:**
- ✅ Create review form (modal or page)
- ✅ Create reviews list component
- ✅ Display star ratings on spot details
- ✅ Display owner rating on owner card
- ✅ Add "Write Review" button after completed booking
- ✅ Create rating breakdown (5-star chart)

**Deliverables:**
- Users can review spots after session
- Spot & owner ratings update automatically
- Reviews visible on spot details page
- 5-star rating system with comments

---

### Phase 6: Admin Panel & Final Features (Week 6)
**Priority: LOW

**Backend Tasks:**
- ✅ Create Dispute model
- ✅ Implement admin routes
- ✅ Create dashboard stats for admin
- ✅ Implement spot approval system
- ✅ Implement user ban/unban
- ✅ Implement dispute resolution
- ✅ Create refund processing

**Frontend Tasks:**
- ✅ Create Admin Dashboard
- ✅ Create user management table
- ✅ Create spot moderation queue
- ✅ Create dispute resolution interface
- ✅ Create platform analytics charts
- ✅ Polish Landing page
- ✅ Create "How It Works" section
- ✅ Create FAQ section
- ✅ Add testimonials

**Deliverables:**
- Admin can view all platform stats
- Admin can approve/reject spots
- Admin can ban users
- Admin can resolve disputes
- Complete landing page
- Platform ready for demo

---

## Key Features & Business Logic

### 1. Payment Flow
```
1. User selects spot & duration
2. Frontend calculates: amount = pricePerHour × duration
3. Backend creates Booking (status: "pending")
4. Backend creates Razorpay order
5. Frontend shows Razorpay modal
6. User completes payment
7. Razorpay callback → Frontend calls verify-payment API
8. Backend verifies signature
9. Backend updates Booking (status: "active", paymentStatus: "paid")
10. Backend creates Transaction records:
    - User: booking_payment (-amount)
    - Owner: owner_earning (+ownerEarning)
    - Platform: platform_fee (+platformFee)
11. Backend decrypts WiFi password
12. Backend returns booking with credentials
13. Frontend shows Active Session page
```

### 2. Platform Fee Calculation
```javascript
const amount = pricePerHour * duration;
const platformFee = amount * 0.02; // 2%
const ownerEarning = amount - platformFee; // 98%
```

### 3. Auto-Complete Logic
```javascript
// Cron job or scheduled task
// Run every 5 minutes
const now = new Date();
const expiredBookings = await Booking.find({
  status: "active",
  endTime: { $lt: now }
});

for (const booking of expiredBookings) {
  booking.status = "completed";
  booking.actualEndTime = now;
  await booking.save();
  
  // Send completion notification
  // Update spot currentUsers count
}
```

### 4. Refund Logic
```javascript
// User cancels before startTime
if (booking.status === "pending" && booking.startTime > now) {
  // Full refund
  const refund = await razorpay.payments.refund(
    booking.razorpayPaymentId,
    { amount: booking.amount * 100 } // paise
  );
  booking.paymentStatus = "refunded";
  booking.status = "cancelled";
}

// User cancels during active session
if (booking.status === "active") {
  const usedMinutes = (now - booking.startTime) / 60000;
  const totalMinutes = booking.duration * 60;
  const usedAmount = (usedMinutes / totalMinutes) * booking.amount;
  const refundAmount = booking.amount - usedAmount;
  
  // Partial refund
  const refund = await razorpay.payments.refund(
    booking.razorpayPaymentId,
    { amount: Math.round(refundAmount * 100) }
  );
}
```

### 5. WiFi Password Encryption
```javascript
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.WIFI_ENCRYPTION_KEY;

// Encrypt before storing
const encryptedPassword = CryptoJS.AES.encrypt(
  wifiPassword, 
  SECRET_KEY
).toString();

// Decrypt after payment
const decryptedPassword = CryptoJS.AES.decrypt(
  encryptedPassword, 
  SECRET_KEY
).toString(CryptoJS.enc.Utf8);
```

### 6. Geo-Query for Nearby Spots
```javascript
// Create 2dsphere index
wifiSpotSchema.index({ location: '2dsphere' });

// Query nearby spots
const spots = await WifiSpot.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: 5000 // 5km
    }
  },
  isActive: true,
  isApproved: true
});
```

### 7. Rating Update After Review
```javascript
// After new review created
const reviews = await Review.find({ wifiSpot: spotId });
const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

await WifiSpot.findByIdAndUpdate(spotId, {
  'rating.average': avgRating,
  'rating.count': reviews.length
});

// Similarly update owner rating
const ownerReviews = await Review.find({ wifiSpot: { $in: ownerSpots } });
// Calculate & update user rating
```

---

## Environment Variables

### Backend `.env`
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/wifi-marketplace

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Encryption
WIFI_ENCRYPTION_KEY=your_wifi_password_encryption_key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional, for future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
```

---

## Testing Strategy

### Backend Testing
- Unit tests for utility functions (geo-query, encryption)
- Integration tests for API endpoints (use supertest)
- Test payment flow with Razorpay test cards
- Test refund scenarios
- Test role-based access control

### Frontend Testing
- Component tests (React Testing Library)
- E2E tests (Playwright or Cypress)
  - User journey: Browse → Book → Pay → Access WiFi
  - Owner journey: Add spot → Receive booking → Get paid
- Razorpay test card numbers

### Test Cards (Razorpay)
```
Success: 4111 1111 1111 1111
CVV: Any, Expiry: Future date

Failure: 4111 1111 1111 1234
```

---

## Deployment Plan

### Backend Deployment (Render/Railway)
- Build TypeScript → JavaScript
- Set environment variables
- MongoDB Atlas (cloud database)
- Enable CORS for frontend domain

### Frontend Deployment (Vercel/Netlify)
- Build production bundle
- Set environment variables
- Configure redirects for SPA routing

### Database (MongoDB Atlas)
- Create cluster
- Whitelist IP addresses
- Create database user
- Create indexes (location, email)

---

## Captive Portal Security System

### Overview
The platform uses a **Captive Portal** system to ensure secure WiFi access control. Instead of sharing WiFi passwords directly, users authenticate through a portal using booking tokens.

### How It Works

#### For WiFi Owners:
1. WiFi network should be set to **Open** (no password) or use a shared network
2. Router must redirect unauthenticated users to the captive portal URL
3. Only users with valid booking tokens can access the internet

#### For Users:
1. **Pay & Get Token**: After payment, users receive a unique Access Token and OTP
2. **Connect to WiFi**: User connects to the open WiFi network
3. **Portal Appears**: Login portal automatically appears (or navigate to `/portal?spot=<spotId>`)
4. **Authenticate**: Enter Access Token or OTP to authenticate
5. **Internet Access**: Once authenticated, internet access is granted until booking expires

### Authentication Methods

| Method | Format | Example |
|--------|--------|---------|
| Access Token | 16-character alphanumeric | `A3B5C7D9E1F2G4H6` |
| OTP | 6-digit numeric | `847293` |

### Security Features

1. **Token-Based Access**: No WiFi password exposed to users
2. **Device Limit**: Each booking has a maximum device limit (default: 1)
3. **Real-Time Validation**: Sessions validated every 30 seconds
4. **Auto-Expiry**: Access automatically revoked when booking ends
5. **Device Tracking**: Monitor and revoke individual device sessions
6. **Friend Prevention**: Others connecting to WiFi need valid tokens

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/captive/detect/:spotId` | Check if device needs authentication |
| POST | `/api/captive/authenticate` | Authenticate with token/OTP |
| POST | `/api/captive/validate` | Validate ongoing session (heartbeat) |
| POST | `/api/captive/disconnect` | Disconnect device |
| GET | `/api/captive/status/:spotId` | Get portal status |
| GET | `/api/captive/sessions/:bookingId` | View connected devices |
| POST | `/api/captive/revoke` | Revoke device access |
| POST | `/api/captive/cleanup` | Clean expired sessions (cron job) |

### Frontend Routes

| Route | Description |
|-------|-------------|
| `/portal?spot=<spotId>` | Captive Portal login page |
| `/session/:bookingId` | User's session page with tokens |

### Database Schema Updates

#### Booking Model (Additional Fields)
```javascript
{
  accessToken: String,        // 16-char token for portal auth
  accessTokenOTP: String,     // 6-digit OTP alternative
  maxDevices: Number,         // Max concurrent devices (default: 1)
  activeDeviceCount: Number,  // Current connected devices
}
```

#### CaptiveSession Model (New)
```javascript
{
  booking: ObjectId,          // Reference to Booking
  wifiSpot: ObjectId,         // Reference to WifiSpot
  user: ObjectId,             // Reference to User
  deviceId: String,           // Unique device identifier
  deviceType: String,         // mobile/tablet/laptop
  deviceName: String,         // User agent string
  ipAddress: String,          // IP address
  isActive: Boolean,          // Session status
  sessionToken: String,       // Session auth token
  expiresAt: Date,            // Auto-expire datetime
  lastActivityAt: Date,       // Last activity timestamp
}
```

### Router Configuration (For WiFi Owners)

To enable captive portal on your router:

1. **Set up captive portal redirect** on your router to:
   ```
   http://your-domain.com/portal?spot=<your-spot-id>
   ```

2. **Configure DNS/HTTP intercept** to redirect all unauthenticated traffic

3. **Whitelist** the captive portal domain for authentication requests

### Example Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CAPTIVE PORTAL FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

User A (Paying Customer)          Friend B (No Booking)
         │                                  │
         ▼                                  │
   ┌─────────────┐                          │
   │  Book WiFi  │                          │
   │   & Pay     │                          │
   └─────────────┘                          │
         │                                  │
         ▼                                  │
   ┌─────────────┐                          │
   │ Get Token:  │                          │
   │ A3B5C7D9... │                          │
   └─────────────┘                          │
         │                                  │
         ▼                                  ▼
   ┌─────────────────────────────────────────────┐
   │         Connect to WiFi Network              │
   │              "CafeSpot"                      │
   └─────────────────────────────────────────────┘
         │                                  │
         ▼                                  ▼
   ┌─────────────────────────────────────────────┐
   │        Captive Portal Appears                │
   │      "Enter Access Token or OTP"             │
   └─────────────────────────────────────────────┘
         │                                  │
         ▼                                  ▼
   ┌─────────────┐                   ┌─────────────┐
   │Enter Token: │                   │ No Token    │
   │ A3B5C7D9... │                   │  ❌ DENIED  │
   └─────────────┘                   └─────────────┘
         │
         ▼
   ┌─────────────┐
   │ ✅ GRANTED  │
   │ Internet OK │
   └─────────────┘
         │
         ▼ (After booking time ends)
   ┌─────────────┐
   │ ⏰ EXPIRED  │
   │ Access Cut  │
   └─────────────┘
```

---

## Future Enhancements (Post-MVP)

1. **Mobile App** - React Native version
2. **Email Notifications** - Booking confirmations, reminders
3. **SMS Alerts** - OTP verification, booking updates
4. **Wallet System** - Recharge wallet, withdraw earnings
5. **Referral Program** - Earn credits for referrals
6. **Promotional Codes** - Discount coupons
7. **Subscription Plans** - Monthly unlimited plans for frequent users
8. **Business Listings** - Cafes, coworking spaces, hotels
9. **IoT Integration** - Auto-detect WiFi quality, uptime monitoring
10. **Multi-language Support** - Hindi, Marathi, etc.

---

## Success Metrics

### For Users
- Average booking cost < ₹100/session
- 90%+ successful connections
- <2 min booking to WiFi access time

### For Owners
- Average earnings ₹3000-5000/month
- 80%+ occupancy during available hours
- 4+ star average rating

### For Platform
- 10%+ month-over-month growth
- <5% dispute rate
- 95%+ payment success rate
- ₹50,000+ monthly GMV (Gross Merchandise Value)

---

## Contact & Support

**Team QuadCoders:**
- Yash Urade (Team Lead)
- Samiksha Musale
- Vaidehi Narkhede
- Spandan Mali

**Institution:** Pimpri Chinchwad College of Engineering & Research, Ravet, Pune

**Project Duration:** 6 weeks  
**Tech Stack:** MongoDB, Express, React, Node.js (MERN)  
**Payment Gateway:** Razorpay  
**Deployment:** Vercel (Frontend) + Render (Backend) + MongoDB Atlas

---

**Last Updated:** February 25, 2026  
**Version:** 1.0  
**Status:** Ready for Development 🚀
