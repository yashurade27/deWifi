import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Airlink v2 contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ─── 1. Deploy WiFiRegistry ─────────────────────────────────────────
  console.log("1/4  Deploying WiFiRegistry...");
  const WiFiRegistry = await ethers.getContractFactory("WiFiRegistry");
  const registry = await WiFiRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("     WiFiRegistry deployed to:", registryAddr);

  // ─── 2. Deploy AirlinkAccessNFT ─────────────────────────────────────
  console.log("2/4  Deploying AirlinkAccessNFT...");
  const AirlinkAccessNFT = await ethers.getContractFactory("AirlinkAccessNFT");
  const accessNFT = await AirlinkAccessNFT.deploy();
  await accessNFT.waitForDeployment();
  const nftAddr = await accessNFT.getAddress();
  console.log("     AirlinkAccessNFT deployed to:", nftAddr);

  // ─── 3. Deploy PaymentEscrow ────────────────────────────────────────
  console.log("3/4  Deploying PaymentEscrow...");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("     PaymentEscrow deployed to:", escrowAddr);

  // ─── 4. Deploy AccessManager (orchestrator) ─────────────────────────
  console.log("4/4  Deploying AccessManager...");
  const AccessManager = await ethers.getContractFactory("AccessManager");
  const manager = await AccessManager.deploy(registryAddr, nftAddr, escrowAddr);
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log("     AccessManager deployed to:", managerAddr);

  // ─── 5. Link contracts — authorize AccessManager ────────────────────
  console.log("\nLinking contracts...");
  await (await registry.setAccessManager(managerAddr)).wait();
  console.log("  ✓ WiFiRegistry → AccessManager linked");
  await (await accessNFT.setAccessManager(managerAddr)).wait();
  console.log("  ✓ AirlinkAccessNFT → AccessManager linked");
  await (await escrow.setAccessManager(managerAddr)).wait();
  console.log("  ✓ PaymentEscrow → AccessManager linked");

  // ─── Summary ────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  Airlink v2 — Deployment Complete");
  console.log("════════════════════════════════════════════════════════");
  console.log("  WiFiRegistry:      ", registryAddr);
  console.log("  AirlinkAccessNFT:  ", nftAddr);
  console.log("  PaymentEscrow:     ", escrowAddr);
  console.log("  AccessManager:     ", managerAddr);
  console.log("  Platform owner:    ", deployer.address);
  console.log("════════════════════════════════════════════════════════\n");
  console.log("Next steps:");
  console.log("  1. Copy addresses to frontend/src/lib/contracts.ts");
  console.log("  2. Copy ABIs from blockchain/artifacts/contracts/");
  console.log(
    `  3. Verify on Etherscan:\n` +
      `     npx hardhat verify --network sepolia ${registryAddr}\n` +
      `     npx hardhat verify --network sepolia ${nftAddr}\n` +
      `     npx hardhat verify --network sepolia ${escrowAddr}\n` +
      `     npx hardhat verify --network sepolia ${managerAddr} ${registryAddr} ${nftAddr} ${escrowAddr}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
