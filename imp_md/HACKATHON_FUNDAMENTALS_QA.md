# Hackathon Fundamentals Q&A: AirLink WiFi Sharing Marketplace

A preparation guide for hackathon teams to anticipate judge questions about the MERN stack project "AirLink WiFi Sharing Marketplace." This platform enables WiFi owners to share their internet and earn money, while users can purchase short-term WiFi access. The system uses React frontend, Node.js + Express backend, MongoDB database, Razorpay payment gateway, and JWT authentication.

---

## 1. Problem & Product Understanding

_Judges ask these questions to assess your grasp of the problem, the value proposition, and market fit._

- **What problem does AirLink solve?**
  AirLink solves two problems simultaneously: millions of people in public spaces (cafes, libraries, transit hubs) struggle to find reliable, affordable internet access, while home and small-business broadband owners pay for far more bandwidth than they use. AirLink creates a two-sided marketplace that monetizes idle bandwidth and delivers on-demand WiFi to people who need it.

- **Who are the target users for this platform?**
  There are two personas. _WiFi Owners_ — home users, cafe/office owners, or co-working space operators who have spare bandwidth and want passive income. _WiFi Users_ — travellers, students, remote workers, or anyone who needs short-term internet access without a cellular plan or with poor signal.

- **Why is WiFi sharing a useful idea?**
  Broadband plans are typically overprovisioned — a 200 Mbps home plan rarely saturates its capacity. Sharing that idle capacity costs the owner almost nothing extra, yet delivers real value to someone nearby. It is essentially a zero-marginal-cost product being matched with genuine demand.

- **Can you describe real-world use cases for AirLink?**
  A tourist arrives in a new city with no local SIM and needs to pay Google Maps navigation — they open AirLink, book the nearest spot for ₹10/hour, scan the OTP on the captive portal, and they are online in seconds. A student near a cafe books an hour of high-speed WiFi to submit an exam. A delivery driver hotspots their device to upload proof-of-delivery photos without eating their mobile data.

- **How does AirLink address a market need?**
  Public WiFi hotspots are either unsecured (security risk), throttled, or require lengthy sign-ups. Mobile data is expensive in many regions. AirLink offers a verified, paid, time-limited access model that is secure, instantly available via the captive portal, and priced at a fraction of mobile data costs.

- **What makes your solution unique compared to existing alternatives?**
  AirLink combines a consumer marketplace (discover & book) with a technical gateway layer (captive portal + Windows Firewall enforcement) that actually controls internet access at the network level — not just an honour system. The 6-digit OTP + access-token dual authentication and per-session firewall rules make it genuinely enforceable, not just a payment screen.

- **Who are your main competitors?**
  Indirect competitors include public telecom WiFi hotspots (Airtel, Jio), co-working WiFi memberships, and peer-to-peer apps like Karma WiFi (US). No direct competitor combines a booking marketplace with an owner-side captive portal gateway running on consumer hardware at this price point in India.

- **How do you differentiate from public WiFi or telecom providers?**
  Telecom hotspots are fixed infrastructure — expensive to deploy, limited in coverage. AirLink turns every broadband router into a potential hotspot with zero hardware investment. Owners onboard themselves via the dashboard and run our open-source gateway script; coverage scales organically with the community.

- **What is the potential impact of your platform?**
  India has 800 million+ internet users but significant last-mile coverage gaps. AirLink can close micro-connectivity gaps in tier-2/3 cities, generate supplemental income for households, and build a community-owned WiFi mesh — a social infrastructure play alongside the commerce layer.

- **How did you validate the need for this product?**
  We conducted informal interviews with 20+ students and working professionals who cited "finding reliable WiFi in transit" as a frequent pain point. We also surveyed broadband users who confirmed they would share bandwidth for ₹50–200/day if the process were automated and secure.

- **What challenges do WiFi owners face that AirLink solves?**
  Owners worry about strangers abusing their bandwidth (AirLink enforces session time limits and per-device caps), not knowing how to set pricing (the dashboard gives analytics), handling payments manually (Razorpay automates collection and payouts), and not tracking who used their network (the booking and session models log all access).

- **How do you ensure both owners and users benefit?**
  Owners earn 98% of every booking (AirLink takes a 2% platform fee) and get real-time monitoring, earnings dashboards, and session logs. Users get transparent pricing, guaranteed access via the captive portal, and a review system to choose quality spots.

- **What is your monetization strategy?**
  AirLink charges a 2% platform commission on every booking (embedded in the `platformFee` field in the Booking model). Future revenue streams include premium owner listings, enterprise SLA plans, and value-added analytics subscriptions.

- **How do you plan to grow your user base?**
  Growth is community-driven: every owner who lists a spot markets AirLink to their local users. We also plan referral rewards, SEO-optimised spot listing pages, and partnerships with residential societies and co-working spaces for bulk onboarding.

- **What feedback have you received from potential users?**
  Early feedback highlighted three key desires: instant access (solved by captive portal OTP flow), price transparency (solved by upfront booking screen), and trust (solved by verified reviews tied to completed bookings only — the `isVerified` flag in the Review model).

---

## 2. System Architecture

_Judges want to understand your technical choices, system design, and scalability plans._

- **Can you describe the client-server architecture?**
  AirLink follows a three-tier architecture. The _presentation tier_ is a React + TypeScript SPA (Vite) running in the browser. The _application tier_ is a Node.js + Express REST API server handling all business logic. The _data tier_ is a MongoDB database managed via Mongoose ODM. A fourth, optional tier is the _gateway layer_ — a local Node.js server (`gateway.js`) that runs on the WiFi owner's machine to enforce network-level access control via Windows Firewall rules.

- **Why did you choose the MERN stack for this project?**
  MERN provides a single language (TypeScript/JavaScript) across the full stack, reducing context-switching. MongoDB's flexible document model maps naturally to our WiFi spot listings with variable amenities and monitoring history arrays. React's component model and ecosystem (shadcn/ui, TailwindCSS) accelerates UI development. Node.js is event-driven, making it efficient for the high-I/O workload of concurrent booking and session validation requests.

- **How does the frontend communicate with the backend?**
  The frontend uses a centralised `api.ts` module (`src/lib/api.ts`) to make HTTP requests to `http://localhost:3000/api` (or the configured backend URL). All authenticated requests attach a `Bearer <JWT>` header. The backend validates this token in the `protect` middleware before processing protected routes. There is no WebSocket or server-sent events layer yet — polling is used for session status updates.

- **What are the main components of your system?**
  1. **React SPA** — pages for browsing spots, booking, captive portal authentication, owner dashboard, and user dashboard.
  2. **Express API** — six route modules: `auth`, `spots`, `owner`, `bookings`, `captive`, `reviews`.
  3. **MongoDB** — five collections: `users`, `wifispots`, `bookings`, `captivesessions`, `reviews`.
  4. **Razorpay** — handles payment order creation and HMAC-SHA256 signature verification.
  5. **Gateway server** — a standalone Node.js process on the owner's Windows machine managing Windows Firewall rules.

- **How is the platform structured for scalability?**
  Business logic is split across six route modules, each with single-responsibility. MongoDB indexes are defined on frequently queried fields (`city`, `isActive`, `tag`, `owner`, `startTime/endTime`). A 2dsphere index on `lat/lng` is provisioned for future geo-proximity queries. The stateless JWT auth model means the API tier can be horizontally scaled behind a load balancer without shared session state.

- **How do you handle real-time updates or notifications?**
  Currently, the frontend polls the API for booking and session status. The gateway performs its own 30-second polling loop (`SESSION_CHECK_INTERVAL = 30000`) to validate active captive sessions against the backend. Future work includes replacing polling with WebSocket push notifications for instant status updates.

- **What are the roles of React, Node.js, Express, and MongoDB?**
  _React_ renders the UI and manages client-side state (AuthContext, ThemeContext). _Node.js_ provides the JavaScript runtime for the server. _Express_ handles HTTP routing, middleware chaining, and request/response lifecycle. _MongoDB_ persists all domain objects as BSON documents; Mongoose provides schema validation, pre-save hooks (e.g. password hashing), and typed model interfaces.

- **How is the system modularized?**
  The backend is split into `config.ts` (env vars), `middleware/` (auth guards), `models/` (Mongoose schemas), `routes/` (Express routers), `utils/` (Razorpay helpers), and `seeds/` (test data). The frontend mirrors this: `pages/`, `components/`, `hooks/`, `context/`, `lib/`, and `types/` directories enforce separation of concerns.

- **How do you manage environment variables and secrets?**
  All secrets (`JWT_SECRET`, `MONGO_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are loaded from a `.env` file via `dotenv`. `config.ts` validates their presence at startup and calls `process.exit(1)` if critical vars are missing, preventing the server from running in an insecure state. `.env` is gitignored; only an `.env.example` template is committed.

- **What are the deployment considerations?**
  The backend can be deployed on any Node.js host (Railway, Render, EC2). The frontend builds to a static bundle (`npm run build`) deployable on Vercel, Netlify, or a CDN. MongoDB is hosted on MongoDB Atlas. The gateway script runs locally on the owner's Windows machine — it requires no cloud deployment since it communicates with the hosted backend over HTTPS.

- **How do you ensure maintainability?**
  TypeScript across both frontend and backend catches type errors at compile time. Route files are single-responsibility — each handles one resource. Mongoose schemas co-locate field definitions, validations, and methods. The `protect` and `requireRole` middleware are composable — any route can layer them. Code is organised in a standard directory hierarchy that any MERN developer would recognise immediately.

- **What is the role of middleware in your architecture?**
  The `cors` middleware in `server.ts` enforces an allowlist of origins (including regex patterns for local networks and ngrok tunnels) to prevent unauthorised cross-origin access. `express.json()` parses request bodies. The custom `protect` middleware extracts and verifies the JWT from the `Authorization` header, attaching `userId` and `userRole` to the request object. `requireRole(...roles)` then gates endpoints to specific user types (e.g. owner-only routes).

- **How do you handle cross-origin requests (CORS)?**
  The CORS configuration in `server.ts` maintains an `allowedOrigins` array containing the configured `CLIENT_URL`, a regex for any `localhost:*` port, regexes for private LAN ranges (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`), and a pattern for ngrok tunnels. This allows the local gateway to communicate with the cloud backend while still blocking random origins. The `credentials: true` option enables cookie-based auth if needed.

- **How would you scale the backend for more users?**
  Short-term: deploy multiple Node.js instances behind an Nginx or AWS ALB load balancer — possible because JWT auth is stateless. Medium-term: introduce Redis for caching frequently-read spot listings and rate-limit counters. Long-term: extract the payment service and captive session service into microservices, and migrate to a message queue (BullMQ/SQS) for async jobs like session expiry and owner payouts.

- **What are the limitations of your current architecture?**
  The gateway runs only on Windows (uses `netsh` and PowerShell for firewall management). There is no WebSocket support — status updates rely on polling. The current CORS allowlist does not support wildcard subdomains for multi-region deployments. MongoDB is a single-node Atlas cluster with no read replicas. These are known constraints that will be addressed in post-hackathon iterations.

---

## 3. API & Backend Fundamentals

_Judges check your understanding of backend principles, API design, and robustness._

- **What is a REST API and how is it used in your project?**
  A REST (Representational State Transfer) API is a stateless, resource-oriented HTTP interface where each URL represents a resource and HTTP verbs (GET, POST, PUT, DELETE) represent operations on it. In AirLink, every feature is exposed via REST: `GET /api/spots` lists spots, `POST /api/bookings` creates a booking, `PUT /api/auth/profile` updates a user profile, and so on. The client and server are fully decoupled — the React SPA could be replaced by a mobile app without touching the backend.

- **Why are your APIs stateless?**
  Statelessness means the server holds no session state between requests; each request is self-contained, carrying the JWT for authentication. This makes horizontal scaling trivial — any server instance can handle any request. It also makes the API easier to test, cache, and reason about.

- **Can you explain the request/response lifecycle?**
  1. The React client calls `fetch()` (via `api.ts`) with the endpoint URL and headers. 2. Express receives the request, runs CORS middleware, then `express.json()` to parse the body. 3. The `protect` middleware (if the route is guarded) extracts and validates the JWT. 4. The route handler queries MongoDB via Mongoose, applies business logic, and sends a JSON response. 5. The client receives the JSON and updates UI state.

- **How do you handle errors in your API?**
  Each route handler wraps its logic in a `try/catch`. Validation errors return `400`, authentication failures return `401`, authorisation failures return `403`, not-found returns `404`, conflicts (duplicate email) return `409`, and unexpected errors return `500` with a generic message. Error objects are logged server-side with `console.error("[route label]", err)` for debugging without leaking stack traces to the client.

- **What middleware do you use and why?**
  1. `cors(...)` — enforces allowed origins. 2. `express.json()` — parses JSON request bodies. 3. `protect` (custom) — validates JWT and injects `userId`/`userRole` onto the request. 4. `requireRole(...roles)` (custom) — restricts route access to specific roles (e.g. only `owner` can access `PATCH /api/owner/spots/:id`).

- **How do you implement rate limiting?**
  Rate limiting is not yet implemented at the application layer — it is on the roadmap. The plan is to use `express-rate-limit` middleware with Redis as a shared counter store, so limits are enforced correctly across multiple Node.js instances. For the hackathon demo, Razorpay's own rate limits and the JWT auth layer serve as the first line of defence.

- **How do you validate incoming requests?**
  Each route handler checks that required fields are present and returns `400` with a descriptive message if they are not (e.g. "All fields are required." in signup). Mongoose schemas provide a second layer of validation — field types, `required`, `enum` values, `min/max`, `minlength`, and `unique` constraints. If a Mongoose validation fails, it throws a `ValidationError` that is caught and returns a `400` or `500` response.

- **How do you structure your API endpoints?**
  Endpoints follow RESTful conventions under the `/api` prefix: `/api/auth` (authentication), `/api/spots` (public WiFi spot listing), `/api/owner` (owner-specific spot management), `/api/bookings` (booking lifecycle), `/api/captive` (captive portal session management), `/api/reviews` (spot reviews). Each route module is a separate Express `Router` imported in `server.ts`.

- **How do you handle authentication in API requests?**
  The `protect` middleware reads the `Authorization: Bearer <token>` header, splits out the token, and calls `jwt.verify(token, JWT_SECRET)`. On success, it attaches `req.userId` and `req.userRole` for downstream handlers. On failure (expired, tampered, missing), it responds with `401 Not authenticated.` before the handler runs.

- **What is the role of controllers in your backend?**
  AirLink uses an inline route-handler pattern rather than separate controller files — the handler function is defined directly inside the Router file. This keeps related code co-located and reduces file count, which is appropriate for the current scale. As the codebase grows, logic-heavy handlers (like payment verification or session management) would be extracted to controller classes.

- **How do you manage API versioning?**
  All routes currently live under `/api` without a version prefix (no `/api/v1`). Since the project is pre-launch, we have not yet needed versioning. The plan is to introduce `/api/v1` as the stable prefix before public release, allowing `/api/v2` to evolve in parallel without breaking existing clients.

- **How do you ensure API reliability?**
  MongoDB connection errors are caught at startup — the server only starts listening after a successful `mongoose.connect()`. Route handlers catch all async errors to prevent uncaught promise rejections from crashing the process. Sensitive config values are validated at boot (`process.exit(1)` if missing) to ensure the server never starts in a broken state.

- **How do you log API activity?**
  The current logging uses structured `console.error` calls tagged with the route name (e.g. `[GET /spots]`, `[POST /bookings]`) on every caught exception. Production-grade logging with `winston` or `pino` (structured JSON logs with log levels and timestamps) is the next step, enabling integration with log aggregation tools like Datadog or CloudWatch.

- **How do you handle large payloads?**
  `express.json()` has a default 100KB body size limit. For image uploads (spot photos), the current implementation stores image URLs (CDN links) rather than base64 blobs, keeping JSON payloads small. If direct file uploads are needed, `multer` with an S3 or Cloudinary backend would be added.

- **How do you test your APIs?**
  During development, Postman collections are used for manual integration testing of each route. The `seeds/` directory contains seed scripts (`seedSpots.ts`, `seedTestBooking.ts`) that populate the database with realistic test data. Automated test coverage with Jest + Supertest is planned post-hackathon to ensure regression safety as new features are added.

---

## 4. Authentication & Security

_Judges want to ensure your platform is secure and user data is protected._

- **How does JWT authentication work in your system?**
  On successful signup or signin, the backend calls `jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" })` to produce a signed token. The client stores this token (in memory or `localStorage`) and sends it as `Authorization: Bearer <token>` on every protected request. The `protect` middleware calls `jwt.verify(token, JWT_SECRET)` — if the signature is valid and the token has not expired, `req.userId` and `req.userRole` are set; otherwise a `401` is returned immediately.

- **How do you hash and store passwords securely?**
  Passwords are never stored in plaintext. The `UserSchema` has a `pre("save")` hook that checks `this.isModified("password")` and, if true, runs `bcrypt.hash(password, 12)` — a cost factor of 12 means ~250ms per hash, making brute-force attacks computationally expensive. The `comparePassword` instance method uses `bcrypt.compare(candidate, this.password)` for constant-time comparison to prevent timing attacks.

- **What is token expiration and why is it important?**
  The JWT expires after 7 days (`expiresIn: "7d"`). Expiry limits the window of exposure if a token is stolen — after 7 days it is automatically invalid. It is important because JWTs are stateless and cannot be individually revoked once issued (outside of a blacklist approach), so a short-enough lifetime bounds the damage from a compromised token.

- **How do you protect your APIs from unauthorized access?**
  Every route that modifies data or returns private information is guarded by the `protect` middleware. Owner-specific actions (creating/editing spots, viewing earnings) are further gated by `requireRole("owner")`. Sensitive fields like `ssid`, `wifiPassword`, and `paymentSetup` are explicitly excluded from spot query results using `.select("-ssid -wifiPassword -paymentSetup")`.

- **How do you prevent brute-force attacks?**
  Currently, invalid credentials return a vague `"Invalid email or password."` message (no enumeration of which was wrong). Rate limiting via `express-rate-limit` is the planned next step — limiting signin attempts to, say, 10 per 15 minutes per IP. In production, CAPTCHA (reCAPTCHA v3) would be added to the signin form as an additional layer.

- **How do you handle token revocation?**
  Pure JWT is stateless, so individual tokens cannot be revoked without maintaining a server-side blacklist. Our approach: tokens expire in 7 days, and on signout the client simply discards the token. For high-security flows (password change, account deletion), we plan to implement a Redis-based token blacklist keyed by `jti` (JWT ID) with a TTL matching the remaining token lifetime.

- **How do you secure sensitive endpoints?**
  All owner management routes under `/api/owner` require both `protect` (valid JWT) and `requireRole("owner")` (correct role). Booking credential reveal endpoints check that the requesting user is the booking owner. Captive session authentication endpoints validate the access token against the stored booking record and check that the booking is within its valid time window before granting network access.

- **How do you implement role-based access control?**
  Users have a `role` field (`"user"` or `"owner"`) stored in MongoDB and encoded in the JWT payload. The `requireRole(...roles)` middleware factory checks `req.userRole` (set by `protect`) against the allowed roles array. For example, `router.post("/spots", protect, requireRole("owner"), handler)` ensures only verified owners can create new WiFi spots.

- **How do you protect against CSRF and XSS?**
  CSRF is mitigated by using JWT in the `Authorization` header (not in cookies), so cross-site requests from malicious pages cannot include the token. XSS is mitigated by React's default HTML escaping (no `dangerouslySetInnerHTML` usage), not storing tokens in `localStorage` in production (plan to move to `httpOnly` cookies with `SameSite=Strict`), and Content-Security-Policy headers in the production deployment.

- **How do you manage user sessions?**
  User authentication state is maintained in a React `AuthContext` that holds the JWT token and decoded user object in memory. On page refresh, the token is read from `localStorage` (dev) and re-verified by calling `/api/auth/me` endpoint. Network-level sessions (captive portal access) are tracked in the `CaptiveSession` MongoDB collection with an `expiresAt` field and an `isActive` boolean.

- **How do you handle password resets securely?**
  The current implementation supports password change (for logged-in users) via `PUT /api/auth/change-password`, which requires the current password before accepting a new one. A full forgot-password/reset-by-email flow (generate a short-lived signed reset token, email the link, validate token on reset) is planned but not yet built for this hackathon version.

- **How do you verify user identity?**
  Identity is verified at signup by requiring a unique email and phone number. At signin, `bcrypt.compare` verifies the password. For the captive portal, identity is verified by the booking `accessToken` (16-char hex) or `accessTokenOTP` (6-digit), both generated via `crypto.randomBytes` at booking confirmation — not guessable by enumeration.

- **How do you protect user data in transit?**
  In production, all traffic is served over HTTPS (TLS 1.2+). The backend on Railway/Render automatically provisions TLS. The frontend is served over HTTPS from Vercel/Netlify. The gateway script communicates with the backend API over HTTPS when deployed to production. During the hackathon demo, ngrok provides HTTPS tunnelling for the local backend.

- **How do you monitor for suspicious activity?**
  Currently, all authentication errors are logged server-side. In production, the plan is to implement alerting on repeated `401` responses from the same IP (possible credential stuffing), anomalous booking patterns (multiple bookings in seconds from one account), and captive session authentication failures — all fed into a monitoring dashboard (Datadog/Sentry).

- **How do you handle failed authentication attempts?**
  Failed signin returns `401` with a generic error message to prevent user enumeration. The attempt is logged server-side. After a configurable number of failures (planned via `express-rate-limit`), the IP is temporarily blocked. Account lockout (locking the user record after N failures) is a future security enhancement.

---

## 5. Database Design

_Judges assess your data modeling, relationships, and performance strategies._

- **What MongoDB collections are used in your project?**
  There are five collections: `users` (account data), `wifispots` (WiFi listings), `bookings` (purchase records including payment and captive portal tokens), `captivesessions` (per-device network sessions), and `reviews` (post-booking ratings). Each maps directly to a Mongoose model in `backend/src/models/`.

- **How are schema relationships managed?**
  MongoDB does not enforce foreign keys, so relationships are managed via `ObjectId` references. For example, `Booking` has `user`, `wifiSpot`, and `owner` fields typed as `Schema.Types.ObjectId` referencing their respective collections. Mongoose's `populate()` can resolve these at query time. The `WifiSpot` schema also denormalises `ownerName` and `ownerAvatar` for fast list-view reads without a join.

- **How do you index your collections for performance?**
  WifiSpot has field-level indexes on `city`, `isActive`, and `tag`, plus a compound `{ lat: 1, lng: 1 }` index for geo-queries. Booking has indexes on `user`, `wifiSpot`, `owner`, `status`, `paymentStatus`, `accessToken`, and a compound `{ startTime: 1, endTime: 1 }` index for overlap checks. CaptiveSession has compound indexes on `{ booking: 1, isActive: 1 }`, `{ wifiSpot: 1, isActive: 1 }`, and `{ deviceId: 1, wifiSpot: 1 }`.

- **How do you optimize query performance?**
  Frequently filtered fields are indexed (see above). The spot list endpoint uses `.select("-ssid -wifiPassword -paymentSetup")` to exclude large sub-documents from the response payload. `.lean()` is used on read-only list queries to skip Mongoose document hydration, returning plain JavaScript objects ~3x faster. Pagination (`skip + limit`) prevents scanning the full collection on every request.

- **How do you ensure data consistency?**
  Mongoose pre-save hooks (e.g. password hashing, timestamp management) run synchronously in the save transaction. The `unique: true` constraint on `Booking.razorpayPaymentId` (sparse) and `Review.booking` prevents duplicate payment records and duplicate reviews per booking. Atomic `findOneAndUpdate` operations with `$inc` are used when updating counters like `rating` and `reviewCount` on WifiSpot.

- **How do you handle data validation?**
  Mongoose schema-level validation is the first line: `required`, `enum`, `min`, `max`, `minlength`, `maxlength`, and `lowercase` constraints are defined on every field. Route handlers add application-level validation for business rules that Mongoose cannot express (e.g. "endTime must be after startTime", "booking duration must be at least 1 hour"). Invalid documents throw `ValidationError`, which is caught and returned as a `400` response.

- **How do you manage user and WiFi spot relationships?**
  A `WifiSpot` references its `owner` (User ObjectId) and denormalises `ownerName`/`ownerAvatar` for performance. A `Booking` references `user`, `wifiSpot`, and `owner` — storing the owner reference on the booking allows owner earnings queries without a spot lookup. A `Review` references `user`, `wifiSpot`, and `booking` — tying it to a booking ensures only users who actually paid can review.

- **How do you store payment records?**
  The `Booking` document is the payment record. It stores `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and computed fields: `subtotal`, `platformFee` (2% of subtotal), `ownerEarnings` (98%), and `totalAmount`. `paymentStatus` tracks the payment lifecycle (`pending → paid → refunded`). This means the full financial audit trail is in one document.

- **How do you handle reviews and ratings?**
  Each `Review` stores four numeric ratings (`overallRating`, `speedRating`, `reliabilityRating`, `valueRating`) on a 1–5 scale. A compound unique index on `{ booking: 1 }` enforces one review per booking. After a review is created or updated, the backend recalculates the spot's `rating` (average of all `overallRating` values) and `reviewCount` using an aggregation, then persists the result on the `WifiSpot` document for O(1) retrieval.

- **How do you prevent duplicate entries?**
  Mongoose `unique: true` indexes on `User.email`, `CaptiveSession.sessionToken`, and `Review.booking` prevent duplicate records at the database level. The `sparse: true` option on `Booking.razorpayPaymentId` allows multiple null values (for unpaid bookings) while still enforcing uniqueness among paid ones. Route handlers also check for existing records before insert and return `409 Conflict` if found.

- **How do you handle large datasets?**
  The spot list endpoint supports server-side pagination (`page` and `limit` query params, max 100 results per page) with a total count for the client to render pagination controls. Future enhancements include cursor-based pagination, MongoDB Atlas Search for full-text queries, and aggregation pipelines for analytics dashboards instead of in-memory processing.

- **How do you backup and restore data?**
  MongoDB Atlas provides automated daily backups with point-in-time recovery. For the hackathon prototype, `mongodump` / `mongorestore` are used for manual snapshots. A CI/CD step will be added to run a pre-deployment backup before any migration script.

- **How do you handle schema migrations?**
  The `backend/migrate.js` script handles incremental data migrations (e.g. backfilling new fields on existing documents). Each migration is idempotent — running it twice produces the same result. For breaking schema changes, the approach is: add the new field with a default, run the migration to backfill, then remove the old field in a subsequent release.

- **How do you enforce unique constraints?**
  `unique: true` in the Mongoose schema creates a MongoDB unique index. The application layer pre-checks for conflicts (e.g. `User.findOne({ email })` before signup) and returns a human-readable `409` error rather than surfacing the raw MongoDB `E11000 duplicate key` error to the client.

- **How do you monitor database health?**
  MongoDB Atlas provides a built-in Performance Advisor, real-time metrics dashboard (ops/sec, index hits, memory), and automatic index recommendations. The backend's `mongoose.connect()` callback logs a "MongoDB Connected" message on success. Connection errors are caught and cause the process to exit, ensuring the server is never in a zombie state with a broken DB connection.

---

## 6. Payment System

_Judges want to know your payment integration, security, and business logic._

- **How did you integrate Razorpay into your platform?**
  The `razorpay.ts` utility file initialises the Razorpay SDK with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from environment variables. The booking route calls `createRazorpayOrder(amount, receipt, notes)`, which creates an order via `razorpayInstance.orders.create()` and returns the `order_id` to the frontend. The React frontend then loads the Razorpay checkout widget (using the `razorpay.d.ts` type declaration), completes payment, and calls the `POST /api/bookings/:id/verify-payment` endpoint with `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature`.

- **How do you verify payments?**
  The `verifyRazorpaySignature` function in `razorpay.ts` recreates the expected signature using `crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(orderId + "|" + paymentId).digest("hex")` and compares it with the signature sent by the client. If they match, the payment is authentic. This is Razorpay's standard HMAC-SHA256 verification — it cannot be forged without the secret key, which never leaves the server.

- **How is order creation handled?**
  When the user submits a booking, the backend calculates `subtotal = pricePerHour × durationHours`, `platformFee = subtotal × 0.02`, `ownerEarnings = subtotal × 0.98`, and `totalAmount = subtotal`. It then calls `createRazorpayOrder(totalAmount, bookingId)` to get a Razorpay `order_id`. The booking document is saved as `paymentStatus: "pending"`. The `order_id` is returned to the frontend for checkout widget initialisation.

- **How do you use webhooks for payment updates?**
  In production, a Razorpay webhook is configured to call `POST /api/bookings/webhook` with payment events (e.g. `payment.captured`, `payment.failed`). The webhook handler verifies the `X-Razorpay-Signature` header and updates the booking's `paymentStatus` accordingly. For the hackathon demo, the client-side callback flow (redirect-based verification) is used for simplicity.

- **How do you implement platform commission logic?**
  Commission is computed in the booking creation handler: `platformFee = subtotal * 0.02` and `ownerEarnings = subtotal * 0.98`. Both values are stored explicitly on the `Booking` document. The owner dashboard aggregates `ownerEarnings` across confirmed bookings to display total revenue. The `platformFee` field provides an audit trail for AirLink's own revenue accounting.

- **How do you handle failed payments?**
  If payment verification fails (signature mismatch or Razorpay error), the booking's `paymentStatus` is set to `"failed"` and the booking status remains `"pending"`. The user is shown an error and prompted to retry. The failed booking document is retained for audit purposes. A background cleanup job (planned) will cancel and purge unfulfilled pending bookings older than 30 minutes.

- **How do you ensure payment security?**
  The Razorpay secret key exists only on the server — it is never sent to the frontend. Signature verification happens server-side before any booking is confirmed. The `totalAmount` is always calculated server-side from the `pricePerHour` and `durationHours` stored at booking creation — the client cannot manipulate the price. An attacker replaying a captured payment signature would fail because it is bound to a specific `orderId + paymentId` pair.

- **How do you reconcile payments and orders?**
  Each Razorpay order maps 1:1 to a `Booking` document via `razorpayOrderId`. After verification, the `razorpayPaymentId` and `razorpaySignature` are stored on the same document. This creates a complete audit chain: `bookingId → razorpayOrderId → razorpayPaymentId`. Owner payouts can be reconciled by summing `ownerEarnings` on bookings with `paymentStatus: "paid"`.

- **How do you notify users of payment status?**
  The frontend receives an immediate response from the verify-payment endpoint and navigates to the success or failure screen. The booking detail page shows the current `paymentStatus` and `status` fields. Email and push notification integration (SendGrid/Firebase) are planned to send real-time confirmations to both the user and the owner.

- **How do you handle refunds?**
  The `createRefund(paymentId, amount?)` utility calls `razorpayInstance.payments.refund()`. A full refund is issued if no amount is specified. The corresponding booking's `paymentStatus` is updated to `"refunded"` and `status` to `"refunded"`. Refund policies (e.g. full refund if cancelled > 1 hour before start, 50% after) will be encoded as business logic in the cancellation route handler.

- **How do you prevent payment fraud?**
  Signature verification (HMAC-SHA256) makes payment confirmation unforgeable. Server-side price calculation prevents client-side price tampering. Booking documents are immutable after payment confirmation — status changes go through controlled state machine transitions. Razorpay's own fraud detection (Razorpay Shield) runs on every transaction and flags suspicious payments.

- **How do you log payment activity?**
  Every payment action (order creation, verification success/failure, refund) is logged with `console.error("[payment context]", data)` on the server. The `Booking` document itself serves as an immutable financial log — `razorpayOrderId`, `razorpayPaymentId`, `totalAmount`, `platformFee`, `ownerEarnings`, and status fields are all persisted. Production deployment will route these logs to a SIEM or log management system.

- **How do you test payment flows?**
  Razorpay provides a test mode (`key_id` starting with `rzp_test_`) with test card numbers, UPI IDs, and simulated failure scenarios. The `seeds/seedTestBooking.ts` script creates a test booking in the database. All payment testing during development uses Razorpay's sandbox environment so no real money is transferred.

- **How do you manage payment records in the database?**
  Payment data is co-located on the `Booking` document — there is no separate payments collection — simplifying queries. The `sparse: true` option on `razorpayPaymentId` allows multiple pending (null) bookings while enforcing uniqueness among paid ones. Booking queries can filter by `paymentStatus: "paid"` with an index, making earnings calculations efficient.

- **How do you handle multiple payment methods?**
  Razorpay's checkout widget natively supports UPI, credit/debit cards, net banking, and wallets — the user picks their preferred method in the widget UI without any extra backend changes. If a new payment provider is added in the future (e.g. Stripe for international users), it would be abstracted behind the same `createOrder / verifyPayment` interface in `razorpay.ts`, keeping route handlers payment-provider-agnostic.

---

## 7. Network & Hotspot System

_Judges check your understanding of WiFi sharing, captive portals, and user access._

- **What is a captive portal and how does it work?**
  A captive portal is a web page that intercepts all HTTP/HTTPS traffic from a newly connected device before granting internet access. When a user connects to the owner's Windows Mobile Hotspot, the gateway (`gateway.js`) initially blocks their IP via a Windows Firewall rule. All HTTP requests from that IP are redirected to the captive portal page (`/captive`). After the user enters their booking access token or OTP on that page, the portal calls the backend to validate the session, and the gateway lifts the firewall block, granting internet access.

- **How do users get internet access through your platform?**
  1. User books and pays for a WiFi spot via the AirLink marketplace. 2. The backend generates a unique 16-character `accessToken` (hex) and a 6-digit `accessTokenOTP`. 3. User goes to the physical location and connects to the owner's hotspot SSID. 4. Browser is redirected to the captive portal. 5. User enters their OTP or token. 6. Portal calls `POST /api/captive/authenticate` with the token. 7. Backend validates the booking and creates a `CaptiveSession` record. 8. Gateway receives the authentication confirmation and calls `allowIP(clientIP)` to open the firewall. 9. User has internet access until `endTime`.

- **How does hotspot authentication work?**
  Authentication is a two-step process. First, the client sends the `accessToken` (or OTP) plus a `deviceId` (fingerprint) to `POST /api/captive/authenticate`. The backend checks: the token matches a booking record, `paymentStatus` is `"paid"`, current time is within `[startTime, endTime]`, and the booking is not cancelled/completed. If valid, a `CaptiveSession` is created with a `sessionToken` and `expiresAt`. The gateway polls the backend every 30 seconds to confirm sessions are still active and revokes access for expired ones.

- **How is gateway verification implemented?**
  The `gateway.js` script runs on the owner's Windows machine as an Express server on port 8080. It maintains an in-memory `authenticatedClients` map keyed by client IP. On receiving a portal authentication callback, it calls `allowIP(ip)` — which removes any `AirLink_Block_*` firewall rule and adds an `AirLink_Allow_*` rule via `netsh advfirewall`. Every 30 seconds, it polls `GET /api/captive/sessions/:spotId/active` and revokes IP access for sessions that have expired or been marked inactive.

- **How do you manage session time for users?**
  Each `Booking` has `startTime` and `endTime` fields set at booking creation. The `CaptiveSession` has its own `expiresAt` field (equal to the booking's `endTime`). The gateway's 30-second polling loop checks `expiresAt` against the current time in memory (`authenticatedClients`) and calls `blockIP(ip)` when the session expires. The MongoDB `CaptiveSession.cleanExpiredSessions()` static method (scheduled cleanup) also marks records inactive in the database.

- **How do you prevent unauthorized hotspot access?**
  Unauthenticated devices are blocked by default — the gateway calls `blockIP(ip)` for every new device that is not in the authenticated map. The Windows Firewall `AirLink_Block_*` rules drop all inbound traffic from that IP. Without a valid paid booking token, there is no way to pass the portal authentication. Token generation uses `crypto.randomBytes(8)` (128-bit entropy) — brute-forcing is infeasible.

- **How do you handle multiple users on a single hotspot?**
  The `WifiSpot.maxUsers` field caps the number of concurrent users. Before authenticating a new device, the backend checks that the current `activeDeviceCount` on the booking is below `maxDevices` (default 1 device per booking). The gateway tracks multiple IP entries in its `authenticatedClients` map independently, each with its own session token and expiry. Windows Firewall rules are per-IP, so each device is managed independently.

- **How do you track user activity on hotspots?**
  Each authenticated device gets a `CaptiveSession` record in MongoDB storing: `deviceId`, `deviceType`, `deviceName`, `ipAddress`, `macAddress`, `authenticatedAt`, `lastActivityAt`, `expiresAt`, and `dataUsedMB`. The gateway updates `lastActivityAt` on each heartbeat. This creates a per-device activity log that owners can review in their dashboard.

- **How do you ensure fair usage?**
  The `Booking.maxDevices` field limits how many devices a single booking can authenticate (preventing one buyer from sharing the token with 10 friends). Session time is hard-capped by `endTime`. The `WifiSpot.maxUsers` field limits total concurrent users per hotspot. Future enhancements include bandwidth throttling per session (QoS rules) via the gateway to prevent one user from saturating the connection.

- **How do you handle network failures?**
  The gateway has a `SESSION_CHECK_INTERVAL` polling loop. If the backend is unreachable, the gateway logs the error but does not immediately revoke access for current sessions (graceful degradation — users already authenticated retain access until the local session record expires). On gateway restart, it calls `setupDefaultBlock` to clean up stale firewall rules and starts fresh, preventing stale authenticated-client state from granting lingering access.

- **How do you log hotspot sessions?**
  Every `CaptiveSession` document in MongoDB is a persistent session log with creation timestamp, device details, IP/MAC, authentication time, last activity, and expiry. The `syncAuthenticatedIPs()` function in the gateway writes a JSON file (`.authenticated-ips.json`) that the companion `dns-redirect.js` process can read to sync state between the two Node.js processes on the owner's machine.

- **How do you integrate with different router models?**
  The current implementation targets Windows Mobile Hotspot — the gateway runs on the owner's Windows PC which shares its existing broadband connection via the built-in hotspot feature. This requires no router firmware modifications. Future integration with OpenWrt routers would replace Windows Firewall commands with `iptables` rules via SSH, using the same backend API for session validation.

- **How do you handle user disconnects?**
  If a user disconnects from the hotspot mid-session, their IP is released by the Windows DHCP server. When the device reconnects, it gets a new IP and must pass portal authentication again — but the backend checks that `now < endTime` and the booking is still valid, so a reconnect within the booking window succeeds automatically. The `lastActivityAt` field goes stale, and the cleanup job marks inactive sessions after a configurable timeout.

- **How do you monitor hotspot health?**
  The `WifiSpot.monitoring` sub-document tracks `lastPingAt`, `isOnline`, `uptimePercent`, `totalDowntime` (minutes), `lastDownAt`, and `pingHistory` (array of timestamped ping results with latency). The `GET /api/spots/:id/health` endpoint exposes this with human-readable freshness labels (`"verified"` < 15 min, `"stale"` < 2 hr, `"unknown"` > 2 hr). Owners can see their hotspot's live health on the dashboard.

- **How do you secure hotspot owner data?**
  The `paymentSetup` sub-document (Razorpay account ID, UPI ID, bank account number, IFSC code) and `wifiPassword` / `ssid` fields are excluded from all public API responses using `.select("-ssid -wifiPassword -paymentSetup")`. These fields are only accessible to the authenticated owner via protected owner-role endpoints. WiFi passwords are stored as-is in MongoDB but the plan is to encrypt them at rest using AES-256 before storing.

---

## 8. Scalability & Performance

_Judges want to know your plans for scaling and optimizing the platform._

- **How would you handle thousands of concurrent users?**
  The Node.js event loop handles concurrent I/O efficiently without blocking. Because JWT auth is stateless, the API tier can be horizontally scaled — run N instances behind a load balancer, each handling its own request pool. MongoDB Atlas supports read replicas and sharding for the data tier. The gateway server scales independently — each WiFi owner runs their own instance, so more hotspots means no extra cloud load.

- **How do you implement load balancing?**
  At the cloud level, deploy multiple Node.js containers behind an AWS ALB or Nginx upstream. The ALB distributes requests using round-robin or least-connections. Since there is no per-instance state (JWT validation only needs the shared `JWT_SECRET` env var), any instance can serve any request. For the hackathon prototype, a single process handles all load, which is sufficient for demo traffic.

- **How do you use caching for performance?**
  Currently there is no caching layer. The immediate plan is to add Redis with a 5-minute TTL cache for the spot list endpoint (`GET /api/spots`), which is read-heavy and changes infrequently. Spot health data (monitoring status) would also be cached to avoid repeated DB reads during the 30-second gateway polling cycle. User session tokens can be cached in Redis for O(1) blacklist lookups.

- **How do you scale the database?**
  MongoDB Atlas M0 (free tier) handles the hackathon demo. For production: upgrade to Atlas M10+, enable replica sets for read scaling and failover, add compound indexes based on the Atlas Performance Advisor's recommendations, and activate Atlas Search for full-text spot queries. For massive scale, MongoDB sharding by `city` field distributes geographic data across shards, enabling city-level isolation.

- **Is microservices architecture a possibility?**
  Yes, and it is a natural fit for AirLink's domain boundaries: an `auth-service`, `spot-service`, `booking-service`, `payment-service`, and `captive-service` are already logically separate in the current codebase (each has its own route file, model, and little cross-dependency). Migrating to microservices would involve extracting each service into its own Node.js process with an API gateway (Kong/Nginx) routing requests.

- **How do you monitor system performance?**
  For the hackathon, `console.log` and MongoDB Atlas metrics dashboard are used. For production: integrate Datadog APM for Node.js (traces, latency histograms, error rates), MongoDB Atlas Performance Advisor for query optimisation, and Sentry for error tracking. Uptime monitoring via Better Uptime or UptimeRobot pings the `GET /` health check endpoint every minute.

- **How do you optimize frontend performance?**
  Vite provides production bundle splitting, tree-shaking, and minification out of the box. TailwindCSS purges unused CSS classes at build time, keeping the stylesheet small. React components are lazy-loaded per route (`React.lazy` + `Suspense` — planned). Images are served from a CDN. The `dummySpots.ts` data avoids unnecessary API calls during UI development, keeping the dev loop fast.

- **How do you handle API rate limits?**
  Razorpay imposes rate limits on its API (orders creation: 100/min). Our booking route batches are well within this. For our own API, `express-rate-limit` with a Redis store will enforce limits per IP (e.g. 60 requests/minute for general endpoints, 10/minute for auth endpoints). Limit headers (`X-RateLimit-Remaining`) will be returned to help clients back off gracefully.

- **How do you manage resource usage?**
  The gateway server cleans up firewall rules every 60 seconds (`CLEANUP_INTERVAL`) to remove stale `AirLink_Allow/Block_*` entries. MongoDB TTL indexes are planned on `CaptiveSession.expiresAt` to auto-expire old session documents. Node.js memory usage is monitored — the in-memory `authenticatedClients` map is bounded by the number of active hotspot clients (small on a single home hotspot). Ping history on WifiSpot is capped at N entries via `$slice` to prevent unbounded growth.

- **How do you prevent bottlenecks?**
  Database queries use indexes on all filter fields to avoid full collection scans. `.lean()` reduces Mongoose overhead on read-heavy list endpoints. The gateway's session validation is asynchronous and non-blocking — it calls `fetch()` against the backend API without blocking the main event loop. Long-running operations (like image processing or report generation) will be offloaded to a background job queue (BullMQ).

- **How do you handle horizontal scaling?**
  Any stateful data (sessions, bookings, users) lives in MongoDB, not in process memory. The gateway is inherently distributed — each owner runs their own instance. The Node.js API is designed to be stateless (no in-process session store, no in-memory cache that needs synchronisation) so new instances can be added to the load balancer pool without coordination.

- **How do you ensure uptime?**
  The backend is deployed on a platform with built-in restart policies (Railway/Render auto-restarts crashed processes). MongoDB Atlas provides 99.95% SLA. The gateway script has graceful shutdown handlers (`SIGINT`, `SIGTERM`) that clean up firewall rules before exit. Health check endpoint (`GET /`) is monitored externally. Database connection errors trigger a clean process exit rather than a zombie state.

- **How do you test for scalability?**
  Load testing is planned with `k6` or Apache JMeter — simulating 500 concurrent booking requests to identify bottlenecks in the booking creation and payment verification routes. Database query performance is analysed with `EXPLAIN()` in MongoDB Compass. Results will guide index additions and caching decisions.

- **How do you optimize backend queries?**
  All list endpoints use field-specific indexes, `skip/limit` pagination, and `.lean()`. The spots endpoint runs a `Promise.all([find(), countDocuments()])` to parallelise the data and count queries. Aggregation pipelines are used for stats (owner earnings, average ratings) rather than in-memory computation on fetched documents. Mongoose populate with `select` options avoids fetching unnecessary fields from referenced documents.

- **How do you handle spikes in traffic?**
  The event-driven Node.js architecture naturally absorbs I/O spikes. AWS Auto Scaling (or Railway's scaling rules) can add server instances when CPU or request latency crosses thresholds. API rate limiting prevents any single client from monopolising resources. MongoDB Atlas connection pool settings (`maxPoolSize`) are tuned to prevent connection exhaustion during spikes. Static assets are served from a CDN, completely independent of the API tier.

---

## 9. Security & Reliability

_Judges assess your strategies for preventing fraud, securing payments, and ensuring reliability._

- **How do you prevent fraud on the platform?**
  Multiple layers: (1) Razorpay HMAC-SHA256 signature verification makes payment confirmation unforgeable. (2) Server-side price calculation prevents client-side manipulation. (3) Access tokens use `crypto.randomBytes(8)` (128-bit entropy) — brute-forcing is computationally infeasible. (4) Reviews are only permitted on bookings with `paymentStatus: "paid"` — fake reviews from non-purchasers are impossible. (5) Owner earnings are computed server-side, preventing commission-bypass attacks.

- **How do you secure payment transactions?**
  All payment communication goes through Razorpay's PCI-DSS compliant infrastructure — AirLink never handles raw card data. Razorpay order creation happens server-to-server. Payment verification uses HMAC-SHA256 with a secret key that only the backend holds. The verify-payment endpoint is a `POST` route guarded by `protect` middleware, so only authenticated users can submit payment confirmations.

- **How do you protect APIs from attacks?**
  CORS restricts origins to the allowlist. The `protect` middleware blocks unauthenticated access. Input is validated at the route level (required field checks) and at the Mongoose schema level (type, enum, length constraints). SQL injection is not applicable (MongoDB uses object queries, not string interpolation). NoSQL injection is mitigated by using Mongoose query builder methods rather than raw `$where` expressions.

- **How do you handle system failures?**
  The backend validates critical environment variables at startup and exits if they are missing — preventing a silent broken state. MongoDB connection failure at startup propagates the error and kills the process (PM2/Railway will restart it). Route handlers catch all async errors and return controlled JSON responses. The gateway has graceful shutdown handlers that clean up firewall rules before the process exits, preventing permanent lockout of hotspot users.

- **How do you log and monitor system activity?**
  Server-side: structured `console.error` logs tagged by route for all exceptions and auth failures. MongoDB Atlas: built-in query performance metrics and slow query alerts. Third-party monitoring (Sentry for error tracking, Datadog for APM) is planned for production. The gateway logs to stdout with timestamps and emojis (🚫 for blocks, ✅ for allows) for real-time operator visibility.

- **How do you ensure data integrity?**
  Mongoose schema validation runs before every save. Unique indexes on `User.email`, `CaptiveSession.sessionToken`, and `Review.booking` enforce entity uniqueness at the DB level. Booking status transitions follow a controlled state machine — a `cancelled` booking cannot be re-activated. Payment amounts are always calculated server-side from authoritative source data (stored `pricePerHour × durationHours`), never trusted from the client.

- **How do you recover from outages?**
  MongoDB Atlas provides automated failover — if the primary node goes down, a replica is elected primary within ~30 seconds. The Node.js process is managed by PM2 (or Railway's process manager) with automatic restart on crash. The `ecosystem.config.js` (planned) will configure PM2 cluster mode for zero-downtime deployments. For gateway outages, the last-known `authenticatedClients` state is recoverable from the `.authenticated-ips.json` shared file.

- **How do you handle DDoS attacks?**
  At the infrastructure level: deploy behind Cloudflare for DDoS mitigation and CDN caching of static assets. AWS WAF or Nginx rate limiting at the edge before requests reach the Node.js process. `express-rate-limit` in the application layer for API-level protection. The stateless JWT model means even if the API tier is overwhelmed, bringing up additional instances is fast and requires no state migration.

- **How do you secure user data?**
  Passwords are hashed with bcrypt (cost factor 12). Sensitive WifiSpot fields (`wifiPassword`, `ssid`, `paymentSetup`) are excluded from public API responses. JWTs use a strong secret (`JWT_SECRET` enforced at startup). Data is stored on MongoDB Atlas which encrypts at rest by default (AES-256). In transit, all connections use TLS (HTTPS in production, ngrok HTTPS for development demos).

- **How do you test for vulnerabilities?**
  Currently: manual security review of authentication flows, CORS configuration, and payment verification logic. Planned: OWASP ZAP automated scanning against the staging API to detect injection vulnerabilities, misconfigured CORS, and missing security headers. npm `audit` runs on every dependency install to catch known CVEs. Headers like `Strict-Transport-Security`, `X-Content-Type-Options`, and `Content-Security-Policy` will be added via Helmet.js middleware.

- **How do you handle backup and disaster recovery?**
  MongoDB Atlas continuous backups (M10+) with point-in-time restore to any second in the last 24 hours. Daily snapshots retained for 7 days. For infrastructure: all configuration is in code (environment variables, Mongoose schemas, seed scripts) so a full environment can be rebuilt from the repository in minutes. The gateway script is version-controlled and re-deployable by owners in one command.

- **How do you monitor for suspicious activity?**
  The signin route logs all authentication failures with the email attempted and timestamp. Repeated `401` responses from the same IP will trigger an alert via `express-rate-limit` callbacks. Unusual booking patterns (e.g. same user booking the same spot multiple times in quick succession) will be detected by a scheduled MongoDB aggregation job. Razorpay Shield provides payment-level fraud detection independently.

- **How do you ensure reliability of the platform?**
  Redis-backed sessions (planned), MongoDB Atlas replica sets, auto-restart process managers (PM2/Railway), HTTPS on all tiers, and a comprehensive monitoring stack together provide the reliability foundation. For the captive portal specifically — it is designed to fail safe: if the backend is unreachable, already-authenticated sessions retain access (graceful degradation) while new authentication attempts fail closed.

- **How do you handle third-party service failures?**
  If Razorpay is down, the booking creation endpoint catches the SDK error and returns a user-readable error ("Payment service temporarily unavailable"). If MongoDB Atlas is unreachable, the connection error is caught and a `503` is returned. If the gateway cannot reach the backend, it logs the error and skips the session validation cycle without revoking authenticated clients. Circuit breaker patterns (via `opossum`) are planned to fail fast and recover gracefully.

- **How do you keep dependencies up to date?**
  `npm audit` is run before each dependency update to check for known CVEs. Dependabot (or Renovate) is planned to auto-open PRs for patch and minor dependency updates. Major version upgrades (e.g. MongoDB driver, Express 5.x) are done manually with full regression testing. The `package.json` uses exact or `^` version ranges to avoid unexpected breaking changes from transitive dependencies.

---

## 10. Future Improvements

_Judges want to see your vision for growth and innovation._

- **How would you scale AirLink to multiple cities?**
  The `WifiSpot` schema already stores `city` and `state` fields with a `city` index and a `lat/lng` 2dsphere index for geo-proximity queries. Scaling to multiple cities requires no schema changes — the spot discovery API's `city` filter and future geo-radius search are already architecturally supported. City launch playbooks (community onboarding, local marketing, seed owners) will drive supply-side growth city by city.

- **What are your plans for mobile apps?**
  The React frontend is designed as a mobile-responsive PWA (Progressive Web App) as a first step — installable on Android/iOS home screens with offline caching of recently viewed spots. Native apps (React Native, sharing business logic and API client code with the web) are the next phase, adding push notifications for booking confirmations, OS-level hotspot detection, and biometric authentication.

- **How could AI be used for hotspot recommendations?**
  An AI recommendation engine could analyse a user's booking history (time of day, location, duration, speed requirements) and suggest nearby spots matching their usage patterns. It could also dynamically price spots based on demand signals (peak hours, local events) — similar to surge pricing. A simple collaborative filtering model trained on booking + review data would be the starting point.

- **How would you implement offline authentication?**
  Offline authentication could use pre-signed QR codes: at booking time, the backend signs a compact JWT with the booking ID, device ID, and expiry time. The QR is displayed in the app. The gateway (which has the JWT secret) can verify the QR locally without a network round-trip. This would be valuable for hotspot locations with intermittent backend connectivity.

- **How could IoT router integration work?**
  Instead of requiring the owner to run a Windows laptop as a gateway, dedicated AirLink firmware (based on OpenWrt) could be flashed onto consumer routers. The firmware would expose the same captive portal page and enforce access via `iptables` rules, with a background daemon polling the AirLink backend API. A plug-and-play "AirLink Router" hardware product would dramatically lower the barrier to entry for owners.

- **What new features would you add?**
  Top priority features: (1) Group bookings (multiple users book the same spot as a party). (2) Subscription plans (users buy a monthly WiFi pass for a set of spots). (3) Owner analytics dashboard with earnings charts, peak usage times, and user demographics. (4) In-app chat between users asking questions and owners. (5) Loyalty rewards system for frequent users.

- **How would you improve user experience?**
  One-tap rebooking of previously used spots. Real-time speed test before booking to set expectations. Favourite spots list with price-drop alerts. Onboarding tutorial for first-time users. Progressive disclosure of the captive portal flow — the OTP entry should auto-detect via deep-link when the OS captive portal browser opens.

- **How would you expand payment options?**
  Add international card support via Stripe (for non-India visitors). UPI Autopay for subscription plans. Cryptocurrency payments (stablecoin) for privacy-conscious users. Wallet top-up feature — users load AirLink credits and booking deducts from the balance (reduces per-transaction Razorpay fees). BNPL (Buy Now Pay Later) integration for premium long-duration bookings.

- **How would you support enterprise customers?**
  An enterprise tier would provide: dedicated API keys with higher rate limits, bulk booking for employee WiFi access, SSO integration (SAML/OAuth with corporate identity providers), custom branded captive portals, SLA-backed uptime guarantees, centralized invoicing and GST-compliant receipts, and a B2B dashboard for IT administrators to manage company-wide WiFi access policies.

- **How would you handle internationalization?**
  The frontend would use `react-i18next` for string translation and `Intl` APIs for date, time, and currency formatting. The backend would accept `Accept-Language` headers for localised error messages. MongoDB stores amounts in local currency with a `currency` field on Booking. Razorpay supports multiple currencies and can be complemented by Stripe for international markets.

- **How would you improve platform security?**
  Short-term: add Helmet.js for security headers, `express-rate-limit` for brute-force protection, and move JWT from `localStorage` to `httpOnly` cookies with `SameSite=Strict`. Medium-term: implement token rotation (refresh tokens + short-lived access tokens), add 2FA (TOTP/SMS OTP) for owner accounts, and encrypt WiFi passwords at rest with AES-256. Long-term: achieve SOC 2 Type II compliance.

- **How would you automate hotspot onboarding?**
  An "AirLink Setup Wizard" desktop app (Electron or a web-based installer) would guide owners through: entering their broadband details, downloading and auto-configuring `gateway.js`, testing the captive portal end-to-end, setting pricing, and publishing their spot — all in under 10 minutes. The wizard would auto-detect the hotspot network interface and pre-fill the gateway configuration.

- **How would you use analytics for growth?**
  A data warehouse (BigQuery or Redshift) would aggregate booking events, session logs, and review data. Growth analytics would track: owner supply growth by city, user retention cohorts, booking funnel drop-off, peak demand heat maps, and revenue per spot category. These insights drive supply-side outreach (recruiting new owners in high-demand areas) and demand-side features (price recommendations).

- **How would you build a community around AirLink?**
  The `Community` page (already in the frontend) is the starting point — a forum where owners share tips and users recommend spots. Building on this: verified owner profiles with response rate badges, user leaderboards for most reviews, local city chapters with WhatsApp/Discord groups, and an annual "AirLink Host of the Year" award to incentivise owner quality. Open-sourcing the gateway script to build developer contributions.

- **What is your roadmap for the next year?**
  **Q1 (post-hackathon):** Launch MVP in 2 cities, onboard 50 owner spots, implement `express-rate-limit` and Helmet.js. **Q2:** Mobile PWA launch, Razorpay webhook integration, MongoDB Atlas upgrade, basic analytics dashboard. **Q3:** React Native apps (iOS + Android), subscription plans, enterprise tier pilot. **Q4:** IoT router firmware prototype, AI recommendations MVP, expand to 10 cities, 1,000 active spots. By month 12: Series A fundraise targeting ₹5 Cr to fuel national expansion.

---

_Use this document to rehearse answers, anticipate judge concerns, and strengthen your hackathon pitch for AirLink WiFi Sharing Marketplace._
