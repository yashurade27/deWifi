# 🚀 Airlink Web3 — Full Stack Integration Guide

Complete step-by-step guide to deploy smart contracts and test the full frontend + backend + blockchain integration.

---

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **MetaMask** browser extension
- **MongoDB** running (local or Atlas)
- **Git** (for cloning)

---

## 🔧 Part 1: Initial Setup

### 1.1 Install Dependencies

```bash
# Root directory (if package.json exists)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Blockchain
cd ../blockchain
npm install
```

### 1.2 Configure Environment Files

#### **Backend** (`backend/.env`)
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/airlink
JWT_SECRET=dev_secret_key_change_in_production
CLIENT_URL=http://localhost:5173

# These will be auto-filled by deploy script
WIFI_REGISTRY_ADDRESS=
ACCESS_NFT_ADDRESS=
PAYMENT_ESCROW_ADDRESS=
ACCESS_MANAGER_ADDRESS=

BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_NETWORK_ID=31337
```

#### **Frontend** (`frontend/.env`)
```bash
cd ../frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000

# These will be auto-filled by deploy script
VITE_WIFI_REGISTRY_ADDRESS=
VITE_ACCESS_NFT_ADDRESS=
VITE_PAYMENT_ESCROW_ADDRESS=
VITE_ACCESS_MANAGER_ADDRESS=

VITE_BLOCKCHAIN_NETWORK=localhost
VITE_BLOCKCHAIN_NETWORK_ID=31337
```

#### **Blockchain** (`blockchain/.env`)
```bash
cd ../blockchain
cp .env.example .env
```

For local testing, you can leave the Sepolia fields empty.

---

## 🏗️ Part 2: Deploy Smart Contracts

### Option A: Local Hardhat Network (Recommended for Testing)

#### Step 1: Start Hardhat Node
```bash
cd blockchain
npx hardhat node
```

This starts a local Ethereum node on `http://127.0.0.1:8545` with 20 pre-funded test accounts. **Keep this terminal running.**

#### Step 2: Deploy Contracts (New Terminal)
```bash
cd blockchain
npx hardhat run scripts/deploy-with-env.ts --network localhost
```

**Expected Output:**
```
════════════════════════════════════════════════════════
  🚀 Airlink v2 — Blockchain Deployment
════════════════════════════════════════════════════════
  Network:        localhost
  Deployer:       0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Balance:        10000.0 ETH
════════════════════════════════════════════════════════

📦 [1/4] Deploying WiFiRegistry...
     ✓ WiFiRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📦 [2/4] Deploying AirlinkAccessNFT...
     ✓ AirlinkAccessNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

📦 [3/4] Deploying PaymentEscrow...
     ✓ PaymentEscrow deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

📦 [4/4] Deploying AccessManager...
     ✓ AccessManager deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

🔗 Linking contracts...
  ✓ WiFiRegistry → AccessManager linked
  ✓ AirlinkAccessNFT → AccessManager linked
  ✓ PaymentEscrow → AccessManager linked

📝 Updating .env files with deployed addresses...
  ✓ Updated blockchain/.env
  ✓ Updated backend/.env
  ✓ Updated frontend/.env
  ✓ Updated frontend/src/lib/contracts.ts

════════════════════════════════════════════════════════
  ✅ Deployment Complete!
════════════════════════════════════════════════════════
```

The script automatically updates all `.env` files and `frontend/src/lib/contracts.ts` with deployed addresses.

### Option B: Sepolia Testnet (For Production-Like Testing)

1. Get Sepolia ETH from faucet: https://sepoliafaucet.com/
2. Update `blockchain/.env` with your Alchemy/Infura URL and private key
3. Deploy:
```bash
npx hardhat run scripts/deploy-with-env.ts --network sepolia
```

---

## 🦊 Part 3: MetaMask Setup

### 3.1 Add Hardhat Local Network

1. Open MetaMask
2. Click network dropdown → **Add Network** → **Add a network manually**
3. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save**

### 3.2 Import Test Account

The Hardhat node creates 20 test accounts with 10,000 ETH each. Import the first one:

1. Copy the **private key** from Hardhat node output (Account #0):
   ```
   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

2. In MetaMask:
   - Click account icon → **Import Account**
   - Paste the private key
   - Click **Import**

3. Switch to **Hardhat Local** network

You should now see **10000 ETH** in your MetaMask.

---

## 🗄️ Part 4: Start Backend

```bash
cd backend

# Make sure MongoDB is running (local)
# or you've configured Atlas URI in .env

npm run dev
```

**Expected Output:**
```
[nodemon] starting `ts-node src/server.ts`
MongoDB connected: 127.0.0.1
Server running on port 3000
```

**Keep this terminal running.**

---

## 🎨 Part 5: Start Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal running.**

---

## 🧪 Part 6: Test Full Integration

### 6.1 Create User Account

1. Open browser: http://localhost:5173
2. Click **Sign Up**
3. Select **Find WiFi** (user role)
4. Fill form and create account
5. You'll be logged in

### 6.2 Create WiFi Spot (Owner Flow)

1. Log out and create another account
2. This time select **Share & Earn** (owner role)
3. After login, click **List WiFi Spot**
4. Fill in spot details:
   - Name: "Test Cafe WiFi"
   - Address: "123 Main St"
   - Price: ₹50/hour
   - Speed: 100 Mbps
5. Submit — spot saved to MongoDB

### 6.3 Book WiFi (Full Blockchain Flow)

1. Log out and log back in as **user** (first account)
2. Go to **Explore** → Click on the test spot
3. Click **Connect Wallet** button
4. MetaMask popup:
   - Select your imported Hardhat account
   - Click **Next** → **Connect**
5. Select duration (e.g., 2 hours)
6. Click **Pay X ETH** button
7. MetaMask transaction popup:
   - Review gas + amount
   - Click **Confirm**
8. Wait for blockchain confirmation (~2-5 seconds on local)
9. **Success!** You'll see:
   - Access token & OTP
   - "Open Captive Portal" button
   - Session details

### 6.4 Verify On-Chain Data

Check the Hardhat node terminal — you'll see transaction logs:
```
eth_sendTransaction
eth_getTransactionReceipt
Contract call: AccessManager.purchaseAccess()
  ✓ NFT minted: tokenId 1
  ✓ Payment escrowed: 0.001 ETH
```

### 6.5 Check Backend Storage

The booking record is saved in MongoDB with:
- `txHash`: "0xabc123..."
- `tokenId`: 1
- `paymentStatus`: "paid"
- `status`: "confirmed"

You can verify in your dashboard: http://localhost:5173/dashboard

---

## 📊 Part 7: Verify Complete Flow

### Check 1: Smart Contract State
```bash
cd blockchain
npx hardhat console --network localhost
```

In console:
```javascript
const manager = await ethers.getContractAt("AccessManager", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
const session = await manager.getSession(1); // tokenId = 1
console.log(session);
```

Expected output shows session data: user, spot, amounts, timestamps.

### Check 2: Backend API
```bash
curl http://localhost:3000/api/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should return your booking with `txHash` and `tokenId`.

### Check 3: Frontend State
Open browser DevTools → Application → Local Storage:
- Should see `airlink_payment_spotId` with booking credentials

---

## 🔄 Part 8: Testing Session Lifecycle

### Cancel Booking (Proportional Refund)
1. Go to booking in dashboard
2. Click **Cancel Session**
3. Confirm MetaMask transaction
4. Smart contract calculates remaining time % and refunds that amount
5. MongoDB status: "cancelled"
6. Backend decrements `currentUsers` on spot

### Complete Session (Release Payment)
1. Wait for session to expire (or manually call `completeSession`)
2. Smart contract releases escrowed ETH to spot owner
3. Platform fee sent to platform wallet
4. Status: "completed"

---

## 🐛 Troubleshooting

### Issue: "Nonce too high" in MetaMask
**Solution**: Reset account in MetaMask → Settings → Advanced → Reset Account

### Issue: "Cannot connect to blockchain"
**Solution**: Make sure Hardhat node is running and MetaMask is on Hardhat Local network

### Issue: "Insufficient funds"
**Solution**: Import a Hardhat test account with 10000 ETH (see Part 3.2)

### Issue: Backend can't connect to MongoDB
**Solution**: 
```bash
# Start local MongoDB
sudo systemctl start mongodb
# Or use MongoDB Atlas and update MONGO_URI
```

### Issue: Frontend can't reach backend
**Solution**: Check backend is running on port 3000 and CORS is enabled

### Issue: Contract addresses not updating
**Solution**: Manually copy addresses from deploy output to:
- `frontend/src/lib/contracts.ts` → `CONTRACT_ADDRESSES` object
- `backend/.env` → contract address variables
- `frontend/.env` → `VITE_*` variables

---

## 📁 Project Structure

```
hackoverflow/
├── blockchain/                 # Smart contracts
│   ├── contracts/              # Solidity files
│   │   ├── WiFiRegistry.sol
│   │   ├── AirlinkAccessNFT.sol
│   │   ├── PaymentEscrow.sol
│   │   └── AccessManager.sol
│   ├── scripts/
│   │   └── deploy-with-env.ts  # Auto-updates .env files
│   ├── test/
│   │   └── AirlinkV2.test.ts   # 58 passing tests
│   └── hardhat.config.ts
│
├── backend/                    # Express API
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts     # Web3 integration
│   │   │   └── spots.ts
│   │   ├── models/
│   │   │   ├── Booking.ts      # txHash + tokenId fields
│   │   │   ├── User.ts
│   │   │   └── WifiSpot.ts     # walletAddress field
│   │   └── middleware/
│   │       └── auth.ts
│   └── package.json
│
└── frontend/                   # React + Vite
    ├── src/
    │   ├── pages/
    │   │   ├── BookWifi.tsx    # MetaMask + Web3
    │   │   ├── UserDashboard.tsx
    │   │   └── ...
    │   ├── lib/
    │   │   ├── contracts.ts    # Web3 helpers
    │   │   └── api.ts
    │   ├── context/
    │   │   ├── Web3Context.tsx # Wallet connection
    │   │   └── AuthContext.tsx
    │   └── components/
    └── package.json
```

---

## 🎯 Key Integration Points

### 1. **Frontend → Smart Contract**
- `src/lib/contracts.ts` → `bookWifiAccess()` calls `AccessManager.purchaseAccess()`
- Sends ETH, mints NFT, escrows payment
- Returns `txHash` and `tokenId`

### 2. **Frontend → Backend**
- After blockchain tx confirms, POST to `/api/bookings` with:
  ```json
  {
    "wifiSpotId": "...",
    "durationHours": 2,
    "txHash": "0xabc...",
    "tokenId": 1
  }
  ```

### 3. **Backend → Database**
- Stores booking with blockchain references
- Generates access token for captive portal
- Links user, spot, and on-chain session

### 4. **Captive Portal → Smart Contract**
- Gateway verifies access by calling `AccessManager.verifyAccess(tokenId, user)`
- Returns true if NFT valid + not expired + not revoked

---

## 🔐 Security Notes

- ⚠️ **Never commit `.env` files** to Git
- ⚠️ **Never share private keys**
- ⚠️ Test accounts are for development only
- ✅ For production: use hardware wallets and Sepolia/Mainnet

---

## ✅ Success Checklist

- [ ] Hardhat node running
- [ ] Contracts deployed (4 addresses logged)
- [ ] `.env` files updated automatically
- [ ] MetaMask connected to Hardhat Local (31337)
- [ ] Test account imported (10000 ETH visible)
- [ ] MongoDB running
- [ ] Backend API running (port 3000)
- [ ] Frontend running (port 5173)
- [ ] User account created
- [ ] Owner account created + spot listed
- [ ] Booking completed with ETH payment
- [ ] Dashboard shows active session
- [ ] MetaMask shows transaction history

---

## 🚀 Next Steps

After successful local testing:

1. **Deploy to Sepolia testnet** for staging
2. **Get Sepolia ETH** from faucet
3. **Update frontend** to use Sepolia network ID
4. **Verify contracts** on Etherscan
5. **Deploy backend** to Railway/Render
6. **Deploy frontend** to Vercel/Netlify
7. **Set up MongoDB Atlas** for cloud DB

---

## 📚 Additional Resources

- **Smart Contract Tests**: `blockchain/test/AirlinkV2.test.ts` (58 tests)
- **Architecture Doc**: `WEB3_ARCHITECTURE.md`
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts/
- **ethers.js v6**: https://docs.ethers.org/v6/

---

**Questions?** Check the troubleshooting section or review the test suite for usage examples.

🎉 **Happy hacking!**
