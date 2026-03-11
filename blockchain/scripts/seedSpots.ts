/**
 * seedSpots.ts — Register demo WiFi spots in the on-chain WiFiRegistry.
 *
 * Run after deployment:
 *   npx hardhat run scripts/seedSpots.ts --network localhost
 */
import hre from "hardhat";

const { ethers } = hre;

// SpotTag enum order must match WiFiRegistry.sol: Home=0, Cafe=1, Office=2, Library=3, CoWorking=4
const SpotTag = { Home: 0, Cafe: 1, Office: 2, Library: 3, CoWorking: 4 } as const;

const DEMO_SPOTS = [
  {
    name: "Yash's Home Fibre",
    locationHash: "tfe3u3p", // Pune Koregaon Park geohash
    metadataURI: "ipfs://QmDemo1",
    pricePerHourWei: ethers.parseEther("0.001"), // ~0.001 ETH/hr
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

async function main() {
  const registryAddress = process.env.WIFI_REGISTRY_ADDRESS;
  if (!registryAddress || registryAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      "WIFI_REGISTRY_ADDRESS not set in blockchain/.env. Run the deploy script first."
    );
  }

  // accounts[0] = deployer / MetaMask user — must NOT own spots or "Cannot buy own spot" triggers.
  // Use accounts[1..5] as spot owners so account[0] can purchase freely.
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  🌱 Airlink — On-chain Spot Seeder");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  Network:      ${network}`);
  console.log(`  Deployer:     ${deployer.address}`);
  console.log(`  Registry:     ${registryAddress}`);
  console.log("════════════════════════════════════════════════════════\n");

  const WiFiRegistry = await ethers.getContractAt("WiFiRegistry", registryAddress);

  // Check nextSpotId to see how many spots already exist
  const startId = await WiFiRegistry.nextSpotId();
  console.log(`  Current nextSpotId: ${startId}`);

  if (Number(startId) >= DEMO_SPOTS.length) {
    console.log(`  ✅ ${startId} spots already registered. Nothing to do.\n`);
    return;
  }

  console.log(`  Registering ${DEMO_SPOTS.length - Number(startId)} spots...\n`);

  for (let i = Number(startId); i < DEMO_SPOTS.length; i++) {
    const spot = DEMO_SPOTS[i];
    // Use account[i+1] as the spot owner (accounts 1–5), fall back to account[1] if not enough signers
    const owner = signers[i + 1] ?? signers[1];
    const registryAsOwner = WiFiRegistry.connect(owner) as typeof WiFiRegistry;
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
    const nextId = await WiFiRegistry.nextSpotId();
    const registeredId = Number(nextId) - 1;
    console.log(`  ✓ [ID: ${registeredId}] "${spot.name}" — ${ethers.formatEther(spot.pricePerHourWei)} ETH/hr  (owner: ${owner.address})`);
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("  ✅ Spots seeded successfully!");
  console.log("════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
