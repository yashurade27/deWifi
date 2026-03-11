import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

const { ethers } = hre;
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Airlink v2 — Modular Contracts", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any, accessNFT: any, escrow: any, manager: any;
  let platform: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const PRICE_PER_HOUR = ethers.parseEther("0.01");
  const DURATION = 3;

  async function deployAndLink() {
    [platform, owner, user, other] = await ethers.getSigners();

    const WiFiRegistry = await ethers.getContractFactory("WiFiRegistry");
    registry = await WiFiRegistry.deploy();
    await registry.waitForDeployment();

    const AirlinkAccessNFT = await ethers.getContractFactory("AirlinkAccessNFT");
    accessNFT = await AirlinkAccessNFT.deploy();
    await accessNFT.waitForDeployment();

    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    escrow = await PaymentEscrow.deploy();
    await escrow.waitForDeployment();

    const AccessManager = await ethers.getContractFactory("AccessManager");
    manager = await AccessManager.deploy(
      await registry.getAddress(),
      await accessNFT.getAddress(),
      await escrow.getAddress()
    );
    await manager.waitForDeployment();

    // Link contracts
    const managerAddr = await manager.getAddress();
    await registry.setAccessManager(managerAddr);
    await accessNFT.setAccessManager(managerAddr);
    await escrow.setAccessManager(managerAddr);
  }

  async function registerTestSpot() {
    await registry.connect(owner).registerSpot(
      "Coffee House WiFi",
      "geohash:u4pruydqqvj",
      "ipfs://QmMetadata123",
      PRICE_PER_HOUR,
      50,
      5,
      1 // Cafe
    );
  }

  beforeEach(async () => {
    await deployAndLink();
  });

  // ─────────────────────────────────────────
  //  Deployment & Linking
  // ─────────────────────────────────────────
  describe("Deployment", () => {
    it("should deploy all contracts and link them", async () => {
      const managerAddr = await manager.getAddress();
      expect(await registry.accessManager()).to.equal(managerAddr);
      expect(await accessNFT.accessManager()).to.equal(managerAddr);
      expect(await escrow.accessManager()).to.equal(managerAddr);
    });

    it("should set platform owner correctly", async () => {
      expect(await registry.owner()).to.equal(platform.address);
      expect(await accessNFT.owner()).to.equal(platform.address);
      expect(await escrow.owner()).to.equal(platform.address);
      expect(await manager.owner()).to.equal(platform.address);
    });
  });

  // ─────────────────────────────────────────
  //  WiFiRegistry — Spot Management
  // ─────────────────────────────────────────
  describe("WiFiRegistry", () => {
    it("should register a spot", async () => {
      const tx = await registry.connect(owner).registerSpot(
        "Coffee House WiFi",
        "geohash:u4pruydqqvj",
        "ipfs://QmMetadata123",
        PRICE_PER_HOUR,
        50, 5, 1
      );
      await expect(tx).to.emit(registry, "SpotRegistered");

      const spot = await registry.getSpot(0);
      expect(spot.name).to.equal("Coffee House WiFi");
      expect(spot.owner).to.equal(owner.address);
      expect(spot.pricePerHourWei).to.equal(PRICE_PER_HOUR);
    });

    it("should reject invalid spots", async () => {
      await expect(
        registry.connect(owner).registerSpot("", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0)
      ).to.be.revertedWith("Invalid name length");

      await expect(
        registry.connect(owner).registerSpot("Test", "loc", "uri", 100, 50, 5, 0)
      ).to.be.revertedWith("Price too low");

      await expect(
        registry.connect(owner).registerSpot("Test", "loc", "uri", PRICE_PER_HOUR, 50, 0, 0)
      ).to.be.revertedWith("Invalid max users");
    });

    it("should allow owner to update spot", async () => {
      await registerTestSpot();
      const newPrice = ethers.parseEther("0.02");
      await expect(
        registry.connect(owner).updateSpot(0, newPrice, 1)
      ).to.emit(registry, "SpotUpdated");
    });

    it("should allow platform to verify spot", async () => {
      await registerTestSpot();
      await expect(registry.connect(platform).verifySpot(0))
        .to.emit(registry, "SpotVerified");

      const spot = await registry.getSpot(0);
      expect(spot.isVerified).to.equal(true);
    });
  });

  // ─────────────────────────────────────────
  //  Full Purchase Flow
  // ─────────────────────────────────────────
  describe("Purchase Access", () => {
    beforeEach(async () => {
      await registerTestSpot();
    });

    it("should purchase access and mint NFT", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);

      const tx = await manager.connect(user).purchaseAccess(0, DURATION, 0, {
        value: totalCost,
      });

      await expect(tx).to.emit(manager, "AccessPurchased");
      await expect(tx).to.emit(accessNFT, "AccessMinted");
      await expect(tx).to.emit(escrow, "Deposited");

      // User should own NFT #0
      expect(await accessNFT.ownerOf(0)).to.equal(user.address);

      // NFT should be valid
      expect(await accessNFT.isAccessValidFor(0, user.address)).to.equal(true);

      // Session should be active
      const session = await manager.getSession(0);
      expect(session.user).to.equal(user.address);
      expect(session.spotId).to.equal(0);
      expect(session.totalPaid).to.equal(totalCost);
      expect(session.status).to.equal(0); // Active

      // Escrow should hold the funds
      const deposit = await escrow.getDeposit(0);
      expect(deposit.totalDeposited).to.equal(totalCost);
      expect(deposit.payer).to.equal(user.address);
      expect(deposit.recipient).to.equal(owner.address);

      // Spot should show 1 user
      const spot = await registry.getSpot(0);
      expect(spot.currentUsers).to.equal(1);
    });

    it("should calculate cost correctly", async () => {
      const [total, ownerShare, fee] = await manager.calculateCost(0, DURATION);
      const expectedTotal = PRICE_PER_HOUR * BigInt(DURATION);
      const expectedFee = (expectedTotal * 200n) / 10000n;
      expect(total).to.equal(expectedTotal);
      expect(fee).to.equal(expectedFee);
      expect(ownerShare).to.equal(expectedTotal - expectedFee);
    });

    it("should reject incorrect payment", async () => {
      await expect(
        manager.connect(user).purchaseAccess(0, DURATION, 0, {
          value: ethers.parseEther("0.001"),
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("should reject owner buying own spot", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await expect(
        manager.connect(owner).purchaseAccess(0, DURATION, 0, { value: totalCost })
      ).to.be.revertedWith("Cannot buy own spot");
    });

    it("should reject when spot at capacity", async () => {
      // Register spot with max 1 user
      await registry.connect(owner).registerSpot("Small", "loc", "uri", PRICE_PER_HOUR, 50, 1, 0);
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);

      await manager.connect(user).purchaseAccess(1, DURATION, 0, { value: totalCost });

      await expect(
        manager.connect(other).purchaseAccess(1, DURATION, 0, { value: totalCost })
      ).to.be.revertedWith("Spot at capacity");
    });

    it("should track user sessions", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });

      const sessions = await manager.getUserSessions(user.address);
      expect(sessions.length).to.equal(1);
      expect(sessions[0]).to.equal(0);
    });
  });

  // ─────────────────────────────────────────
  //  Gateway Verification
  // ─────────────────────────────────────────
  describe("Gateway Verification", () => {
    beforeEach(async () => {
      await registerTestSpot();
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });
    });

    it("should verify valid access", async () => {
      const [valid, spotId, expiresAt] = await manager.verifyAccess(0, user.address);
      expect(valid).to.equal(true);
      expect(spotId).to.equal(0);
      expect(expiresAt).to.be.gt(0);
    });

    it("should verify access for specific spot", async () => {
      const [valid] = await manager.verifyAccessForSpot(0, user.address, 0);
      expect(valid).to.equal(true);
    });

    it("should reject access for wrong spot", async () => {
      const [valid] = await manager.verifyAccessForSpot(0, user.address, 99);
      expect(valid).to.equal(false);
    });

    it("should reject access for wrong user", async () => {
      const [valid] = await manager.verifyAccess(0, other.address);
      expect(valid).to.equal(false);
    });

    it("should return valid NFT metadata", async () => {
      const uri = await accessNFT.tokenURI(0);
      expect(uri).to.include("data:application/json;base64,");

      // Decode and check
      const json = Buffer.from(uri.split(",")[1], "base64").toString();
      const metadata = JSON.parse(json);
      expect(metadata.name).to.include("Airlink WiFi Pass #0");
      expect(metadata.attributes).to.be.an("array");
    });
  });

  // ─────────────────────────────────────────
  //  Session Completion
  // ─────────────────────────────────────────
  describe("Session Completion", () => {
    let totalCost: bigint;

    beforeEach(async () => {
      await registerTestSpot();
      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });
    });

    it("should complete session and pay owner", async () => {
      const ownerBalBefore = await ethers.provider.getBalance(owner.address);

      await expect(
        manager.connect(user).completeSession(0)
      ).to.emit(manager, "SessionCompleted");

      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      const expectedFee = (totalCost * 200n) / 10000n;
      const expectedOwnerShare = totalCost - expectedFee;

      expect(ownerBalAfter - ownerBalBefore).to.equal(expectedOwnerShare);

      // Session should be completed
      const session = await manager.getSession(0);
      expect(session.status).to.equal(1); // Completed

      // NFT should be revoked
      expect(await accessNFT.isAccessValid(0)).to.equal(false);

      // Spot user count should decrease
      const spot = await registry.getSpot(0);
      expect(spot.currentUsers).to.equal(0);
    });

    it("should allow platform to withdraw accumulated fees", async () => {
      await manager.connect(user).completeSession(0);

      const platformBal = await escrow.platformBalance();
      expect(platformBal).to.be.gt(0);

      const balBefore = await ethers.provider.getBalance(platform.address);
      const tx = await escrow.connect(platform).withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasCost = receipt!.fee as bigint;

      const balAfter = await ethers.provider.getBalance(platform.address);
      expect(balAfter).to.equal(balBefore + platformBal - gasCost);
    });
  });

  // ─────────────────────────────────────────
  //  Cancellation
  // ─────────────────────────────────────────
  describe("Cancellation", () => {
    let totalCost: bigint;

    beforeEach(async () => {
      await registerTestSpot();
      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
    });

    it("should give full refund when cancelled before start", async () => {
      const futureStart = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;
      await manager.connect(user).purchaseAccess(0, DURATION, futureStart, { value: totalCost });

      const balBefore = await ethers.provider.getBalance(user.address);
      const tx = await manager.connect(user).cancelSession(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.fee as bigint;

      const balAfter = await ethers.provider.getBalance(user.address);
      expect(balAfter).to.equal(balBefore + totalCost - gasCost);
    });

    it("should give proportional refund when cancelled mid-session", async () => {
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });

      // Cancel immediately — almost 100% remaining
      const tx = await manager.connect(user).cancelSession(0);
      await expect(tx).to.emit(manager, "SessionCancelled");

      // Session should be cancelled
      const session = await manager.getSession(0);
      expect(session.status).to.equal(2); // Cancelled

      // NFT should be revoked
      expect(await accessNFT.isAccessValid(0)).to.equal(false);
    });

    it("should reject cancellation from unauthorized address", async () => {
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });

      await expect(
        manager.connect(other).cancelSession(0)
      ).to.be.revertedWith("Not authorized");
    });
  });

  // ─────────────────────────────────────────
  //  Dispute Resolution
  // ─────────────────────────────────────────
  describe("Disputes", () => {
    let totalCost: bigint;

    beforeEach(async () => {
      await registerTestSpot();
      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await manager.connect(user).purchaseAccess(0, DURATION, 0, { value: totalCost });
    });

    it("should allow user to dispute", async () => {
      await expect(
        manager.connect(user).disputeSession(0)
      ).to.emit(manager, "SessionDisputed");

      const session = await manager.getSession(0);
      expect(session.status).to.equal(3); // Disputed
    });

    it("should allow platform to resolve dispute with refund", async () => {
      await manager.connect(user).disputeSession(0);

      const balBefore = await ethers.provider.getBalance(user.address);

      await expect(
        manager.connect(platform).resolveDispute(0, 75)
      ).to.emit(manager, "DisputeResolved");

      const balAfter = await ethers.provider.getBalance(user.address);
      const expectedRefund = (totalCost * 75n) / 100n;
      expect(balAfter - balBefore).to.equal(expectedRefund);
    });

    it("should reject dispute from non-user", async () => {
      await expect(
        manager.connect(owner).disputeSession(0)
      ).to.be.revertedWith("Only session user can dispute");
    });

    it("should reject resolution from non-platform", async () => {
      await manager.connect(user).disputeSession(0);
      await expect(
        manager.connect(owner).resolveDispute(0, 50)
      ).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────
  //  Access Control
  // ─────────────────────────────────────────
  describe("Access Control", () => {
    it("should prevent direct minting on NFT contract", async () => {
      await expect(
        accessNFT.connect(user).mintAccess(user.address, 0, 0, 9999999999, 1)
      ).to.be.revertedWith("Only access manager");
    });

    it("should prevent direct deposit on escrow", async () => {
      await expect(
        escrow.connect(user).deposit(0, user.address, owner.address, 0, {
          value: ethers.parseEther("0.01"),
        })
      ).to.be.revertedWith("Only access manager");
    });

    it("should prevent direct release on escrow", async () => {
      await expect(
        escrow.connect(user).release(0)
      ).to.be.revertedWith("Only access manager");
    });

    it("should prevent unauthorized setAccessManager", async () => {
      await expect(
        registry.connect(user).setAccessManager(user.address)
      ).to.be.reverted;
    });
  });
});
