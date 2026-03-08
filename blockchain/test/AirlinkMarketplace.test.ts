import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

const { ethers } = hre;
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AirlinkMarketplace", function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let marketplace: any;
  let platform: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const PRICE_PER_HOUR = ethers.parseEther("0.01"); // 0.01 ETH/hr
  const DURATION = 3; // 3 hours

  beforeEach(async () => {
    [platform, owner, user, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AirlinkMarketplace");
    marketplace = await Factory.deploy();
    await marketplace.waitForDeployment();
  });

  // ─────────────────────────────────────────
  //  Spot Registration
  // ─────────────────────────────────────────
  describe("Spot Registration", () => {
    it("should register a new spot", async () => {
      const tx = await marketplace.connect(owner).registerSpot(
        "Coffee House WiFi",
        "geohash:u4pruydqqvj",
        "ipfs://QmMetadata123",
        PRICE_PER_HOUR,
        50, // 50 Mbps
        5,  // max 5 users
        1   // SpotTag.Cafe
      );

      await expect(tx).to.emit(marketplace, "SpotRegistered").withArgs(
        0, // first spot ID
        owner.address,
        "Coffee House WiFi",
        PRICE_PER_HOUR,
        1, // Cafe
        await getBlockTimestamp(tx)
      );

      const spot = await marketplace.getSpot(0);
      expect(spot.name).to.equal("Coffee House WiFi");
      expect(spot.owner).to.equal(owner.address);
      expect(spot.pricePerHourWei).to.equal(PRICE_PER_HOUR);
      expect(spot.maxUsers).to.equal(5);
      expect(spot.status).to.equal(0); // Active
      expect(spot.isVerified).to.equal(false);
    });

    it("should reject spot with empty name", async () => {
      await expect(
        marketplace.connect(owner).registerSpot("", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0)
      ).to.be.revertedWith("Invalid name length");
    });

    it("should reject spot with price below minimum", async () => {
      await expect(
        marketplace.connect(owner).registerSpot("Test", "loc", "uri", 100, 50, 5, 0)
      ).to.be.revertedWith("Price too low");
    });

    it("should reject spot with 0 max users", async () => {
      await expect(
        marketplace.connect(owner).registerSpot("Test", "loc", "uri", PRICE_PER_HOUR, 50, 0, 0)
      ).to.be.revertedWith("Invalid max users");
    });

    it("should track owner spots", async () => {
      await marketplace.connect(owner).registerSpot("Spot 1", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);
      await marketplace.connect(owner).registerSpot("Spot 2", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);

      const spots = await marketplace.getOwnerSpots(owner.address);
      expect(spots.length).to.equal(2);
      expect(spots[0]).to.equal(0);
      expect(spots[1]).to.equal(1);
    });
  });

  // ─────────────────────────────────────────
  //  Spot Update & Verification
  // ─────────────────────────────────────────
  describe("Spot Update & Verification", () => {
    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);
    });

    it("should let owner update spot", async () => {
      const newPrice = ethers.parseEther("0.02");
      await expect(
        marketplace.connect(owner).updateSpot(0, newPrice, 1) // Inactive
      ).to.emit(marketplace, "SpotUpdated").withArgs(0, newPrice, 1);

      const spot = await marketplace.getSpot(0);
      expect(spot.pricePerHourWei).to.equal(newPrice);
      expect(spot.status).to.equal(1); // Inactive
    });

    it("should reject update from non-owner", async () => {
      await expect(
        marketplace.connect(user).updateSpot(0, PRICE_PER_HOUR, 0)
      ).to.be.revertedWith("Not spot owner");
    });

    it("should let platform verify spot", async () => {
      await expect(
        marketplace.connect(platform).verifySpot(0)
      ).to.emit(marketplace, "SpotVerified");

      const spot = await marketplace.getSpot(0);
      expect(spot.isVerified).to.equal(true);
    });

    it("should reject verification from non-platform", async () => {
      await expect(
        marketplace.connect(owner).verifySpot(0)
      ).to.be.revertedWith("Not platform owner");
    });
  });

  // ─────────────────────────────────────────
  //  Booking & Payment
  // ─────────────────────────────────────────
  describe("Booking & Payment", () => {
    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);
    });

    it("should calculate booking cost correctly", async () => {
      const [total, ownerShare, fee] = await marketplace.calculateBookingCost(0, DURATION);
      const expectedTotal = PRICE_PER_HOUR * BigInt(DURATION);
      const expectedFee = (expectedTotal * 200n) / 10000n;

      expect(total).to.equal(expectedTotal);
      expect(fee).to.equal(expectedFee);
      expect(ownerShare).to.equal(expectedTotal - expectedFee);
    });

    it("should create a booking with correct payment", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);

      const tx = await marketplace.connect(user).bookAccess(0, DURATION, 0, {
        value: totalCost,
      });

      await expect(tx).to.emit(marketplace, "BookingCreated");

      const booking = await marketplace.getBooking(0);
      expect(booking.user).to.equal(user.address);
      expect(booking.spotOwner).to.equal(owner.address);
      expect(booking.totalPaid).to.equal(totalCost);
      expect(booking.status).to.equal(0); // Pending
    });

    it("should reject booking with incorrect payment", async () => {
      await expect(
        marketplace.connect(user).bookAccess(0, DURATION, 0, {
          value: ethers.parseEther("0.001"), // too little
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("should reject owner booking own spot", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await expect(
        marketplace.connect(owner).bookAccess(0, DURATION, 0, { value: totalCost })
      ).to.be.revertedWith("Cannot book own spot");
    });

    it("should reject booking when at capacity", async () => {
      // Register spot with maxUsers = 1
      await marketplace.connect(owner).registerSpot("Small Spot", "loc", "uri", PRICE_PER_HOUR, 50, 1, 0);
      const spotId = 1;

      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await marketplace.connect(user).bookAccess(spotId, DURATION, 0, { value: totalCost });

      await expect(
        marketplace.connect(other).bookAccess(spotId, DURATION, 0, { value: totalCost })
      ).to.be.revertedWith("Spot at capacity");
    });

    it("should track user bookings", async () => {
      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await marketplace.connect(user).bookAccess(0, DURATION, 0, { value: totalCost });

      const bookings = await marketplace.getUserBookings(user.address);
      expect(bookings.length).to.equal(1);
      expect(bookings[0]).to.equal(0);
    });
  });

  // ─────────────────────────────────────────
  //  Access Token & Verification
  // ─────────────────────────────────────────
  describe("Access Verification", () => {
    const accessToken = "a4f8c2e1b9d73f06";
    let tokenHash: string;
    let totalCost: bigint;

    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);

      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await marketplace.connect(user).bookAccess(0, DURATION, 0, { value: totalCost });

      tokenHash = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
    });

    it("should activate booking with token hash", async () => {
      await expect(
        marketplace.connect(user).activateBooking(0, tokenHash)
      ).to.emit(marketplace, "BookingActivated").withArgs(0, tokenHash, await getNextTimestamp());

      const booking = await marketplace.getBooking(0);
      expect(booking.status).to.equal(1); // Active
      expect(booking.accessTokenHash).to.equal(tokenHash);
    });

    it("should verify valid access token", async () => {
      await marketplace.connect(user).activateBooking(0, tokenHash);

      const isValid = await marketplace.verifyAccess(0, accessToken);
      expect(isValid).to.equal(true);
    });

    it("should reject invalid access token", async () => {
      await marketplace.connect(user).activateBooking(0, tokenHash);

      const isValid = await marketplace.verifyAccess(0, "wrong_token");
      expect(isValid).to.equal(false);
    });

    it("should reject activation from unauthorized address", async () => {
      await expect(
        marketplace.connect(other).activateBooking(0, tokenHash)
      ).to.be.revertedWith("Not authorized");
    });
  });

  // ─────────────────────────────────────────
  //  Booking Completion & Earnings
  // ─────────────────────────────────────────
  describe("Completion & Earnings", () => {
    let totalCost: bigint;
    const accessToken = "testtoken123";

    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);

      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await marketplace.connect(user).bookAccess(0, DURATION, 0, { value: totalCost });

      const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(accessToken));
      await marketplace.connect(user).activateBooking(0, tokenHash);
    });

    it("should complete booking and credit earnings", async () => {
      await expect(
        marketplace.connect(user).completeBooking(0)
      ).to.emit(marketplace, "BookingCompleted");

      const booking = await marketplace.getBooking(0);
      expect(booking.status).to.equal(2); // Completed

      const [totalEarnings, withdrawable] = await marketplace.getOwnerEarnings(owner.address);
      expect(withdrawable).to.equal(booking.ownerEarnings);
      expect(totalEarnings).to.equal(booking.ownerEarnings);
    });

    it("should allow owner to withdraw earnings", async () => {
      await marketplace.connect(user).completeBooking(0);

      const [, withdrawable] = await marketplace.getOwnerEarnings(owner.address);
      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await marketplace.connect(owner).withdrawEarnings();
      const receipt = await tx.wait();
      const gasCost = receipt!.fee as bigint;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + withdrawable - gasCost);
    });

    it("should allow platform to withdraw fees", async () => {
      await marketplace.connect(user).completeBooking(0);

      const platformBal = await marketplace.platformBalance();
      expect(platformBal).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(platform.address);

      const tx = await marketplace.connect(platform).withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasCost = receipt!.fee as bigint;

      const balanceAfter = await ethers.provider.getBalance(platform.address);
      expect(balanceAfter).to.equal(balanceBefore + platformBal - gasCost);
    });
  });

  // ─────────────────────────────────────────
  //  Cancellation
  // ─────────────────────────────────────────
  describe("Cancellation", () => {
    let totalCost: bigint;

    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);
      totalCost = PRICE_PER_HOUR * BigInt(DURATION);
    });

    it("should give full refund when cancelled before start", async () => {
      // Book with future start time
      const futureStart = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;
      await marketplace.connect(user).bookAccess(0, DURATION, futureStart, { value: totalCost });

      const balanceBefore = await ethers.provider.getBalance(user.address);

      const tx = await marketplace.connect(user).cancelBooking(0);
      const receipt = await tx.wait();
      const gasCost = receipt!.fee as bigint;

      const balanceAfter = await ethers.provider.getBalance(user.address);
      expect(balanceAfter).to.equal(balanceBefore + totalCost - gasCost);

      await expect(tx).to.emit(marketplace, "BookingCancelled").withArgs(0, user.address, totalCost);
    });

    it("should give 50% refund when cancelled mid-session", async () => {
      await marketplace.connect(user).bookAccess(0, DURATION, 0, { value: totalCost });

      const tokenHash = ethers.keccak256(ethers.toUtf8Bytes("token"));
      await marketplace.connect(user).activateBooking(0, tokenHash);

      const tx = await marketplace.connect(user).cancelBooking(0);
      await expect(tx).to.emit(marketplace, "BookingCancelled");

      const booking = await marketplace.getBooking(0);
      expect(booking.status).to.equal(3); // Cancelled
    });
  });

  // ─────────────────────────────────────────
  //  Dispute
  // ─────────────────────────────────────────
  describe("Dispute Resolution", () => {
    beforeEach(async () => {
      await marketplace.connect(owner).registerSpot("Test Spot", "loc", "uri", PRICE_PER_HOUR, 50, 5, 0);

      const totalCost = PRICE_PER_HOUR * BigInt(DURATION);
      await marketplace.connect(user).bookAccess(0, DURATION, 0, { value: totalCost });

      const tokenHash = ethers.keccak256(ethers.toUtf8Bytes("token"));
      await marketplace.connect(user).activateBooking(0, tokenHash);
    });

    it("should allow user to dispute active booking", async () => {
      await expect(
        marketplace.connect(user).disputeBooking(0)
      ).to.emit(marketplace, "BookingDisputed");

      const booking = await marketplace.getBooking(0);
      expect(booking.status).to.equal(4); // Disputed
    });

    it("should allow platform to resolve dispute with full refund", async () => {
      await marketplace.connect(user).disputeBooking(0);

      const balanceBefore = await ethers.provider.getBalance(user.address);

      await marketplace.connect(platform).resolveDispute(0, 100); // 100% refund

      const balanceAfter = await ethers.provider.getBalance(user.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("should reject dispute from non-user", async () => {
      await expect(
        marketplace.connect(owner).disputeBooking(0)
      ).to.be.revertedWith("Only user can dispute");
    });

    it("should reject resolution from non-platform", async () => {
      await marketplace.connect(user).disputeBooking(0);

      await expect(
        marketplace.connect(owner).resolveDispute(0, 50)
      ).to.be.revertedWith("Not platform owner");
    });
  });

  // ─────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────
  async function getBlockTimestamp(tx: any): Promise<number> {
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    return block!.timestamp;
  }

  async function getNextTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp + 1;
  }
});
