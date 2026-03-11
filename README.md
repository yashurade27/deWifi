# 🚀 Airlink — Web3 WiFi Marketplace

Decentralized WiFi sharing platform powered by Ethereum smart contracts. Pay with ETH, access tokens as NFTs, automated escrow payments.

## ⚡ Quick Start (5 minutes)

### Automated Setup
```bash
./quick-start.sh
```

This will:
- ✅ Install all dependencies
- ✅ Compile smart contracts
- ✅ Start Hardhat local node
- ✅ Deploy contracts
- ✅ Update .env files automatically

Then start services:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Open http://localhost:5173 and connect MetaMask to **Hardhat Local** (Chain ID: 31337)

**Import test account:**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 📚 Manual Setup

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed step-by-step instructions.

---

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │────────▶│    Backend   │────────▶│    MongoDB      │
│  React+Vite │         │  Express API │         │   (Bookings)    │
└─────────────┘         └──────────────┘         └─────────────────┘
       │                                                    │
       │                                                    │
       ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Ethereum Blockchain                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ WiFiRegistry   │  │ AirlinkAccessNFT│  │ PaymentEscrow    │   │
│  │ (Spot metadata)│  │ (ERC-721 passes)│  │ (ETH custody)    │   │
│  └────────────────┘  └─────────────────┘  └──────────────────┘   │
│           │                   │                       │            │
│           └───────────────────┴───────────────────────┘            │
│                        ┌──────────────────┐                        │
│                        │ AccessManager    │                        │
│                        │ (Orchestrator)   │                        │
│                        └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Smart Contracts**: Solidity ^0.8.28, OpenZeppelin v5, Hardhat
- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Vite, TailwindCSS, ethers.js v6
- **Blockchain**: Ethereum (local/Sepolia), MetaMask

---

## 📁 Project Structure

```
hackoverflow/
├── blockchain/              # Smart contracts (4 modular contracts)
│   ├── contracts/
│   │   ├── WiFiRegistry.sol        # Spot metadata & pricing
│   │   ├── AirlinkAccessNFT.sol    # ERC-721 access passes
│   │   ├── PaymentEscrow.sol       # ETH custody & release
│   │   └── AccessManager.sol       # Main orchestrator
│   ├── scripts/
│   │   └── deploy-with-env.ts      # Auto-updates .env files
│   └── test/
│       └── AirlinkV2.test.ts       # 58 passing tests
│
├── backend/                 # Express REST API
│   └── src/
│       ├── routes/
│       │   ├── bookings.ts         # Records txHash + tokenId
│       │   ├── spots.ts
│       │   └── auth.ts
│       └── models/
│           ├── Booking.ts          # Blockchain-linked bookings
│           ├── WifiSpot.ts         # Includes walletAddress
│           └── User.ts
│
├── frontend/                # React SPA
│   └── src/
│       ├── pages/
│       │   ├── BookWifi.tsx        # MetaMask integration
│       │   ├── UserDashboard.tsx
│       │   └── ...
│       ├── lib/
│       │   ├── contracts.ts        # Web3 helpers + ABIs
│       │   └── api.ts
│       └── context/
│           ├── Web3Context.tsx     # Wallet connection
│           └── AuthContext.tsx
│
├── quick-start.sh           # One-command setup
├── INTEGRATION_GUIDE.md     # Detailed setup guide
└── WEB3_ARCHITECTURE.md     # Technical documentation
```

---

## 🎯 Key Features

### For Users
- ✅ Browse WiFi spots with real-time availability
- ✅ Pay with ETH (MetaMask)
- ✅ Receive access as NFT (ERC-721)
- ✅ Time-based access control
- ✅ Automatic refunds on cancellation
- ✅ Session tracking & history

### For Owners
- ✅ List WiFi spots
- ✅ Set hourly pricing
- ✅ Automatic payment distribution (98% owner, 2% platform)
- ✅ Real-time monitoring
- ✅ Earnings dashboard

### Technical
- ✅ Modular smart contract architecture
- ✅ ERC-721 NFTs for access rights
- ✅ Escrow with automatic release/refund
- ✅ On-chain verification for captive portals
- ✅ Proportional refunds based on time remaining
- ✅ Gas-optimized (viaIR, Cancun EVM)
- ✅ 58 comprehensive tests (100% passing)

---

## 🧪 Testing

### Smart Contracts
```bash
cd blockchain
npm test
```

**Output:** 58 tests covering deployment, booking flow, cancellations, disputes, access control.

### Full Stack Integration
1. Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. Test booking flow with MetaMask
3. Verify on-chain state in Hardhat console
4. Check MongoDB records
5. Test session lifecycle (book → use → complete/cancel)

---

## 🌐 Deployment

### Local Testing (Hardhat)
```bash
# Start node
cd blockchain && npx hardhat node

# Deploy contracts
npm run deploy

# Start backend
cd ../backend && npm run dev

# Start frontend
cd ../frontend && npm run dev
```

### Sepolia Testnet
```bash
# Update blockchain/.env with Alchemy URL and private key
cd blockchain
npm run deploy:sepolia

# Update frontend/.env to use Sepolia network
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_BLOCKCHAIN_NETWORK_ID=11155111
```

---

## 📖 Documentation

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** — Complete setup & testing guide
- **[WEB3_ARCHITECTURE.md](./WEB3_ARCHITECTURE.md)** — Technical architecture & contracts
- **[BLOCKCHAIN_ARCHITECTURE.md](./BLOCKCHAIN_ARCHITECTURE.md)** — Original design doc

---

## 🔐 Security

- ⚠️ **Test accounts only** — Never use Hardhat private keys in production
- ⚠️ **Never commit `.env` files**
- ✅ OpenZeppelin audited contracts (ERC-721, Ownable, ReentrancyGuard)
- ✅ Access control on all critical functions
- ✅ Reentrancy protection on payments

---

## 🐛 Troubleshooting

### "Nonce too high" in MetaMask
**Solution:** Settings → Advanced → Reset Account

### Backend can't connect to MongoDB
**Solution:** Start MongoDB or use Atlas:
```bash
sudo systemctl start mongodb
```

### MetaMask shows wrong network
**Solution:** Switch to "Hardhat Local" (Chain ID: 31337)

### Addresses not updating
**Solution:** Re-run `npm run deploy` in blockchain folder

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for more troubleshooting.

---

## 📊 Smart Contract Addresses

After deployment, addresses are automatically updated in:
- `blockchain/.env`
- `backend/.env`
- `frontend/.env`
- `frontend/src/lib/contracts.ts`

**Example (Hardhat Local):**
```
WiFiRegistry:      0x5FbDB2315678afecb367f032d93F642f64180aa3
AirlinkAccessNFT:  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
PaymentEscrow:     0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
AccessManager:     0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Run tests (`cd blockchain && npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing`)
6. Open Pull Request

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎓 Hackathon Project

Built for **[Hackathon Name]** — demonstrating Web3 integration with real-world WiFi sharing use case.

**Team:** [Your Team Name]

---

## 🚀 Quick Commands Reference

```bash
# Setup
./quick-start.sh                    # One-command setup

# Blockchain
cd blockchain
npm run node                        # Start Hardhat node
npm run deploy                      # Deploy to localhost
npm run deploy:sepolia              # Deploy to Sepolia  
npm test                            # Run 58 tests

# Backend
cd backend
npm run dev                         # Start API server

# Frontend
cd frontend
npm run dev                         # Start dev server
npm run build                       # Production build
```

---

**🎉 Ready to revolutionize WiFi sharing with Web3!**

For questions, check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) or open an issue.
