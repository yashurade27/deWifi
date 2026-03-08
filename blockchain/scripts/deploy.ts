import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AirlinkMarketplace with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const AirlinkMarketplace = await ethers.getContractFactory("AirlinkMarketplace");
  const marketplace = await AirlinkMarketplace.deploy();
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("\n========================================");
  console.log("AirlinkMarketplace deployed to:", address);
  console.log("Platform owner:", deployer.address);
  console.log("========================================\n");

  // Log useful info for frontend integration
  console.log("Next steps:");
  console.log(`1. Copy this address to frontend/src/lib/contracts.ts`);
  console.log(`2. Copy the ABI from blockchain/artifacts/contracts/AirlinkMarketplace.sol/AirlinkMarketplace.json`);
  console.log(`3. Verify on Etherscan: npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
