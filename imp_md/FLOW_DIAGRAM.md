# 🔄 Airlink Web3 — Complete Flow Diagram

## 📋 User Journey: Book WiFi with Blockchain

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant MM as MetaMask
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant BC as Blockchain (Contracts)
    participant DB as MongoDB

    Note over U,DB: 1️⃣ USER SIGNUP & LOGIN
    U->>FE: Sign up (user role)
    FE->>BE: POST /api/auth/signup
    BE->>DB: Store user account
    BE-->>FE: JWT token
    FE-->>U: Logged in

    Note over U,DB: 2️⃣ OWNER LISTS WIFI SPOT
    U->>FE: List WiFi spot (as owner)
    FE->>BE: POST /api/spots
    BE->>DB: Store spot metadata
    BE-->>FE: Spot created
    FE-->>U: Success

    Note over U,DB: 3️⃣ USER BROWSES SPOTS
    U->>FE: Open "Explore" page
    FE->>BE: GET /api/spots
    BE->>DB: Query available spots
    DB-->>BE: Spot list
    BE-->>FE: Spot data
    FE-->>U: Display spots

    Note over U,DB: 4️⃣ USER CONNECTS WALLET
    U->>FE: Click "Connect Wallet"
    FE->>MM: Request connection
    MM->>U: Approve connection?
    U->>MM: Approve
    MM-->>FE: Wallet connected (address)
    FE-->>U: Show wallet address

    Note over U,DB: 5️⃣ USER BOOKS WIFI
    U->>FE: Select spot + duration → "Pay X ETH"
    FE->>BC: calculateCost(spotId, duration)
    BC-->>FE: totalCost, ownerShare, platformFee
    FE->>U: Show ETH amount

    U->>FE: Confirm payment
    FE->>MM: Request transaction approval
    MM->>U: Confirm transaction with gas?
    U->>MM: Confirm
    
    Note over U,DB: 6️⃣ BLOCKCHAIN TRANSACTION
    MM->>BC: purchaseAccess(spotId, duration) + ETH
    BC->>BC: 1. Mint Access NFT (tokenId)
    BC->>BC: 2. Escrow ETH payment
    BC->>BC: 3. Update spot capacity
    BC-->>MM: Transaction receipt
    MM-->>FE: txHash + event logs
    
    FE->>FE: Parse "AccessPurchased" event → tokenId
    
    Note over U,DB: 7️⃣ BACKEND RECORDS BOOKING
    FE->>BE: POST /api/bookings {txHash, tokenId, spotId, duration}
    BE->>DB: Store booking with blockchain refs
    BE->>DB: Generate accessToken + OTP
    BE->>DB: Set status: "confirmed", paymentStatus: "paid"
    BE-->>FE: Booking record + credentials
    
    Note over U,DB: 8️⃣ USER RECEIVES ACCESS
    FE-->>U: Success! Show:
    Note right of U: ✅ Access Token<br/>✅ OTP<br/>✅ Session duration<br/>✅ "Open Captive Portal" button

    Note over U,DB: 9️⃣ USER CONNECTS TO WIFI
    U->>U: Connect to owner's hotspot
    U->>FE: Click "Open Captive Portal"
    FE->>BE: GET /api/captive/portal?token=...
    BE->>BC: verifyAccess(tokenId, userAddress)
    BC-->>BE: {valid: true, expiresAt: timestamp}
    BE-->>FE: Portal page with auto-filled token
    FE-->>U: Enter token to activate internet

    Note over U,DB: 🔟 SESSION COMPLETION
    Note over U,DB: Option A: Session Expires
    BC->>BC: Auto-complete after endTime
    BC->>BC: Release escrowed ETH → owner (98%)
    BC->>BC: Platform fee → platform wallet (2%)
    U->>FE: Check dashboard
    FE->>BE: GET /api/bookings/:id
    BE->>DB: Fetch booking (status: "completed")
    BE-->>FE: Show completed session
    
    Note over U,DB: Option B: User Cancels Early
    U->>FE: Click "Cancel Session"
    FE->>MM: Request transaction
    MM->>BC: cancelSession(tokenId)
    BC->>BC: Calculate time remaining %
    BC->>BC: Refund proportional amount
    BC-->>MM: Refund transaction receipt
    MM-->>FE: Cancelled
    FE->>BE: PATCH /api/bookings/:id/cancel
    BE->>DB: Update status: "cancelled"
    BE-->>FE: Refund confirmation
    FE-->>U: Show refund amount
```

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        A[BookWifi.tsx]
        B[UserDashboard.tsx]
        C[Web3Context]
        D[contracts.ts]
    end
    
    subgraph "Backend (Express)"
        E[bookings.ts route]
        F[spots.ts route]
        G[Booking model]
        H[WifiSpot model]
    end
    
    subgraph "Database"
        I[(MongoDB)]
    end
    
    subgraph "Blockchain (Ethereum)"
        J[AccessManager]
        K[WiFiRegistry]
        L[AirlinkAccessNFT]
        M[PaymentEscrow]
    end
    
    N[MetaMask]
    
    A --> C
    C --> N
    C --> D
    D --> J
    
    A --> E
    B --> E
    E --> G
    E --> I
    F --> H
    H --> I
    
    J --> K
    J --> L
    J --> M
    
    style J fill:#4CAF50
    style K fill:#2196F3
    style L fill:#FF9800
    style M fill:#9C27B0
```

---

## 🔐 Smart Contract Flow

```mermaid
flowchart TD
    Start([User clicks Pay X ETH]) --> MM[MetaMask Popup]
    MM --> |User approves| TX[Transaction to AccessManager]
    
    TX --> AM{AccessManager.purchaseAccess}
    
    AM --> V1[Validate spot exists & active]
    V1 --> V2[Check spot has capacity]
    V2 --> V3[Verify ETH amount ≥ required]
    V3 --> V4[Calculate payment split]
    
    V4 --> AC1[Call WiFiRegistry.incrementUsers]
    AC1 --> AC2[Call AirlinkAccessNFT.mintAccess]
    AC2 --> AC3[Call PaymentEscrow.deposit ETH]
    
    AC3 --> Event[Emit AccessPurchased event]
    Event --> Receipt[Transaction receipt + tokenId]
    
    Receipt --> |Frontend receives| Save[Backend saves booking]
    Save --> Success([User sees success screen])
    
    style AM fill:#4CAF50
    style Event fill:#FF9800
    style Success fill:#2196F3
```

---

## 📊 Data Flow

### Booking Record (MongoDB)
```json
{
  "_id": "65f3a2b1c4d5e6f7a8b9c0d1",
  "user": "65f3a1a2b3c4d5e6f7a8b9c0",
  "wifiSpot": "65f3a0a1b2c3d4e5f6a7b8c9",
  "owner": "65f3a2b3c4d5e6f7a8b9c0d2",
  
  "startTime": "2026-03-09T10:00:00Z",
  "endTime": "2026-03-09T12:00:00Z",
  "durationHours": 2,
  
  "pricePerHour": 50,
  "subtotal": 100,
  "platformFee": 2,
  "ownerEarnings": 98,
  "totalAmount": 100,
  
  "status": "confirmed",
  "paymentStatus": "paid",
  
  "txHash": "0x1abc2def3456789abc0def123456789abc0def123456789abc0def123456789a",
  "tokenId": 1,
  
  "accessToken": "A1B2C3D4E5F6G7H8",
  "accessTokenOTP": "123456",
  "maxDevices": 1,
  
  "createdAt": "2026-03-09T09:55:00Z",
  "updatedAt": "2026-03-09T10:00:00Z"
}
```

### Smart Contract Session (On-Chain)
```solidity
struct Session {
    uint256 tokenId;           // 1
    uint256 spotId;            // 1
    address user;              // 0xUserAddress
    address spotOwner;         // 0xOwnerAddress
    uint256 totalPaid;         // 0.002 ETH (example)
    uint256 ownerShare;        // 0.00196 ETH (98%)
    uint256 platformFee;       // 0.00004 ETH (2%)
    uint256 startTime;         // 1709982000
    uint256 endTime;           // 1709989200
    SessionStatus status;      // Active / Completed / Cancelled
}
```

### Access Pass NFT (ERC-721)
```solidity
struct AccessPass {
    uint256 spotId;            // 1
    address originalBuyer;     // 0xUserAddress
    uint256 startTime;         // 1709982000
    uint256 expiresAt;         // 1709989200
    uint256 durationHours;     // 2
    bool revoked;              // false
}
```

---

## 🔄 State Transitions

```mermaid
stateDiagram-v2
    [*] --> Pending: User initiates booking
    Pending --> Confirmed: Blockchain tx succeeds + backend records
    Confirmed --> Active: User starts using WiFi
    Active --> Completed: Session expires or manually completed
    Active --> Cancelled: User cancels mid-session
    Confirmed --> Cancelled: User cancels before starting
    
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Confirmed: paymentStatus: "paid"<br/>txHash + tokenId stored
    note right of Active: User connected to WiFi<br/>Portal authenticated
    note right of Completed: Payment released to owner<br/>NFT remains (expired)
    note right of Cancelled: Proportional refund issued<br/>NFT revoked
```

---

## 🎯 Key Integration Points

### 1. Frontend → Blockchain
```typescript
// contracts.ts
export async function bookWifiAccess(
  signer: ethers.Signer,
  spotId: number,
  durationHours: number,
  totalCostWei: bigint
): Promise<{ bookingId: number; txHash: string }> {
  const contract = getManagerContract(signer);
  const tx = await contract.purchaseAccess(spotId, durationHours, 0, {
    value: totalCostWei,
  });
  const receipt = await tx.wait();
  
  // Parse AccessPurchased event for tokenId
  const tokenId = parseEventLog(receipt, "AccessPurchased").tokenId;
  return { bookingId: tokenId, txHash: receipt.hash };
}
```

### 2. Frontend → Backend
```typescript
// After blockchain tx succeeds
const bookingRes = await apiFetch('/api/bookings', {
  method: 'POST',
  body: {
    wifiSpotId: spot._id,
    durationHours: duration,
    txHash: txHash,
    tokenId: tokenId,
  },
  token: authToken,
});
```

### 3. Backend → Database
```typescript
// bookings.ts
const booking = await Booking.create({
  user: req.userId,
  wifiSpot: wifiSpotId,
  owner: spot.owner,
  startTime, endTime, durationHours,
  pricePerHour, subtotal, platformFee, ownerEarnings, totalAmount,
  
  status: "confirmed",
  paymentStatus: "paid",
  
  txHash,     // Blockchain reference
  tokenId,    // NFT ID
  
  accessToken: generateToken(),
  accessTokenOTP: generateOTP(),
});
```

### 4. Captive Portal → Blockchain
```typescript
// Backend verifies access on-chain
const [valid, spotId, expiresAt] = await accessManagerContract.verifyAccess(
  tokenId,
  userAddress
);

if (!valid) {
  throw new Error("Access denied - invalid or expired token");
}
```

---

## ⚡ Quick Start Commands

```bash
# 1. One-command setup
./quick-start.sh

# 2. Start backend (Terminal 1)
cd backend && npm run dev

# 3. Start frontend (Terminal 2)
cd frontend && npm run dev

# 4. Open browser
# http://localhost:5173

# 5. Connect MetaMask
# Network: Hardhat Local (Chain ID: 31337)
# Import account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 📚 Documentation Links

- **Setup Guide**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Architecture**: [WEB3_ARCHITECTURE.md](./WEB3_ARCHITECTURE.md)
- **Smart Contracts**: `blockchain/contracts/`
- **Tests**: `blockchain/test/AirlinkV2.test.ts` (58 passing)

---

**🎉 Ready to test the full Web3 integration!**
