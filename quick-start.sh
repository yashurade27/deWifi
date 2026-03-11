#!/bin/bash

# Airlink Web3 — Quick Start Script
# Automates the setup and deployment for local testing

set -e  # Exit on error

echo ""
echo "════════════════════════════════════════════════════════"
echo "  🚀 Airlink Web3 — Quick Start"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}[1/7]${NC} Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js v18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"
echo -e "${GREEN}✓ npm $(npm --version) found${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}[2/7]${NC} Installing dependencies..."

if [ ! -d "blockchain/node_modules" ]; then
    echo "  Installing blockchain dependencies..."
    cd blockchain && npm install --silent && cd ..
    echo -e "${GREEN}✓ Blockchain dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Blockchain dependencies already installed${NC}"
fi

if [ ! -d "backend/node_modules" ]; then
    echo "  Installing backend dependencies..."
    cd backend && npm install --silent && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "  Installing frontend dependencies..."
    cd frontend && npm install --silent && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
echo ""

# Step 3: Setup .env files
echo -e "${BLUE}[3/7]${NC} Setting up environment files..."

setup_env() {
    local dir=$1
    if [ ! -f "$dir/.env" ]; then
        if [ -f "$dir/.env.example" ]; then
            cp "$dir/.env.example" "$dir/.env"
            echo -e "${GREEN}✓ Created $dir/.env${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ $dir/.env already exists (skipping)${NC}"
    fi
}

setup_env "blockchain"
setup_env "backend"
setup_env "frontend"

# Update backend .env with defaults
if [ -f "backend/.env" ]; then
    if ! grep -q "MONGO_URI=mongodb://localhost:27017/airlink" backend/.env; then
        echo "MONGO_URI=mongodb://localhost:27017/airlink" >> backend/.env
    fi
    if ! grep -q "JWT_SECRET=" backend/.env; then
        echo "JWT_SECRET=dev_secret_key_change_in_production" >> backend/.env
    fi
fi

echo ""

# Step 4: Compile smart contracts
echo -e "${BLUE}[4/7]${NC} Compiling smart contracts..."
cd blockchain
npm run compile --silent
echo -e "${GREEN}✓ Contracts compiled successfully${NC}"
cd ..
echo ""

# Step 5: Check if Hardhat node is running
echo -e "${BLUE}[5/7]${NC} Checking Hardhat node..."

if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Hardhat node already running on port 8545${NC}"
else
    echo -e "${YELLOW}⚠ Hardhat node not running. Starting it now...${NC}"
    cd blockchain
    npx hardhat node > ../hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    echo -e "${GREEN}✓ Hardhat node started (PID: $HARDHAT_PID)${NC}"
    echo -e "${YELLOW}  Waiting 5 seconds for node to be ready...${NC}"
    sleep 5
    cd ..
fi
echo ""

# Step 6: Deploy contracts
echo -e "${BLUE}[6/7]${NC} Deploying smart contracts..."
cd blockchain
npm run deploy --silent
echo -e "${GREEN}✓ Contracts deployed and .env files updated${NC}"
cd ..
echo ""

# Step 7: Instructions
echo -e "${BLUE}[7/7]${NC} Setup complete! 🎉"
echo ""
echo "════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ Airlink Web3 Ready!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Start Backend (in a new terminal):"
echo -e "     ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "  2. Start Frontend (in another terminal):"
echo -e "     ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "  3. Setup MetaMask:"
echo "     • Add Hardhat Local network (RPC: http://127.0.0.1:8545, Chain ID: 31337)"
echo "     • Import test account:"
echo "       Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "  4. Open browser:"
echo -e "     ${BLUE}http://localhost:5173${NC}"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📚 Full guide: See INTEGRATION_GUIDE.md"
echo ""

# Show Hardhat node log location if we started it
if [ ! -z "$HARDHAT_PID" ]; then
    echo -e "${YELLOW}Note: Hardhat node running in background (PID: $HARDHAT_PID)${NC}"
    echo -e "${YELLOW}Logs: hardhat-node.log${NC}"
    echo -e "${YELLOW}To stop: kill $HARDHAT_PID${NC}"
    echo ""
fi
