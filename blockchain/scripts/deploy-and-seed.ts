/**
 * deploy-and-seed.ts — Deploy all contracts + seed demo spots in one shot.
 *
 * Use this instead of running deploy-with-env.ts and seedSpots.ts separately.
 * Safe to re-run: if the Hardhat node was restarted, addresses will be updated.
 *
 *   npx hardhat run scripts/deploy-and-seed.ts --network localhost
 */
import hre from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = hre;

const SpotTag = { Home: 0, Cafe: 1, Office: 2, Library: 3, CoWorking: 4 } as const;

const DEMO_SPOTS = [
  {
    name: "Yash's Home Fibre",
    locationHash: "tfe3u3p",
    metadataURI: "ipfs://QmDemo1",
    pricePerHourWei: ethers.parseEther("0.001"),
    speedMbps: 200,
    maxUsers: 3,
    tag: SpotTag.Home,
  },
  {
    name: "Samiksha's Cafe Corner",
    locationHash: "tfe3u5r",
    metadataURI: "ipfs://QmDemo2",
    pricePerHourWei: ethers.parseEther("0.002"),
    speedMbps: 100,
    maxUsers: 8,
    tag: SpotTag.Cafe,
  },
  {
    name: "Vaidehi Cowork Space",
    locationHash: "tfe3qze",
    metadataURI: "ipfs://QmDemo3",
    pricePerHourWei: ethers.parseEther("0.003"),
    speedMbps: 300,
    maxUsers: 20,
    tag: SpotTag.CoWorking,
  },
  {
    name: "Spandan Office Hub",
    locationHash: "tfe3u1k",
    metadataURI: "ipfs://QmDemo4",
    pricePerHourWei: ethers.parseEther("0.002"),
    speedMbps: 150,
    maxUsers: 10,
    tag: SpotTag.Office,
  },
  {
    name: "Rohit's Library WiFi",
    locationHash: "tfe3u2m",
    metadataURI: "ipfs://QmDemo5",
    pricePerHourWei: ethers.parseEther("0.001"),
    speedMbps: 50,
    maxUsers: 15,
    tag: SpotTag.Library,
  },
];

async function updateEnvFile(filePath: string, entries: Record<string, string>) {
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  } else {
    const example = filePath + ".example";
    if (fs.existsSync(example)) content = fs.readFileSync(example, "utf8");
  }
  for (const [key, value] of Object.entries(entries)) {
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  ✓ Updated ${path.basename(filePath)}`);
}

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  🚀 Airlink — Deploy + Seed (single command)");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  Network:    ${network}`);
  console.log(`  Deployer:   ${deployer.address}`);
  console.log(`  Balance:    ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("════════════════════════════════════════════════════════\n");

  // ── 1. Deploy ──────────────────────────────────────────────────────
  console.log("📦 [1/4] Deploying WiFiRegistry...");
  const WiFiRegistry = await ethers.getContractFactory("WiFiRegistry");
  const registry = await WiFiRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`     ✓ ${registryAddr}\n`);

  console.log("📦 [2/4] Deploying AirlinkAccessNFT...");
  const AirlinkAccessNFT = await ethers.getContractFactory("AirlinkAccessNFT");
  const accessNFT = await AirlinkAccessNFT.deploy();
  await accessNFT.waitForDeployment();
  const nftAddr = await accessNFT.getAddress();
  console.log(`     ✓ ${nftAddr}\n`);

  console.log("📦 [3/4] Deploying PaymentEscrow...");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log(`     ✓ ${escrowAddr}\n`);

  console.log("📦 [4/4] Deploying AccessManager...");
  const AccessManager = await ethers.getContractFactory("AccessManager");
  const manager = await AccessManager.deploy(registryAddr, nftAddr, escrowAddr);
  await manager.waitForDeployment();
  const managerAddr = await manager.getAddress();
  console.log(`     ✓ ${managerAddr}\n`);

  // ── 2. Link ────────────────────────────────────────────────────────
  console.log("🔗 Linking contracts...");
  await (await registry.setAccessManager(managerAddr)).wait();
  console.log("  ✓ WiFiRegistry → AccessManager");
  await (await accessNFT.setAccessManager(managerAddr)).wait();
  console.log("  ✓ AirlinkAccessNFT → AccessManager");
  await (await escrow.setAccessManager(managerAddr)).wait();
  console.log("  ✓ PaymentEscrow → AccessManager\n");

  // ── 3. Update .env files ───────────────────────────────────────────
  console.log("📝 Updating .env files...");
  const blockchainAddresses = {
    WIFI_REGISTRY_ADDRESS: registryAddr,
    ACCESS_NFT_ADDRESS: nftAddr,
    PAYMENT_ESCROW_ADDRESS: escrowAddr,
    ACCESS_MANAGER_ADDRESS: managerAddr,
  };
  await updateEnvFile(path.join(__dirname, "../.env"), blockchainAddresses);
  await updateEnvFile(path.join(__dirname, "../../backend/.env"), blockchainAddresses);
  await updateEnvFile(path.join(__dirname, "../../frontend/.env"), {
    VITE_WIFI_REGISTRY_ADDRESS: registryAddr,
    VITE_ACCESS_NFT_ADDRESS: nftAddr,
    VITE_PAYMENT_ESCROW_ADDRESS: escrowAddr,
    VITE_ACCESS_MANAGER_ADDRESS: managerAddr,
  });

  // Also patch frontend/src/lib/contracts.ts so it works without vite restart
  const contractsPath = path.join(__dirname, "../../frontend/src/lib/contracts.ts");
  if (fs.existsSync(contractsPath)) {
    let content = fs.readFileSync(contractsPath, "utf8");
    content = content.replace(
      /export const CONTRACT_ADDRESSES = \{[\s\S]*?\};/,
      `export const CONTRACT_ADDRESSES = {\n  registry:      import.meta.env.VITE_WIFI_REGISTRY_ADDRESS      ?? "${registryAddr}",\n  accessNFT:     import.meta.env.VITE_ACCESS_NFT_ADDRESS         ?? "${nftAddr}",\n  escrow:        import.meta.env.VITE_PAYMENT_ESCROW_ADDRESS     ?? "${escrowAddr}",\n  accessManager: import.meta.env.VITE_ACCESS_MANAGER_ADDRESS     ?? "${managerAddr}",\n};`
    );
    fs.writeFileSync(contractsPath, content, "utf8");
    console.log("  ✓ Updated frontend/src/lib/contracts.ts\n");
  }

  // ── 4. Seed spots ──────────────────────────────────────────────────
  console.log("🌱 Seeding demo spots...");
  for (let i = 0; i < DEMO_SPOTS.length; i++) {
    const spot = DEMO_SPOTS[i];
    const owner = signers[i + 1] ?? signers[1];
    const registryAsOwner = registry.connect(owner) as typeof registry;
    const tx = await registryAsOwner.registerSpot(
      spot.name,
      spot.locationHash,
      spot.metadataURI,
      spot.pricePerHourWei,
      spot.speedMbps,
      spot.maxUsers,
      spot.tag
    );
    await tx.wait();
    console.log(`  ✓ [ID: ${i}] "${spot.name}" — ${ethers.formatEther(spot.pricePerHourWei)} ETH/hr`);
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  ✅ All done! Contracts deployed & spots seeded.");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  WiFiRegistry:     ${registryAddr}`);
  console.log(`  AirlinkAccessNFT: ${nftAddr}`);
  console.log(`  PaymentEscrow:    ${escrowAddr}`);
  console.log(`  AccessManager:    ${managerAddr}`);
  console.log("────────────────────────────────────────────────────────");

  // ── 5. Sync blockchainSpotId into MongoDB ─────────────────────────
  const seededIds: Array<{ name: string; chainId: number }> = DEMO_SPOTS.map((s, i) => ({
    name: s.name,
    chainId: i,
  }));

  await syncMongoDBBlockchainIds(
    path.join(__dirname, "../../backend/.env"),
    path.join(__dirname, "../../backend/node_modules/mongoose"),
    seededIds
  );

  console.log("────────────────────────────────────────────────────────");
  console.log("  ⚠️  Restart your backend & frontend dev servers so");
  console.log("     the new .env addresses are picked up.");
  console.log("════════════════════════════════════════════════════════\n");
}

/**
 * Read MONGO_URI from backend/.env and update blockchainSpotId on each
 * named demo spot.  Borrows mongoose from the backend's node_modules so
 * the blockchain package doesn't need an extra dependency.
 */
async function syncMongoDBBlockchainIds(
  backendEnvPath: string,
  mongoosePath: string,
  spots: Array<{ name: string; chainId: number }>
) {
  console.log("\n📦 Syncing blockchainSpotId → MongoDB...");

  // Read MONGO_URI from backend .env
  let mongoUri = "";
  try {
    const envContent = fs.readFileSync(backendEnvPath, "utf8");
    const match = envContent.match(/^MONGO_URI=(.+)$/m);
    if (match) mongoUri = match[1].trim();
  } catch {
    console.log("  ⚠️  Could not read backend/.env — skipping MongoDB sync.");
    console.log("     Run 'npm run seed' in backend/ to apply IDs manually.\n");
    return;
  }

  if (!mongoUri) {
    console.log("  ⚠️  MONGO_URI not found in backend/.env — skipping sync.");
    return;
  }

  // Borrow mongoose from backend/node_modules
  let mongoose: any;
  try {
    mongoose = require(mongoosePath);
  } catch {
    console.log("  ⚠️  mongoose not found in backend/node_modules — skipping sync.");
    console.log("     Run 'npm install' in backend/ first.\n");
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });

    const db = mongoose.connection.db;
    let updated = 0;
    let skipped = 0;

    for (const { name, chainId } of spots) {
      // Match by name (case-insensitive) and only update if currently -1
      const result = await db.collection("wifispots").updateMany(
        { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { $set: { blockchainSpotId: chainId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`  ✓ "${name}" → blockchainSpotId = ${chainId}`);
        updated += result.modifiedCount;
      } else {
        skipped++;
      }
    }

    if (updated > 0) {
      console.log(`\n  ✅ Updated ${updated} spot(s) in MongoDB.`);
    } else if (skipped === spots.length) {
      console.log("  ℹ️  All demo spots already have blockchain IDs set in MongoDB.");
      console.log("     (Run 'npm run seed' in backend/ to re-seed demo data.)");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ⚠️  MongoDB sync failed: ${msg}`);
    console.log("     Set blockchainSpotId manually via the Owner Dashboard → \"Set ID\" button.");
  } finally {
    try { await mongoose.disconnect(); } catch { /* ignore */ }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
