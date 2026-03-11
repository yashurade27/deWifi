import hre from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = hre;

async function updateEnvFile(
  filePath: string,
  addresses: Record<string, string>
) {
  try {
    let content = "";
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    } else {
      const examplePath = filePath + ".example";
      if (fs.existsSync(examplePath)) {
        content = fs.readFileSync(examplePath, "utf8");
      }
    }

    // Update each address
    for (const [key, address] of Object.entries(addresses)) {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${address}`);
      } else {
        content += `\n${key}=${address}`;
      }
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  ✓ Updated ${filePath}`);
  } catch (error) {
    console.error(`  ✗ Failed to update ${filePath}:`, error);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  🚀 Airlink v2 — Blockchain Deployment");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  Network:        ${network}`);
  console.log(`  Deployer:       ${deployer.address}`);
  console.log(
    `  Balance:        ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );
  console.log("════════════════════════════════════════════════════════\n");

  // ─── 1. Deploy WiFiRegistry ─────────────────────────────────────────
  console.log("📦 [1/4] Deploying WiFiRegistry...");
  const WiFiRegistry = await ethers.getContractFactory("WiFiRegistry");
  const registry = await WiFiRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`     ✓ WiFiRegistry deployed to: ${registryAddr}\n`);

  // ─── 2. Deploy AirlinkAccessNFT ─────────────────────────────────────
  console.log("📦 [2/4] Deploying AirlinkAccessNFT...");
  const AirlinkAccessNFT = await ethers.getContractFactory("AirlinkAccessNFT");
  const accessNFT = await AirlinkAccessNFT.deploy();
  await accessNFT.waitForDeployment();
  const nftAddr = await accessNFT.getAddress();
  console.log(`     ✓ AirlinkAccessNFT deployed to: ${nftAddr}\n`);

  // ─── 3. Deploy PaymentEscrow ────────────────────────────────────────
  console.log("📦 [3/4] Deploying PaymentEscrow...");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log(`     ✓ PaymentEscrow deployed to: ${escrowAddr}\n`);

  // ─── 4. Deploy AccessManager (orchestrator) ─────────────────────────
  console.log("📦 [4/4] Deploying AccessManager...");
  const AccessManager = await ethers.getContractFactory("AccessManager");
  const manager = await AccessManager.deploy(registryAddr, nftAddr, escrowAddr);
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log(`     ✓ AccessManager deployed to: ${managerAddr}\n`);

  // ─── 5. Link contracts — authorize AccessManager ────────────────────
  console.log("🔗 Linking contracts...");
  await (await registry.setAccessManager(managerAddr)).wait();
  console.log("  ✓ WiFiRegistry → AccessManager linked");
  await (await accessNFT.setAccessManager(managerAddr)).wait();
  console.log("  ✓ AirlinkAccessNFT → AccessManager linked");
  await (await escrow.setAccessManager(managerAddr)).wait();
  console.log("  ✓ PaymentEscrow → AccessManager linked\n");

  // ─── 6. Update .env files ───────────────────────────────────────────
  console.log("📝 Updating .env files with deployed addresses...");

  const addresses = {
    WIFI_REGISTRY_ADDRESS: registryAddr,
    ACCESS_NFT_ADDRESS: nftAddr,
    PAYMENT_ESCROW_ADDRESS: escrowAddr,
    ACCESS_MANAGER_ADDRESS: managerAddr,
  };

  const frontendAddresses = {
    VITE_WIFI_REGISTRY_ADDRESS: registryAddr,
    VITE_ACCESS_NFT_ADDRESS: nftAddr,
    VITE_PAYMENT_ESCROW_ADDRESS: escrowAddr,
    VITE_ACCESS_MANAGER_ADDRESS: managerAddr,
  };

  // Update blockchain/.env
  await updateEnvFile(path.join(__dirname, "../.env"), addresses);

  // Update backend/.env
  await updateEnvFile(path.join(__dirname, "../../backend/.env"), addresses);

  // Update frontend/.env
  await updateEnvFile(
    path.join(__dirname, "../../frontend/.env"),
    frontendAddresses
  );

  // Also update frontend/src/lib/contracts.ts
  console.log("\n📝 Updating frontend/src/lib/contracts.ts...");
  const contractsPath = path.join(
    __dirname,
    "../../frontend/src/lib/contracts.ts"
  );
  if (fs.existsSync(contractsPath)) {
    let content = fs.readFileSync(contractsPath, "utf8");

    // Update CONTRACT_ADDRESSES object
    const addressBlock = `export const CONTRACT_ADDRESSES = {
  registry: "${registryAddr}",
  accessNFT: "${nftAddr}",
  escrow: "${escrowAddr}",
  accessManager: "${managerAddr}",
} as const;`;

    content = content.replace(
      /export const CONTRACT_ADDRESSES = \{[^}]*\} as const;/s,
      addressBlock
    );

    fs.writeFileSync(contractsPath, content, "utf8");
    console.log("  ✓ Updated frontend/src/lib/contracts.ts");
  }

  // ─── Summary ────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════");
  console.log("  ✅ Deployment Complete!");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  WiFiRegistry:      ${registryAddr}`);
  console.log(`  AirlinkAccessNFT:  ${nftAddr}`);
  console.log(`  PaymentEscrow:     ${escrowAddr}`);
  console.log(`  AccessManager:     ${managerAddr}`);
  console.log(`  Platform owner:    ${deployer.address}`);
  console.log(`  Network:           ${network}`);
  console.log("════════════════════════════════════════════════════════\n");

  if (network === "sepolia") {
    console.log("📋 Next steps for Sepolia:");
    console.log("  1. Verify contracts on Etherscan:");
    console.log(`     npx hardhat verify --network sepolia ${registryAddr}`);
    console.log(`     npx hardhat verify --network sepolia ${nftAddr}`);
    console.log(`     npx hardhat verify --network sepolia ${escrowAddr}`);
    console.log(
      `     npx hardhat verify --network sepolia ${managerAddr} ${registryAddr} ${nftAddr} ${escrowAddr}`
    );
    console.log("  2. Update frontend to use Sepolia network\n");
  } else {
    console.log("📋 Next steps for local testing:");
    console.log("  1. Start Hardhat node: npx hardhat node");
    console.log("  2. Deploy again to local node: npm run deploy:local");
    console.log("  3. Import deployer account to MetaMask");
    console.log("  4. Add localhost network to MetaMask (Chain ID: 31337)");
    console.log("  5. Start backend: cd ../backend && npm run dev");
    console.log("  6. Start frontend: cd ../frontend && npm run dev\n");
  }

  console.log("🎉 All set! Your contracts are deployed and configured.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
